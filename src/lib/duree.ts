/**
 * Durées de recette : lecture et écriture du format de l'app.
 *
 * Le temps était saisi par une grille de huit puces plus un mode texte libre,
 * soit trois rangées de boutons pour une valeur qui tient sur une ligne. Un
 * incrément suffit, à condition qu'il avance par pas utiles : de 5 en 5 sous
 * la demi-heure, de 15 en 15 au-dela, parce que personne n'annonce une recette
 * en 1h05.
 */

/** Minutes lues dans "25 min", "1h30", "1 h". */
export function enMinutes(temps: string): number {
  const h = temps.match(/(\d+)\s*h(?:\s*(\d+))?/i)
  if (h) return Number(h[1]) * 60 + Number(h[2] ?? 0)
  const m = temps.match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

/** Met des minutes au format de l'app : "45 min", "2h", "1h30". */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

export const DUREE_MIN = 5
export const DUREE_MAX = 360

/** Pas d'incrément a une durée donnée : fin au début, large ensuite. */
function pas(minutes: number): number {
  if (minutes < 30) return 5
  if (minutes < 120) return 15
  return 30
}

/** Durée suivante vers le haut, bornée. */
export function dureeSuivante(minutes: number): number {
  return Math.min(DUREE_MAX, minutes + pas(minutes))
}

/**
 * Durée précédente, bornée.
 *
 * Le pas se calcule sur la valeur d'arrivée et non sur celle de départ : sans
 * cela, descendre de 30 min retirait 15 et rendait 15, alors que monter depuis
 * 15 ajoutait 5 et rendait 20. Les deux flèches ne se répondaient pas.
 */
export function dureePrecedente(minutes: number): number {
  const candidat = minutes - pas(minutes)
  const p = pas(candidat)
  return Math.max(DUREE_MIN, minutes - p)
}
