import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { authReady, db } from '@/lib/firebase'
import { COLLECTION, getFoyerId } from '@/lib/foyer'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_RECIPES } from '@/data/defaultRecipes'
import { deletePhoto, isDataUrl, savePhoto, subscribePhotos } from '@/lib/photos'
import type { FoyerData, Recipe } from '@/types'

// Timers par champ — une file séparée par slice de données
const _timers: Record<string, ReturnType<typeof setTimeout>> = {}
// Derniers champs en attente d'écriture (pour le flush beforeunload)
const _pendingFields: Record<string, Partial<FoyerData>> = {}

/** Écriture debounced par champ : évite qu'un user écrase les données de l'autre. */
function scheduleFieldWrite(
  foyerId: string,
  fields: Partial<FoyerData>,
  onSaving: () => void,
  onSaved: () => void,
  onError: () => void,
  debounceMs = 300,
) {
  const key = Object.keys(fields).join(',')
  if (_timers[key]) clearTimeout(_timers[key])
  _pendingFields[key] = fields
  _timers[key] = setTimeout(async () => {
    delete _pendingFields[key]
    onSaving()
    const ref = doc(db, COLLECTION, foyerId)
    let attempts = 0
    const maxRetries = 3
    while (attempts < maxRetries) {
      try {
        await setDoc(ref, fields as Record<string, unknown>, { merge: true })
        onSaved()
        return
      } catch (e) {
        attempts++
        console.error(`[MealMate] Firestore write attempt ${attempts}/${maxRetries}:`, e)
        if (attempts < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempts))
        }
      }
    }
    onError()
  }, debounceMs)
}

/**
 * Le carnet de recettes repart en entier à chaque écriture (~90 Ko) : un
 * simple clic sur un cœur renvoie tout le tableau. On groupe donc plus
 * largement que les autres champs. `flushPendingWrites` garantit qu'une
 * écriture en attente part quand même si l'app passe en arrière-plan.
 */
const RECIPES_DEBOUNCE_MS = 1500

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

/** Flush immédiat de tous les champs en attente (appelé avant kill de l'app). */
function flushPendingWrites(foyerId: string) {
  const merged: Partial<FoyerData> = {}
  for (const fields of Object.values(_pendingFields)) {
    Object.assign(merged, fields)
  }
  if (Object.keys(merged).length === 0) return
  Object.values(_timers).forEach(clearTimeout)
  const ref = doc(db, COLLECTION, foyerId)
  void setDoc(ref, merged as Record<string, unknown>, { merge: true })
}

