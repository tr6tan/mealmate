import { describe, expect, it } from 'vitest'
import {
  guessCategory,
  guessPeriod,
  parseMealIngredients,
  parseSteps,
  type MealDBMeal,
} from '@/lib/mealdb'

const repas = (champs: Partial<MealDBMeal>): MealDBMeal =>
  ({
    idMeal: '1',
    strMeal: 'Test',
    strCategory: 'Beef',
    strArea: 'French',
    strInstructions: '',
    strMealThumb: '',
    ...champs,
  }) as MealDBMeal

describe('guessCategory', () => {
  it('range chaque ingrédient dans son rayon', () => {
    expect(guessCategory('Chicken breast')).toBe('viandes')
    expect(guessCategory('Parmesan cheese')).toBe('cremerie')
    expect(guessCategory('Red onion')).toBe('legumes')
    expect(guessCategory('Olive oil')).toBe('epicerie')
  })

  it('ignore la casse', () => {
    expect(guessCategory('SALMON')).toBe('viandes')
  })

  it('retombe sur l’épicerie quand rien ne matche', () => {
    expect(guessCategory('Sriracha')).toBe('epicerie')
    expect(guessCategory('')).toBe('epicerie')
  })
})

describe('guessPeriod', () => {
  it('déduit le moment de la journée de la catégorie', () => {
    expect(guessPeriod('Breakfast')).toBe('pdej')
    expect(guessPeriod('Dessert')).toBe('soir')
    expect(guessPeriod('Beef')).toBe('midi')
  })
})

describe('parseSteps', () => {
  it('découpe sur les retours à la ligne quand il y en a', () => {
    const etapes = parseSteps('Faire chauffer la poêle.\nAjouter les oignons.\nRemuer doucement.')
    expect(etapes).toEqual([
      'Faire chauffer la poêle.',
      'Ajouter les oignons.',
      'Remuer doucement.',
    ])
  })

  it('retire la numérotation en début de ligne', () => {
    expect(parseSteps('1. Couper les légumes.\n2) Faire revenir le tout.')).toEqual([
      'Couper les légumes.',
      'Faire revenir le tout.',
    ])
  })

  it('découpe sur les phrases faute de retours à la ligne', () => {
    const etapes = parseSteps('Couper les légumes. Faire revenir le tout. Servir chaud.')
    expect(etapes.length).toBe(3)
    expect(etapes[0]).toBe('Couper les légumes')
  })

  it('écarte les fragments trop courts', () => {
    expect(parseSteps('Ok.\nMélanger tous les ingrédients.')).toEqual([
      'Mélanger tous les ingrédients.',
    ])
  })

  it('borne le nombre d’étapes', () => {
    const longues = Array.from({ length: 30 }, (_, i) => `Étape numéro ${i} à réaliser.`)
    expect(parseSteps(longues.join('\n')).length).toBe(15)
  })

  it('accepte une instruction vide', () => {
    expect(parseSteps('')).toEqual([])
  })
})

describe('parseMealIngredients', () => {
  it('lit les colonnes numérotées de l’API', () => {
    const m = repas({
      strIngredient1: 'Chicken', strMeasure1: '200g',
      strIngredient2: 'Onion', strMeasure2: '1',
    })
    expect(parseMealIngredients(m)).toEqual([
      { name: 'Chicken', qty: '200g', category: 'viandes' },
      { name: 'Onion', qty: '1', category: 'legumes' },
    ])
  })

  it('s’arrête à la première colonne vide', () => {
    const m = repas({
      strIngredient1: 'Chicken', strMeasure1: '200g',
      strIngredient2: '', strMeasure2: '',
      strIngredient3: 'Onion', strMeasure3: '1',
    })
    expect(parseMealIngredients(m).map((i) => i.name)).toEqual(['Chicken'])
  })

  it('tolère une mesure absente', () => {
    const m = repas({ strIngredient1: 'Salt', strMeasure1: null })
    expect(parseMealIngredients(m)).toEqual([
      { name: 'Salt', qty: '', category: 'epicerie' },
    ])
  })

  it('renvoie une liste vide sans ingrédient', () => {
    expect(parseMealIngredients(repas({}))).toEqual([])
  })
})
