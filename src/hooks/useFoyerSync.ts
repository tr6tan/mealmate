import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
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
  // Mémorise les champs en attente pour le flush beforeunload
  _pendingFields[key] = fields
  // Délai réduit à 0 : Firestore gère lui-même le batching et la file offline
  _timers[key] = setTimeout(async () => {
    delete _pendingFields[key]
    onSaving()
    try {
      const ref = doc(db, COLLECTION, foyerId)
      await updateDoc(ref, fields as Record<string, unknown>)
      onSaved()
    } catch (e) {
      console.error('[MealMate] Erreur Firestore write:', e)
      onError()
    }
  }, 0)
}

/** Flush immédiat de tous les champs en attente (appelé avant kill de l'app). */
function flushPendingWrites(foyerId: string) {
  const merged: Partial<FoyerData> = {}
  for (const fields of Object.values(_pendingFields)) {
    Object.assign(merged, fields)
  }
  if (Object.keys(merged).length === 0) return
  // Annule les debounces en cours
  Object.values(_timers).forEach(clearTimeout)
  // Écrit immédiatement (best-effort, ne bloque pas le kill)
  const ref = doc(db, COLLECTION, foyerId)
  void updateDoc(ref, merged as Record<string, unknown>)
}

export function useFoyerSync() {
  const foyerId = getFoyerId()
  const hydrate = useAppStore((s) => s._hydrate)
  const setSyncStatus = useAppStore((s) => s.setSyncStatus)
  const isRemoteUpdate = useRef(false)

  useEffect(() => {
    const ref = doc(db, COLLECTION, foyerId)

    // ── Firestore → Store ────────────────────────────────────────────────────
    const unsubFirestore = onSnapshot(ref, (snap) => {
      setSyncStatus('synced')
      if (!snap.exists()) {
        // Premier lancement : initialise le doc Firestore
        const state = useAppStore.getState()
        const { darkMode: _dm, ...settingsToWrite } = state.settings
        void _dm
        setDoc(ref, {
          weekPlans:     state.weekPlans,
          recipes:       state.recipes,
          shoppingItems: state.shoppingItems,
          settings:      settingsToWrite,
        }).catch(() => setSyncStatus('error'))
        return
      }
      // Mise à jour distante → hydrate sans écraser le darkMode local
      isRemoteUpdate.current = true
      const data = snap.data() as FoyerData

      // ── Merge des recettes par défaut ───────────────────────────────────
      // 1. Injecte les nouvelles recettes par défaut manquantes
      // 2. Met à jour les champs modifiés des recettes par défaut existantes
      //    (nom, emoji, photo, temps, ingrédients, étapes, période, rapide)
      //    sans écraser les préférences utilisateur (fav)
      const defaultMap = new Map(DEFAULT_RECIPES.map((r) => [r.id, r]))
      const existingIds = new Set((data.recipes ?? []).map((r) => r.id))
      const missingDefaults = DEFAULT_RECIPES.filter((r) => !existingIds.has(r.id))

      let needsWrite = missingDefaults.length > 0
      const updatedRecipes = (data.recipes ?? []).map((recipe) => {
        const def = defaultMap.get(recipe.id)
        if (!def) return recipe // recette custom → intouchable
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
        void updateDoc(ref, { recipes: data.recipes })
      }

      hydrate(data)
      isRemoteUpdate.current = false
      // Signale brièvement qu'une maj distante est arrivée
      setSyncStatus('updated')
      setTimeout(() => setSyncStatus('synced'), 2500)
    }, () => setSyncStatus('error'))

    // ── Store → Firestore ────────────────────────────────────────────────────
    // On n'écrit que les champs qui ont effectivement changé
    const unsubStore = useAppStore.subscribe((state, prev) => {
      if (isRemoteUpdate.current) return

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
        // darkMode est une préférence locale → ne pas synchroniser
        const { darkMode: _dm, ...settingsToWrite } = state.settings
        void _dm
        scheduleFieldWrite(foyerId, { settings: settingsToWrite },
          () => setSyncStatus('saving'), () => setSyncStatus('synced'), () => setSyncStatus('error'))
      }
    })

    // ── Flush avant kill (visibilitychange est plus fiable que beforeunload sur iOS PWA) ──
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

