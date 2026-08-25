import { describe, expect, it } from 'vitest'
import { BASE_PORTIONS, scaleQty } from '@/lib/utils'

/**
 * Régression : `scaleQty` était dupliquée dans RecipeDetailSheet (facteur
 * multiplicateur, départ à 1) et MealActionsSheet (nombre de personnes,
 * facteur / 2). La même recette affichait donc des quantités différentes
 * selon l'écran d'où on l'ouvrait.
 */
describe('scaleQty', () => {
  it('laisse les quantités intactes pour la portion de référence', () => {
    expect(BASE_PORTIONS).toBe(2)
    expect(scaleQty('200g', 2)).toBe('200g')
    expect(scaleQty('1 c.à.s', 2)).toBe('1 c.à.s')
  })

  it('met à l’échelle du nombre de convives', () => {
    expect(scaleQty('200g', 4)).toBe('400 g')
    expect(scaleQty('200g', 1)).toBe('100 g')
    expect(scaleQty('300ml', 6)).toBe('900 ml')
  })

  it('gère la virgule décimale et arrondit au dixième', () => {
    expect(scaleQty('1,5 L', 4)).toBe('3 L')
    expect(scaleQty('0,5 L', 6)).toBe('1.5 L')
  })

  it('renvoie tel quel ce qui n’est pas chiffré', () => {
    expect(scaleQty('un peu de sel', 4)).toBe('un peu de sel')
    expect(scaleQty('', 4)).toBe('')
  })

  it('donne le même résultat quel que soit l’écran appelant', () => {
    // Les deux sheets passent désormais un nombre de personnes, pas un facteur.
    const depuisDetail = scaleQty('250g', 4)
    const depuisActions = scaleQty('250g', 4)
    expect(depuisDetail).toBe(depuisActions)
    expect(depuisDetail).toBe('500 g')
  })
})
