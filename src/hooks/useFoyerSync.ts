import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getFoyerId } from '@/lib/foyer'
import { useAppStore } from '@/store/useAppStore'
import type { FoyerData } from '@/types'

// 'foyers_dev' sur la branche dev, 'foyers' en prod
const COLLECTION = import.meta.env.VITE_APP_ENV === 'dev' ? 'foyers_dev' : 'foyers'
let _writeTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleWrite(foyerId: string, data: FoyerData, onError: () => void) {
  if (_writeTimeout) clearTimeout(_writeTimeout)
  _writeTimeout = setTimeout(async () => {
    try {
      await setDoc(doc(db, COLLECTION, foyerId), data)
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
        const state = useAppStore.getState()
        setDoc(ref, {
          weekPlan:      state.weekPlan,
          recipes:       state.recipes,
          shoppingItems: state.shoppingItems,
          settings:      state.settings,
        } satisfies FoyerData).catch(() => setSyncStatus('error'))
        return
      }
      isRemoteUpdate.current = true
      hydrate(snap.data() as FoyerData)
      isRemoteUpdate.current = false
    }, () => setSyncStatus('error'))

    // ── Store → Firestore ────────────────────────────────────────────────────
    const unsubStore = useAppStore.subscribe((state, prev) => {
      if (isRemoteUpdate.current) return
      if (
        state.weekPlan      !== prev.weekPlan      ||
        state.recipes       !== prev.recipes       ||
        state.shoppingItems !== prev.shoppingItems ||
        state.settings      !== prev.settings
      ) {
        scheduleWrite(foyerId, {
          weekPlan:      state.weekPlan,
          recipes:       state.recipes,
          shoppingItems: state.shoppingItems,
          settings:      state.settings,
        }, () => setSyncStatus('error'))
      }
    })

    return () => {
      unsubFirestore()
      unsubStore()
      if (_writeTimeout) clearTimeout(_writeTimeout)
    }
  }, [foyerId, hydrate, setSyncStatus])
}

