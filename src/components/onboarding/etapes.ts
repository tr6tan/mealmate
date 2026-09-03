/**
 * Les écrans d'accueil.
 *
 * Quatre, pas plus. Un accueil qu'on balaye six fois se termine par un appui
 * sur « Passer », et l'app reste aussi obscure qu'avant.
 *
 * Le choix des quatre ne suit pas la liste des fonctionnalités mais ce qui ne
 * se devine pas en ouvrant l'app :
 *
 *  - que le foyer est partagé, ce qui est le coeur du principe et reste
 *    entièrement invisible ;
 *  - qu'on remplit la semaine en touchant un créneau vide, le geste de base ;
 *  - que la liste de courses se déduit du menu, le vrai gain, caché derrière
 *    un bouton ;
 *  - qu'une recette s'ajoute en photographiant une page.
 *
 * Le reste (mode cuisine, portions, filtres, index alphabétique) se découvre
 * en se servant de l'app et n'a pas besoin d'être annoncé.
 */

export interface EtapeAccueil {
  /** Titre court, une ligne. */
  titre: string
  /** Deux phrases au plus : c'est un panneau, pas une notice. */
  texte: string
  /** Dessin, en toutes lettres pour rester lisible dans le code. */
  dessin: 'foyer' | 'semaine' | 'courses' | 'photo'
}

export const ETAPES: EtapeAccueil[] = [
  {
    titre: 'Vous cuisinez à deux',
    texte:
      'Le menu, les recettes et la liste de courses sont les mêmes pour vous deux. Ce que tu ajoutes apparaît chez Tristan dans la seconde, et l’inverse.',
    dessin: 'foyer',
  },
  {
    titre: 'Remplis la semaine',
    texte:
      'Touche un créneau vide pour y mettre un plat, un restaurant ou juste un nom. Cherche dans les cent recettes, ou écris la tienne.',
    dessin: 'semaine',
  },
  {
    titre: 'La liste se fait toute seule',
    texte:
      'Une fois le menu posé, l’onglet Courses réunit les ingrédients de la semaine, rangés par rayon et ajustés au nombre de convives.',
    dessin: 'courses',
  },
  {
    titre: 'Photographie une recette',
    texte:
      'Une page de livre, une fiche, une capture d’écran : la photo suffit. Le nom, les ingrédients et les étapes se remplissent, et tu relis avant d’enregistrer.',
    dessin: 'photo',
  },
]

/** Clef locale : l'accueil est propre à l'appareil, pas au foyer. */
export const CLEF_ACCUEIL = 'mealmate-accueil-vu'

export function accueilDejaVu(): boolean {
  try {
    return localStorage.getItem(CLEF_ACCUEIL) === '1'
  } catch {
    // Navigation privée ou stockage refusé : on ne montre pas l'accueil en
    // boucle à quelqu'un qui ne peut pas enregistrer qu'il l'a vu.
    return true
  }
}

export function marquerAccueilVu() {
  try {
    localStorage.setItem(CLEF_ACCUEIL, '1')
  } catch {
    /* sans stockage, tant pis : l'accueil se referme quand même */
  }
}