export function useFoyerSync() {
  const foyerId = getFoyerId()
  const hydrate = useAppStore((s) => s._hydrate)
  const setPhotos = useAppStore((s) => s._setPhotos)
  const setSyncStatus = useAppStore((s) => s.setSyncStatus)

  // Compteur incrémenté pendant _hydrate → le subscriber ignore les changements
  const remoteUpdateDepth = useRef(0)
  const isMergingRecipes = useRef(false)
  // Bloque les écritures Store→Firestore tant qu'on n'a pas reçu un snapshot serveur
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

      // ── Firestore → Store ────────────────────────────────────────────────────
      const unsubFirestore = onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
        setSyncStatus('synced')

        // Snapshot depuis notre propre écriture en attente → ignorer
        if (snap.metadata.hasPendingWrites) return

        if (!snap.exists()) {
          // Premier lancement : le doc n'existe pas encore, on l'initialise.
          const state = useAppStore.getState()
          const { darkMode: _dm, ...settingsToWrite } = state.settings
          void _dm
          setDoc(ref, {
            weekPlans:       state.weekPlans,
            recipes:         state.recipes,
            deletedDefaults: state.deletedDefaults,
            shoppingItems:   state.shoppingItems,
            settings:        settingsToWrite,
          }).catch(() => setSyncStatus('error'))
          hasServerData.current = true
          return
        }

        // Si c'est notre propre merge recettes, on ignore
        if (isMergingRecipes.current) return

        const data = snap.data() as FoyerData

        // ── Ajout des recettes par défaut manquantes ────────────────────────
        // On n'ajoute QUE ce qui manque. Une recette déjà présente appartient au
        // foyer : elle a pu être éditée, renommée ou vidée volontairement, on n'y
        // touche jamais. Une recette par défaut supprimée reste supprimée (on
        // mémorise son id dans `deletedDefaults`).
        const existing = data.recipes ?? []
        const existingIds = new Set(existing.map((r) => r.id))
        const deletedDefaults = new Set(data.deletedDefaults ?? [])
        const missingDefaults = DEFAULT_RECIPES.filter(
          (r) => !existingIds.has(r.id) && !deletedDefaults.has(r.id),
        )

        // ── Migration : photos base64 → sous-collection `photos` ────────────
        const split = extractPhotos([...existing, ...missingDefaults])
        data.recipes = split.recipes

        if (missingDefaults.length > 0 || split.changed) {
          isMergingRecipes.current = true
          Promise.all(
            Object.entries(split.photos).map(([recipeId, dataUrl]) =>
              savePhoto(recipeId, dataUrl).catch((e) =>
                console.error('[MealMate] Migration photo', recipeId, e),
              ),
            ),
          )
            .then(() => setDoc(ref, { recipes: data.recipes }, { merge: true }))
            .finally(() => {
              isMergingRecipes.current = false
            })
        }

        // ── Hydrate : marque le flag AVANT set() car le subscriber Zustand
        //    est appelé synchronement pendant hydrate → il doit voir le flag ──
        remoteUpdateDepth.current++
        hydrate(data)
        remoteUpdateDepth.current--

        // Débloque les écritures Store→Firestore dès qu'on a reçu des données
        // (y compris depuis le cache) pour éviter de perdre les modifications
        // locales faites entre le snapshot cache et le snapshot serveur.
        hasServerData.current = true

        if (!snap.metadata.fromCache) {
          setSyncStatus('updated')
          setTimeout(() => setSyncStatus('synced'), 2500)
        }
      }, () => setSyncStatus('error'))

      // ── Store → Firestore ────────────────────────────────────────────────────
      const unsubStore = useAppStore.subscribe((state, prev) => {
        // Ignore les changements déclenchés par l'hydratation Firestore
        if (remoteUpdateDepth.current > 0) return
        // Attend d'avoir reçu les données serveur avant d'écrire quoi que ce soit
        if (!hasServerData.current) return

        if (state.weekPlans !== prev.weekPlans) {
          scheduleFieldWrite(foyerId, { weekPlans: state.weekPlans },
            () => setSyncStatus('saving'), () => setSyncStatus('synced'), () => setSyncStatus('error'))
        }
        if (state.recipes !== prev.recipes) {
          // Une recette supprimée emporte sa photo : sans ça le document
          // `photos/{recipeId}` resterait orphelin dans Firestore.
          const liveIds = new Set(state.recipes.map((r) => r.id))
          for (const r of prev.recipes) {
            if (!liveIds.has(r.id) && state.photos[r.id]) void deletePhoto(r.id)
          }
          // Filet de sécurité : si une photo base64 se glisse dans une recette,
          // elle part dans la sous-collection au lieu de gonfler le document.
          const { recipes, photos, changed } = extractPhotos(state.recipes)
          if (changed) {
            for (const [recipeId, dataUrl] of Object.entries(photos)) {
              void savePhoto(recipeId, dataUrl).catch((e) =>
                console.error('[MealMate] Écriture photo', recipeId, e),
              )
            }
          }
          scheduleFieldWrite(foyerId, { recipes },
            () => setSyncStatus('saving'), () => setSyncStatus('synced'), () => setSyncStatus('error'),
            RECIPES_DEBOUNCE_MS)
        }
        if (state.deletedDefaults !== prev.deletedDefaults) {
          scheduleFieldWrite(foyerId, { deletedDefaults: state.deletedDefaults },
            () => setSyncStatus('saving'), () => setSyncStatus('synced'), () => setSyncStatus('error'))
        }
        if (state.shoppingItems !== prev.shoppingItems) {
          scheduleFieldWrite(foyerId, { shoppingItems: state.shoppingItems },
            () => setSyncStatus('saving'), () => setSyncStatus('synced'), () => setSyncStatus('error'))
        }
        if (state.settings !== prev.settings) {
          const { darkMode: _dm, ...settingsToWrite } = state.settings
          void _dm
          scheduleFieldWrite(foyerId, { settings: settingsToWrite },
            () => setSyncStatus('saving'), () => setSyncStatus('synced'), () => setSyncStatus('error'))
        }
      })

      // ── Photos (sous-collection dédiée) ──────────────────────────────────────
      const unsubPhotos = subscribePhotos(setPhotos)

      // ── Flush avant kill ──
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
          flushPendingWrites(foyerId)
        }
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

