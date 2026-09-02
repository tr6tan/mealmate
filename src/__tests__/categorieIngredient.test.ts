import { describe, expect, it } from 'vitest'
import { devinerCategorie } from '@/lib/categorieIngredient'

describe('devinerCategorie', () => {
  it('classe par mot-clé', () => {
    expect(devinerCategorie('Blanc de poulet')).toBe('viandes')
    expect(devinerCategorie('Crème fraîche')).toBe('cremerie')
    expect(devinerCategorie('Tomates cerises')).toBe('legumes')
    expect(devinerCategorie('Farine')).toBe('epicerie')
    expect(devinerCategorie('Petits pois surgelés')).toBe('surgeles')
    expect(devinerCategorie('Liquide vaisselle')).toBe('maison')
  })

  it('ignore la casse et les accents', () => {
    expect(devinerCategorie('CRÈME')).toBe('cremerie')
    expect(devinerCategorie('epinards')).toBe('legumes')
    // Régression : NFD ne décompose pas « œ ». « Œufs » n'était donc pas
    // reconnu par le motif « oeuf » et partait en épicerie.
    expect(devinerCategorie('Œufs')).toBe('cremerie')
    expect(devinerCategorie('Bœuf haché')).toBe('viandes')
  })

  it('connaît les légumes d’hiver courants', () => {
    // « Blettes » tombait en épicerie : la liste ignorait la moitié du
    // panier d'un marché français.
    for (const l of ['Blettes', 'Endives', 'Fenouil', 'Betterave', 'Panais', 'Roquette']) {
      expect(devinerCategorie(l)).toBe('legumes')
    }
  })

  it('retombe sur l’épicerie plutôt que de se tromper', () => {
    expect(devinerCategorie('Xérès')).toBe('epicerie')
    expect(devinerCategorie('')).toBe('epicerie')
  })
})
