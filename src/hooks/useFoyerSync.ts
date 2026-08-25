import { useEffect, useRef } from 'react'
import { deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { authReady, db } from '@/lib/firebase'
import { COLLECTION, getFoyerId } from '@/lib/foyer'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_RECIPES } from '@/data/defaultRecipes'
import { deletePhoto, isDataUrl, savePhoto, subscribePhotos } from '@/lib/photos'
import {
  diffRecipes,
  diffShoppingItems,
  diffWeekPlans,
  mergeRecipes,
  readShoppingItems,
  toShoppingMap,
  type FieldWrites,
} from '@/lib/syncDiff'
import type { FoyerData, Recipe } from '@/types'

// Timers par champ — une file séparée par slice de données
const _timers: Record<string, ReturnType<typeof setTimeout>> = {}
// Dernières écritures en attente (pour le flush quand l'app passe en fond)
const _pendingWrites: Record<string, FieldWrites> = {}

/**
 * Écriture debounced, par chemins de champs.
 *
 * On envoie `{ 'weekPlans.2026-08-24.1.midi': … }` plutôt que `weekPlans`
 * entier : c'est Firestore qui fusionne, côté serveur. Sans ça, deux membres
 * du foyer qui planifient en même temps s'écrasent mutuellement, puisque
 * chacun renvoie une structure complète ignorant la modification de l'autre.
 */
function scheduleWrite(
  foyerId: string,
  cle: string,
  writes: FieldWrites,
  onSaving: () => void,
  onSaved: () => void,
  onError: () => void,
  debounceMs = 300,
) {
  if (Object.keys(writes).length === 0) return

  if (_timers[cle]) clearTimeout(_timers[cle])
  // Les écritures en attente s'accumulent : deux modifications successives de
  // créneaux différents doivent toutes deux partir.
  _pendingWrites[cle] = { ...(_pendingWrites[cle] ?? {}), ...writes }

  _timers[cle] = setTimeout(async () => {
    const aEnvoyer = _pendingWrites[cle]
    delete _pendingWrites[cle]
    if (!aEnvoyer) return
    onSaving()

    const ref = doc(db, COLLECTION, foyerId)
    let essais = 0
    const maxEssais = 3
    while (essais < maxEssais) {
      try {
        await updateDoc(ref, aEnvoyer)
        onSaved()
        return
      } catch (e) {
        // `updateDoc` exige un document existant : si le foyer vient d'être
        // créé (ou a été supprimé), on retombe sur une écriture fusionnée.
        if ((e as { code?: string }).code === 'not-found') {
          try {
            await setDoc(ref, aEnvoyer as Record<string, unknown>, { merge: true })
            onSaved()
            return
          } catch { /* on repasse par la boucle de réessai */ }
        }
        essais++
        console.error(`[MealMate] Écriture Firestore ${essais}/${maxEssais}:`, e)
        if (essais < maxEssais) await new Promise((r) => setTimeout(r, 1000 * essais))
      }
    }
    onError()
  }, debounceMs)
}

/** Flush immédiat de tout ce qui est en attente (app mise en arrière-plan). */
function flushPendingWrites(foyerId: string) {
  const fusion: FieldWrites = {}
  for (const writes of Object.values(_pendingWrites)) Object.assign(fusion, writes)
  if (Object.keys(fusion).length === 0) return
  Object.values(_timers).forEach(clearTimeout)
  for (const cle of Object.keys(_pendingWrites)) delete _pendingWrites[cle]
  // Firestore met l'écriture en file dans IndexedDB : elle repart au prochain
  // lancement même si l'app est tuée avant la fin de la requête.
  void updateDoc(doc(db, COLLECTION, foyerId), fusion)
}

/**
 * Sépare les photos base64 des recettes.
 * Le document foyer plafonne à 1 Mio : une photo n'y a jamais sa place, elle
 * part dans la sous-collection `photos` (cf. lib/photos.ts).
 */
function extractPhotos(recipes: Recipe[]): {
  recipes: Recipe[]
  photos: Record<string, string>
  changed: boolean
} {
  const photos: Record<string, string> = {}
  let changed = false
  const cleaned = recipes.map((r) => {
    if (!isDataUrl(r.photo)) return r
    photos[r.id] = r.photo as string
    changed = true
    const { photo: _photo, ...rest } = r
    void _photo
    return rest as Recipe
  })
  return { recipes: changed ? cleaned : recipes, photos, changed }
}

/** Écritures correspondant au carnet de recettes, réduites à leur delta. */
function recipeWrites(recipes: Recipe[]): FieldWrites {
  const { custom, overrides } = diffRecipes(recipes, DEFAULT_RECIPES)
  return { recipesCustom: custom, recipesOverrides: overrides }
}

