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
 * le nombre de membres actuellement connectés au foyer.
 */
export function useFoyerPresence(): number {
  const [onlineCount, setOnlineCount] = useState(1)

  useEffect(() => {
    const foyerId   = getFoyerId()
    const deviceId  = getDeviceId()
    const presenceRef = doc(db, 'foyers', foyerId, 'presence', deviceId)
    const presenceCol = collection(db, 'foyers', foyerId, 'presence')

    // Écrit (ou met à jour) notre entrée de présence
    const ping = () => {
      setDoc(presenceRef, { lastSeen: serverTimestamp() }).catch(() => {})
    }

    ping()
    const interval = setInterval(ping, 30_000)

    // Écoute la sous-collection pour compter les membres actifs
    const unsubscribe = onSnapshot(presenceCol, (snap) => {
      const threshold = Date.now() - ONLINE_THRESHOLD_MS
      const active = snap.docs.filter((d) => {
        const lastSeen = d.data().lastSeen as Timestamp | null
        if (!lastSeen) return false
        return lastSeen.toMillis() > threshold
      })
      setOnlineCount(Math.max(1, active.length))
    }, () => {
      // En cas d'erreur Firestore, on affiche au moins 1
      setOnlineCount(1)
    })

    // Nettoyage : on retire notre présence quand on ferme l'onglet
    return () => {
      clearInterval(interval)
      unsubscribe()
      deleteDoc(presenceRef).catch(() => {})
    }
  }, [])

  return onlineCount
}
