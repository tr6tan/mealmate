import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getFoyerId } from '@/lib/foyer'
import { useAppStore } from '@/store/useAppStore'
import { DEFAULT_RECIPES } from '@/data/defaultRecipes'
import type { FoyerData } from '@/types'

// 'foyers_dev' sur la branche dev, 'foyers' en prod
const COLLECTION = import.meta.env.VITE_APP_ENV === 'dev' ? 'foyers_dev' : 'foyers'

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
  }, 300) // 300ms debounce pour laisser les écritures groupées se stabiliser
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
  const setSyncStatus = useAppStore((s) => s.setSyncStatus)

  // Compteur incrémenté pendant _hydrate → le subscriber ignore les changements
  const remoteUpdateDepth = useRef(0)
  const isMergingRecipes = useRef(false)
  // Bloque les écritures Store→Firestore tant qu'on n'a pas reçu un snapshot serveur
  const hasServerData = useRef(false)

  useEffect(() => {
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
          weekPlans:     state.weekPlans,
          recipes:       state.recipes,
          shoppingItems: state.shoppingItems,
          settings:      settingsToWrite,
        }).catch(() => setSyncStatus('error'))
        hasServerData.current = true
        return
      }

      // Si c'est notre propre merge recettes, on ignore
      if (isMergingRecipes.current) return

      const data = snap.data() as FoyerData

      // ── Merge des recettes par défaut ───────────────────────────────────
      const beforeClean = data.recipes ?? []
      data.recipes = beforeClean.filter((r) => !r.name.includes('+'))
      let needsWrite = data.recipes.length !== beforeClean.length

      const defaultMap = new Map(DEFAULT_RECIPES.map((r) => [r.id, r]))
      const existingIds = new Set((data.recipes ?? []).map((r) => r.id))
      const missingDefaults = DEFAULT_RECIPES.filter((r) => !existingIds.has(r.id))

      needsWrite = needsWrite || missingDefaults.length > 0
      const updatedRecipes = (data.recipes ?? []).map((recipe) => {
        const def = defaultMap.get(recipe.id)
        if (!def) return recipe
        const { name, emoji, photo, time, ingredients, steps, period, rapide } = def
        const changed =
          recipe.name !== name || recipe.emoji !== emoji || recipe.photo !== photo ||
          recipe.time !== time || recipe.period !== period || recipe.rapide !== rapide
        if (!changed) return recipe
        needsWrite = true
        return { ...recipe, name, emoji, photo, time, ingredients, steps, period, rapide }
      })

      data.recipes = [...updatedRecipes, ...missingDefaults]
      if (needsWrite) {
        isMergingRecipes.current = true
        setDoc(ref, { recipes: data.recipes }, { merge: true }).finally(() => {
          isMergingRecipes.current = false
        })
      }

      // ── Hydrate : marque le flag AVANT set() car le subscriber Zustand
      //    est appelé synchronement pendant hydrate → il doit voir le flag ──
      remoteUpdateDepth.current++
      hydrate(data)
      remoteUpdateDepth.current--

      // Seul un snapshot serveur (pas cache) débloque les écritures
      if (!snap.metadata.fromCache) {
        hasServerData.current = true
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
        scheduleFieldWrite(foyerId, { recipes: state.recipes },
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

    // ── Flush avant kill ──
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingWrites(foyerId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      unsubFirestore()
      unsubStore()
      document.removeEventListener('visibilitychange', handleVisibility)
      Object.values(_timers).forEach(clearTimeout)
    }
  }, [foyerId, hydrate, setSyncStatus])
}

