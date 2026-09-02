import { describe, expect, it } from 'vitest'
import { devinerPeriode, devinerRegimes } from '@/lib/classerRecette'
import type { Ingredient } from '@/types'

const ing = (...noms: string[]): Ingredient[] =>
  noms.map((name) => ({ name, qty: '', category: 'epicerie' }))

describe('devinerPeriode', () => {
  it.each([
    ['Porridge overnight', 'pdej'],
    ['Pancakes', 'pdej'],
    ['Œufs brouillés avocat', 'pdej'],
    ['Soupe à l’oignon', 'soir'],
    ['Tartiflette', 'soir'],
    ['Bœuf bourguignon', 'soir'],
    ['Pâtes carbonara', 'midi'],
    ['Salade César', 'midi'],
  ])('%s va au %s', (nom, attendu) => {
    expect(devinerPeriode(nom)).toBe(attendu)
  })

  it('ignore les accents et les ligatures', () => {
    expect(devinerPeriode('CREPES')).toBe('pdej')
    expect(devinerPeriode('Bœuf bourguignon')).toBe('soir')
  })
})

describe('devinerRegimes', () => {
  it('déclare végétarien un plat sans chair animale', () => {
    const t = devinerRegimes(ing('Courgettes', 'Chèvre', 'Huile d’olive'), 'Gratin de courgettes')
    expect(t).toContain('vegetarien')
    expect(t).not.toContain('vegan')
  })

  it('déclare végétalien un plat sans aucun produit animal', () => {
    const t = devinerRegimes(ing('Lentilles', 'Carottes', 'Oignon'), 'Dahl')
    expect(t).toContain('vegetarien')
    expect(t).toContain('vegan')
  })

  it('ne déclare rien de végétarien dès qu’il y a du poisson', () => {
    expect(devinerRegimes(ing('Saumon', 'Crème', 'Aneth'))).not.toContain('vegetarien')
  })

  it('voit la viande cachée dans les lardons et le chorizo', () => {
    expect(devinerRegimes(ing('Lardons', 'Crème', 'Pâtes'))).not.toContain('vegetarien')
    expect(devinerRegimes(ing('Chorizo', 'Riz', 'Poivrons'))).not.toContain('vegetarien')
  })

  it('ne propose jamais sans-gluten ni sans-lactose', () => {
    // Ces deux régimes se suivent souvent pour raison médicale et ne se
    // déduisent pas d'une liste en texte libre : le gluten se cache dans la
    // sauce soja, le bouillon cube et la levure chimique.
    const t = devinerRegimes(ing('Riz', 'Tomates', 'Basilic'))
    expect(t).not.toContain('sans-gluten')
    expect(t).not.toContain('sans-lactose')
  })

  it('n’affirme rien sur une liste trop courte', () => {
    // Annoncer à tort un régime à quelqu'un qui le suit est plus grave que
    // de ne rien dire.
    expect(devinerRegimes([])).toEqual([])
    expect(devinerRegimes(ing('Tomates'))).toEqual([])
  })
})
