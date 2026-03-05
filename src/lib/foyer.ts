// ID du foyer partagé unique — tout le monde qui ouvre l'app accède aux mêmes données.
const FOYER_ID = 'c1cfad8f-ddba-4518-a320-7776f3c0f5f7'

export function getFoyerId(): string {
  return FOYER_ID
}

/** URL de l'app (pour le QR code de partage). */
export function getSiteUrl(): string {
  return window.location.origin
}
