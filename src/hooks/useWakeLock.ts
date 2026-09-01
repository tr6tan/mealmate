import { useEffect } from 'react'

/**
 * Maintient l'écran allumé tant que la condition est vraie.
 *
 * En cuisine, le téléphone est posé sur le plan de travail et l'écran
 * s'éteignait au bout de quelques dizaines de secondes : il fallait le
 * déverrouiller les mains sales entre deux étapes.
 *
 * L'API Screen Wake Lock n'est pas disponible partout (Safari iOS depuis 16.4,
 * absente en navigation privée sur certains navigateurs) et le verrou est
 * relâché par le système dès que la page passe en arrière-plan : on le
 * redemande au retour.
 */
export function useWakeLock(actif: boolean) {
  useEffect(() => {
    if (!actif) return
    if (!('wakeLock' in navigator)) return

    let sentinelle: WakeLockSentinel | null = null
    let annule = false

    const demander = async () => {
      try {
        sentinelle = await navigator.wakeLock.request('screen')
      } catch {
        // Refus du système (batterie faible, onglet masqué) : l'écran
        // s'éteindra normalement, rien de plus à faire.
      }
    }

    const surRetour = () => {
      if (!annule && document.visibilityState === 'visible' && !sentinelle) void demander()
    }

    void demander()
    document.addEventListener('visibilitychange', surRetour)

    return () => {
      annule = true
      document.removeEventListener('visibilitychange', surRetour)
      void sentinelle?.release().catch(() => {})
      sentinelle = null
    }
  }, [actif])
}
