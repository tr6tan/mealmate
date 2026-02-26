const FOYER_KEY = 'mealmate-foyer-id'

/** Récupère ou crée l'ID du foyer.
 *  Si l'URL contient ?foyer=xxx, on l'adopte (lien d'invitation). */
export function getFoyerId(): string {
  // 1. Lien d'invitation via URL param
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('foyer')
  if (fromUrl) {
    localStorage.setItem(FOYER_KEY, fromUrl)
    // Nettoie l'URL sans recharger la page
    window.history.replaceState({}, '', window.location.pathname)
    return fromUrl
  }
  // 2. LocalStorage
  const stored = localStorage.getItem(FOYER_KEY)
  if (stored) return stored
  // 3. Nouveau foyer
  const newId = crypto.randomUUID()
  localStorage.setItem(FOYER_KEY, newId)
  return newId
}

export function getInviteUrl(): string {
  return `${window.location.origin}?foyer=${getFoyerId()}`
}

export function resetFoyer(): void {
  const newId = crypto.randomUUID()
  localStorage.setItem(FOYER_KEY, newId)
  window.location.reload()
}
