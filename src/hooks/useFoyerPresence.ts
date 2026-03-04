import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getFoyerId } from '@/lib/foyer'

// Même logique que useFoyerSync : dev vs prod
const COLLECTION = import.meta.env.VITE_APP_ENV === 'dev' ? 'foyers_dev' : 'foyers'

// ── ID stable par appareil (ne change pas au refresh) ────────────────────────
const DEVICE_KEY = 'mealmate-device-id'
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

// Un membre est "en ligne" s'il a pingué dans les 2 dernières minutes
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

/**
 * Enregistre la présence de l'appareil dans Firestore et retourne
 * le nombre d'AUTRES membres actuellement connectés au foyer.
 */
export function useFoyerPresence(): number {
  const [othersCount, setOthersCount] = useState(0)

  useEffect(() => {
    const foyerId   = getFoyerId()
    const deviceId  = getDeviceId()
    const presenceRef = doc(db, COLLECTION, foyerId, 'presence', deviceId)
    const presenceCol = collection(db, COLLECTION, foyerId, 'presence')

    // Écrit (ou met à jour) notre entrée de présence
    const ping = () => {
      setDoc(presenceRef, { lastSeen: serverTimestamp() }).catch(() => {})
    }

    ping()
    const interval = setInterval(ping, 30_000)

    // Écoute la sous-collection pour compter les membres actifs AUTRES que soi
    const unsubscribe = onSnapshot(presenceCol, (snap) => {
      const threshold = Date.now() - ONLINE_THRESHOLD_MS
      const others = snap.docs.filter((d) => {
        if (d.id === deviceId) return false // exclut l'appareil courant
        const lastSeen = d.data().lastSeen as Timestamp | null
        if (!lastSeen) return false
        return lastSeen.toMillis() > threshold
      })
      setOthersCount(others.length)
    }, () => {
      setOthersCount(0)
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
      deleteDoc(presenceRef).catch(() => {})
    }
  }, [])

  return othersCount
}
