import { describe, expect, it } from 'vitest'
import { DEFAULT_RECIPES } from '@/data/defaultRecipes'
import { estMaison } from '@/lib/recettesMaison'

describe('estMaison', () => {
  it('ne reconnaît aucune recette livrée comme maison', () => {
    expect(DEFAULT_RECIPES.filter(estMaison)).toEqual([])
  })

  it('reconnaît une recette créée par le foyer', () => {
    expect(estMaison({ id: 'V1StGXR8_Z5jdHi6B-myT' })).toBe(true)
  })
})
