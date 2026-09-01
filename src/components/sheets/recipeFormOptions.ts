/**
 * Options des formulaires de recette.
 *
 * Dans un module à part : un fichier qui exporte à la fois un composant et des
 * constantes perd le rechargement à chaud.
 */
import type { DietaryTag, Period, ShoppingCategory } from '@/types'

export const PERIODS: Period[] = ['pdej', 'midi', 'soir']

export const TIME_OPTIONS = ['5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '1h', '1h30']

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

export interface RecipeFormValues {
  name: string
  time: string
  timeCustom: boolean
  period: Period
  fav: boolean
  rapide: boolean
  photo?: string
  ingredients: import('@/types').Ingredient[]
  steps: string[]
  tags: DietaryTag[]
}
