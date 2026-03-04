const FOYER_KEY        = 'mealmate-foyer-id'
const FOYER_IS_INVITE  = 'mealmate-foyer-invite'

/** Récupère ou crée l'ID du foyer.
 *  Si l'URL contient ?foyer=xxx, on l'adopte (lien d'invitation).
 *  Si l'ID change, on vide le store local et on force un rechargement
 *  pour éviter que les données de l'ancien foyer polluent le nouveau. */
export function getFoyerId(): string {
  const params  = new URLSearchParams(window.location.search)
  const fromUrl = params.get('foyer')

  if (fromUrl) {
    const stored = localStorage.getItem(FOYER_KEY)
    if (stored !== fromUrl) {
      // Nouveau foyer (invitation) : on mémorise qu'on est un invité,
      // on vide le store Zustand local, et on recharge proprement.
      localStorage.setItem(FOYER_KEY, fromUrl)
      localStorage.setItem(FOYER_IS_INVITE, '1')
      localStorage.removeItem('mealmate-store')
      // Rechargement sans le param ?foyer= pour éviter une boucle
      window.location.replace(window.location.pathname)
      return fromUrl // jamais atteint (le reload se produit avant)
    }
    // Même foyer : juste nettoyer l'URL
    window.history.replaceState({}, '', window.location.pathname)
    return fromUrl
  }

  const stored = localStorage.getItem(FOYER_KEY)
  if (stored) return stored

  // Nouveau foyer créé localement
  const newId = crypto.randomUUID()
  localStorage.setItem(FOYER_KEY, newId)
  localStorage.removeItem(FOYER_IS_INVITE) // pas un invité
  return newId
}

/** Renvoie true si le foyer courant a été rejoint via un lien d'invitation. */
export function isFoyerInvite(): boolean {
  return localStorage.getItem(FOYER_IS_INVITE) === '1'
}

export function getInviteUrl(): string {
  return `${window.location.origin}?foyer=${getFoyerId()}`
}

export function resetFoyer(): void {
  const newId = crypto.randomUUID()
  localStorage.setItem(FOYER_KEY, newId)
  window.location.reload()
}
