/**
 * Repère une durée dans le texte d'une étape.
 *
 * Le minuteur du mode cuisine démarrait à zéro sans rien savoir de la recette :
 * l'étape annonçait « enfourner 30 min », il fallait régler soi-même. On lit
 * désormais la durée dans le texte pour la proposer d'un geste.
 *
 * Seules les durées explicites sont retenues : mieux vaut ne rien proposer que
 * de lancer un compte à rebours sur une valeur inventée.
 */

/** Durée trouvée dans une étape, en secondes. */
export interface DureeTrouvee {
  secondes: number
  /** Libellé tel qu'écrit dans l'étape, pour l'afficher sur le bouton. */
  libelle: string
}

const RE_DUREE =
  /(\d+)\s*(?:à|-|, )?\s*(\d+)?\s*(secondes?|sec\b|s\b|minutes?|min\b|mn\b|heures?|h\b)/gi

function enSecondes(valeur: number, unite: string): number {
  const u = unite.toLowerCase()
  if (u.startsWith('h')) return valeur * 3600
  if (u.startsWith('s')) return valeur
  return valeur * 60
}

/**
 * Renvoie la première durée mentionnée, ou null.
 * Sur un intervalle (« 3 à 4 min »), retient la borne haute : mieux vaut
 * vérifier une cuisson un peu tard que la manquer.
 */
export function lireDuree(texte: string): DureeTrouvee | null {
  if (!texte) return null
  RE_DUREE.lastIndex = 0

  let m: RegExpExecArray | null
  while ((m = RE_DUREE.exec(texte))) {
    const [brut, premier, second, unite] = m

    // « 180 °C » ou « 200 g » ne sont pas des durées : l'unité fait foi, mais
    // un « s » isolé colle à trop de mots pour être pris au sérieux seul.
    if (/^s$/i.test(unite) && !/\bsecondes?\b|\bsec\b/i.test(brut)) continue

    const valeur = second ? Math.max(Number(premier), Number(second)) : Number(premier)
    if (!Number.isFinite(valeur) || valeur <= 0) continue

    const secondes = enSecondes(valeur, unite)
    // Au-delà de six heures, c'est un repos ou une marinade, pas un minuteur.
    if (secondes > 6 * 3600) continue

    return { secondes, libelle: brut.trim() }
  }
  return null
}
