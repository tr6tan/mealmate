/**
 * Import de recettes depuis TheMealDB.
 *
 * Traduction du format de l'API vers le modèle de l'app : découpage des
 * étapes, devinette de la catégorie de course d'un ingrédient et du moment
 * de la journée. C'est de la logique métier, elle occupait 60 lignes du
 * composant NewRecipeSheet.
 */
import type { Ingredient, Period, ShoppingCategory } from '@/types'

export interface MealDBMeal {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  [key: string]: string | null
}

export function guessCategory(ingredient: string): ShoppingCategory {
  const i = ingredient.toLowerCase()
  if (/chicken|beef|pork|lamb|fish|salmon|tuna|shrimp|bacon|mince|sausage|turkey|steak|veal|duck|meat/.test(i)) return 'viandes'
  if (/milk|cheese|butter|cream|yogurt|egg|mozzarella|parmesan|ricotta/.test(i)) return 'cremerie'
  if (/carrot|onion|garlic|tomato|pepper|mushroom|potato|spinach|lettuce|broccoli|courgette|aubergine|celery|leek|cabbage|peas|bean|lentil|cucumber|corn|cauliflower/.test(i)) return 'legumes'
  return 'epicerie'
}

export function guessPeriod(category: string): Period {
  if (/breakfast/i.test(category)) return 'pdej'
  if (/dessert/i.test(category)) return 'soir'
  return 'midi'
}

export function parseSteps(instructions: string): string[] {
  if (!instructions) return []
  const byNewline = instructions
    .split(/\r?\n/)
    .map((s) => s.replace(/^\d+[.)]\s*/, '').trim())
    .filter((s) => s.length > 5)
  if (byNewline.length >= 2) return byNewline.slice(0, 15)
  return instructions
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)
    .slice(0, 10)
}

export function parseMealIngredients(meal: MealDBMeal): Ingredient[] {
  const ingredients: Ingredient[] = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const qty  = meal[`strMeasure${i}`]
    if (!name || name.trim() === '') break
    ingredients.push({
      name: name.trim(),
      qty: (qty ?? '').trim(),
      category: guessCategory(name),
    })
  }
  return ingredients
}