export function useFoyerSync() {
  const foyerId = getFoyerId()
  const hydrate = useAppStore((s) => s._hydrate)
  const setPhotos = useAppStore((s) => s._setPhotos)
  const setSyncStatus = useAppStore((s) => s.setSyncStatus)

  // Compteur incrémenté pendant _hydrate → le subscriber ignore les changements
  const remoteUpdateDepth = useRef(0)
  const isMigrating = useRef(false)
  // Bloque les écritures Store→Firestore tant qu'on n'a pas reçu de snapshot
  const hasServerData = useRef(false)

  useEffect(() => {
    // Les règles Firestore exigent une session : on attend la connexion
    // anonyme avant d'ouvrir les flux, sinon les premières requêtes partent
    // sans jeton et sont refusées.
    let cancelled = false
    const cleanups: Array<() => void> = []

    void authReady.then(() => {
      if (!cancelled) cleanups.push(...subscribeAll())
    })

    function subscribeAll(): Array<() => void> {
      const ref = doc(db, COLLECTION, foyerId)

      // ── Firestore → Store ──────────────────────────────────────────────────
      const unsubFirestore = onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
        setSyncStatus('synced')

        // Snapshot issu de notre propre écriture en attente → déjà appliqué
        if (snap.metadata.hasPendingWrites) return

        if (!snap.exists()) {
          // Premier lancement : on initialise le document.
          const state = useAppStore.getState()
          const { darkMode: _dm, ...settingsToWrite } = state.settings
          void _dm
          setDoc(ref, {
            weekPlans:       state.weekPlans,
            deletedDefaults: state.deletedDefaults,
            shoppingItems:   toShoppingMap(state.shoppingItems),
            settings:        settingsToWrite,
            ...recipeWrites(state.recipes),
          }).catch(() => setSyncStatus('error'))
          hasServerData.current = true
          return
        }

        if (isMigrating.current) return

        const data = snap.data() as FoyerData
        const supprimees = data.deletedDefaults ?? []

        // ── Carnet : ancien format (tableau complet) ou delta ────────────────
        const ancienFormat = Array.isArray(data.recipes)
        let recipes: Recipe[]
        if (ancienFormat) {
          // Les recettes livrées absentes du tableau n'ont jamais été
          // supprimées volontairement (le champ `deletedDefaults` est récent) :
          // on les réintroduit avant de calculer le delta.
          const presentes = new Set(data.recipes!.map((r) => r.id))
          const manquantes = DEFAULT_RECIPES.filter(
            (r) => !presentes.has(r.id) && !supprimees.includes(r.id),
          )
          recipes = [...data.recipes!, ...manquantes]
        } else {
          recipes = mergeRecipes(
            DEFAULT_RECIPES,
            { custom: data.recipesCustom ?? [], overrides: data.recipesOverrides ?? {} },
            supprimees,
          )
        }

        // ── Liste de courses : tableau (ancien format) → map indexée ─────────
        // Un tableau ne permet pas d'adresser un article : la liste repartait
        // en entier à chaque coche, et deux personnes en courses ensemble
        // s'écrasaient mutuellement.
        // Ordre d'affichage : il venait de la position dans le tableau, une map
        // n'en garantit aucun. On le fige dans `addedAt`, pour les listes en
        // ancien format comme pour les articles créés avant ce champ.
        const coursesLues = readShoppingItems(data.shoppingItems)
        const sansHorodatage = coursesLues.filter((i) => !i.addedAt)
        if (Array.isArray(data.shoppingItems) || sansHorodatage.length > 0) {
          const base = Date.now()
          const horodates = coursesLues.map((item, i) => ({
            ...item,
            addedAt: item.addedAt ?? base - i,
          }))
          data.shoppingItems = toShoppingMap(horodates)
          updateDoc(ref, { shoppingItems: data.shoppingItems }).catch((e) =>
            console.error('[MealMate] Horodatage de la liste de courses:', e),
          )
        }

        // ── Photos base64 encore dans le document → sous-collection ──────────
        const split = extractPhotos(recipes)
        recipes = split.recipes

        if (ancienFormat || split.changed) {
          isMigrating.current = true
          Promise.all(
            Object.entries(split.photos).map(([recipeId, dataUrl]) =>
              savePhoto(recipeId, dataUrl).catch((e) =>
                console.error('[MealMate] Migration photo', recipeId, e),
              ),
            ),
          )
            .then(() =>
              updateDoc(ref, {
                ...recipeWrites(recipes),
                // Le tableau complet ne sert plus à rien : ~72 Ko de copies
                // conformes du code, relues et réécrites à chaque changement.
                ...(ancienFormat ? { recipes: deleteField() } : {}),
              }),
            )
            .catch((e) => console.error('[MealMate] Migration du carnet:', e))
            .finally(() => {
              isMigrating.current = false
            })
        }

        // ── Hydratation ─────────────────────────────────────────────────────
        // Le flag est posé AVANT set() : le subscriber Zustand est appelé
        // synchronement pendant l'hydratation et doit le voir.
        remoteUpdateDepth.current++
        hydrate({ ...data, recipes })
        remoteUpdateDepth.current--

        // ── Propagation de la purge des semaines anciennes ───────────────────
        // Le store écarte les semaines de plus de 4 semaines, mais cette purge
        // restait locale : l'écriture se faisait en `merge`, qui n'efface
        // jamais de clé. Le document accumulait donc toutes les semaines
        // jamais vues (11 semaines, 12 Ko, sur un foyer réel).
        const gardees = new Set(Object.keys(useAppStore.getState().weekPlans))
        const aPurger: FieldWrites = {}
        for (const weekKey of Object.keys(data.weekPlans ?? {})) {
          if (!gardees.has(weekKey)) aPurger[`weekPlans.${weekKey}`] = deleteField()
        }
        if (Object.keys(aPurger).length > 0) {
          updateDoc(ref, aPurger).catch((e) =>
            console.error('[MealMate] Purge des semaines anciennes:', e),
          )
        }

        // Débloque les écritures dès la première donnée reçue (cache inclus),
        // sinon les modifications locales faites entre-temps sont perdues.
        hasServerData.current = true

        if (!snap.metadata.fromCache) {
          setSyncStatus('updated')
          setTimeout(() => setSyncStatus('synced'), 2500)
        }
      }, () => setSyncStatus('error'))

      // ── Store → Firestore ──────────────────────────────────────────────────
      const saving = () => setSyncStatus('saving')
      const saved = () => setSyncStatus('synced')
      const failed = () => setSyncStatus('error')

      const unsubStore = useAppStore.subscribe((state, prev) => {
        // Changements provenant de l'hydratation : rien à renvoyer
        if (remoteUpdateDepth.current > 0) return
        if (!hasServerData.current) return

        if (state.weekPlans !== prev.weekPlans) {
          scheduleWrite(
            foyerId,
            'weekPlans',
            diffWeekPlans(prev.weekPlans, state.weekPlans),
            saving, saved, failed,
          )
        }

        if (state.recipes !== prev.recipes) {
          // Une recette supprimée emporte sa photo, sinon le document
          // `photos/{recipeId}` reste orphelin.
          const vivantes = new Set(state.recipes.map((r) => r.id))
          for (const r of prev.recipes) {
            if (!vivantes.has(r.id) && state.photos[r.id]) void deletePhoto(r.id)
          }
          // Filet : une photo base64 glissée dans une recette part dans la
          // sous-collection au lieu de gonfler le document.
          const { recipes, photos, changed } = extractPhotos(state.recipes)
          if (changed) {
            for (const [recipeId, dataUrl] of Object.entries(photos)) {
              void savePhoto(recipeId, dataUrl).catch((e) =>
                console.error('[MealMate] Écriture photo', recipeId, e),
              )
            }
          }
          scheduleWrite(foyerId, 'recipes', recipeWrites(recipes), saving, saved, failed)
        }

        if (state.deletedDefaults !== prev.deletedDefaults) {
          scheduleWrite(
            foyerId, 'deletedDefaults',
            { deletedDefaults: state.deletedDefaults }, saving, saved, failed,
          )
        }

        if (state.shoppingItems !== prev.shoppingItems) {
          scheduleWrite(
            foyerId, 'shoppingItems',
            diffShoppingItems(prev.shoppingItems, state.shoppingItems),
            saving, saved, failed,
          )
        }

        if (state.settings !== prev.settings) {
          const { darkMode: _dm, ...settingsToWrite } = state.settings
          void _dm
          scheduleWrite(foyerId, 'settings', { settings: settingsToWrite }, saving, saved, failed)
        }
      })

      // ── Photos (sous-collection dédiée) ────────────────────────────────────
      const unsubPhotos = subscribePhotos(setPhotos)

      // ── Flush quand l'app passe en arrière-plan ────────────────────────────
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') flushPendingWrites(foyerId)
      }
      document.addEventListener('visibilitychange', handleVisibility)

      return [
        unsubFirestore,
        unsubStore,
        unsubPhotos,
        () => document.removeEventListener('visibilitychange', handleVisibility),
        () => Object.values(_timers).forEach(clearTimeout),
      ]
    }

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
    }
  }, [foyerId, hydrate, setPhotos, setSyncStatus])
}
