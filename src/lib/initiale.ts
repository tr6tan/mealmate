/**
 * Lettre de classement d'un nom de recette.
 *
 * Sert à l'index alphabétique du livret. Trois pièges de la langue :
 *
 *, les accents doivent se ranger sous la lettre nue, sinon « Œufs mimosa »
 *    et « Épinards » se retrouvent après Z, où personne ne les cherche ;
 *, les ligatures ne se décomposent pas par NFD : « Œ » exige sa propre
 *    règle, comme pour les rayons et les stickers ;
 *, un nom qui commence par un chiffre ou un symbole n'a pas de lettre : il
 *    va sous « # », en fin d'index.
 */

/** Lettre sous laquelle une recette est classée : A, Z, ou « # ». */
export function initiale(nom: string): string {
  const nu = (nom ?? '')
    .trim()
    .toUpperCase()
    .replace(/Œ/g, 'OE')
    .replace(/Æ/g, 'AE')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

  const premier = nu[0]
  return premier && premier >= 'A' && premier <= 'Z' ? premier : '#'
}

/** Les 26 lettres, dans l'ordre, suivies du fourre-tout. */
export const LETTRES: string[] = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
  '#',
]

/**
 * Compare deux noms comme le ferait un index imprimé : accents ignorés pour
 * le classement, mais pas pour l'affichage.
 */
export function comparerNoms(a: string, b: string): number {
  return a.localeCompare(b, 'fr', { sensitivity: 'base', numeric: true })
}
