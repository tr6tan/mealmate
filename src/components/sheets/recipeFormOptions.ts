/**
 * Options des formulaires de recette.
 *
 * Dans un module à part : un fichier qui exporte à la fois un composant et des
 * constantes perd le rechargement à chaud.
 */
import type { DietaryTag, Ingredient, Period, ShoppingCategory } from '@/types'

export const PERIODS: Period[] = ['pdej', 'midi', 'soir']

export const CAT_OPTIONS: { id: ShoppingCategory; label: string }[] = [
  { id: 'legumes', label: 'Lég.' },
  { id: 'viandes', label: 'Vde.' },
  { id: 'cremerie', label: 'Crem.' },
  { id: 'epicerie', label: 'Épic.' },
  { id: 'maison', label: 'Mais.' },
]

export const TAG_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: 'vegetarien', label: '🌿 Végé' },
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'sans-gluten', label: 'Sans gluten' },
  { id: 'sans-lactose', label: 'Sans lactose' },
]

/**
 * Un ingrédient en cours de saisie.
 *
 * `categorieChoisie` ne quitte jamais le formulaire : elle dit seulement que
 * la personne a désigné le rayon elle-même, pour que la frappe suivante dans
 * le nom ne vienne pas écraser son choix par une devinette. La retirer avant
 * d'enregistrer évite de la stocker dans Firestore, où elle n'a aucun sens.
 */
export interface IngredientForm extends Ingredient {
  categorieChoisie?: boolean
}

/** Retire les marques propres au formulaire avant enregistrement. */
export function nettoyerIngredients(liste: IngredientForm[]): Ingredient[] {
  return liste
    .filter((i) => i.name.trim())
    .map(({ categorieChoisie: _ignore, ...ing }) => ing)
}

export interface RecipeFormValues {
  name: string
  time: string
  period: Period
  fav: boolean
  rapide: boolean
  photo?: string
  ingredients: IngredientForm[]
  steps: string[]
  tags: DietaryTag[]
  /** Convives auxquels les quantités saisies se rapportent. */
  portions: number
  /**
   * Vrai dès que la personne a désigné elle-même le moment du repas ou les
   * régimes. Sans ces drapeaux, la devinette repartait à chaque frappe et
   * effaçait la correction qu'on venait de faire.
   */
  periodChoisie?: boolean
  tagsChoisis?: boolean
}

/**
 * Modificateur d'un champ du formulaire.
 *
 * Accepte une fonction en plus d'une valeur : `set('portions', p => p + 1)`.
 * Sans cela, deux appuis rapprochés sur « + » lisaient tous deux la même
 * valeur capturée au rendu et n'en comptaient qu'un, les portions passaient
 * de 2 à 3 au lieu de 4.
 */
export type SetChamp = <K extends keyof RecipeFormValues>(
  clef: K,
  valeur: RecipeFormValues[K] | ((precedent: RecipeFormValues[K]) => RecipeFormValues[K]),
) => void

/** Construit un `SetChamp` à partir du setter d'état de l'écran. */
export function creerSetChamp(
  setValeurs: React.Dispatch<React.SetStateAction<RecipeFormValues>>,
): SetChamp {
  return (clef, valeur) =>
    setValeurs((v) => ({
      ...v,
      [clef]: typeof valeur === 'function'
        ? (valeur as (p: RecipeFormValues[typeof clef]) => unknown)(v[clef])
        : valeur,
    }))
}
