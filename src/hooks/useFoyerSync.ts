import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getFoyerId } from '@/lib/foyer'
import { useAppStore } from '@/store/useAppStore'
import type { FoyerData } from '@/types'

// 'foyers_dev' sur la branche dev, 'foyers' en prod
const COLLECTION = import.meta.env.VITE_APP_ENV === 'dev' ? 'foyers_dev' : 'foyers'

// Timers par champ — une file séparée par slice de données
const _timers: Record<string, ReturnType<typeof setTimeout>> = {}

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
  _timers[key] = setTimeout(async () => {
    onSaving()
    try {
      const ref = doc(db, COLLECTION, foyerId)
      await updateDoc(ref, fields as Record<string, unknown>)
      onSaved()
    } catch (e) {
      console.error('[MealMate] Erreur Firestore write:', e)
      onError()
    }
  }, 600)
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
      hydrate(snap.data() as FoyerData)
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

    return () => {
      unsubFirestore()
      unsubStore()
      Object.values(_timers).forEach(clearTimeout)
    }
  }, [foyerId, hydrate, setSyncStatus])
}

