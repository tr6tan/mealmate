import { describe, expect, it } from 'vitest'
import { fuzzyScore } from '@/lib/utils'

/** Seuil retenu par les deux écrans de recherche. */
const SEUIL = 15

describe('fuzzyScore', () => {
  it('classe la correspondance exacte au-dessus de tout', () => {
    expect(fuzzyScore('tarte flambée', 'Tarte flambée')).toBe(100)
  })

  it('trouve une sous-chaîne', () => {
    expect(fuzzyScore('tarte', 'Tarte flambée')).toBe(80)
    expect(fuzzyScore('bolo', 'Pâtes bolognaise')).toBeGreaterThanOrEqual(SEUIL)
  })

  it('ignore accents et casse', () => {
    expect(fuzzyScore('CREPES', 'Crêpes')).toBe(100)
  })

  it('pardonne une faute de frappe', () => {
    expect(fuzzyScore('lasagne', 'Lasagnes maison')).toBeGreaterThanOrEqual(SEUIL)
    expect(fuzzyScore('mousaka', 'Moussaka')).toBeGreaterThanOrEqual(SEUIL)
  })

  it('ne rapproche pas deux mots courts sans rapport', () => {
    // Régression : deux fautes étaient tolérées dès cinq lettres, soit 40 %
    // du mot. « tarte » remontait « Chili con carne » à côté de la vraie
    // tarte.
    expect(fuzzyScore('tarte', 'Chili con carne')).toBeLessThan(SEUIL)
    expect(fuzzyScore('curry', 'Purée')).toBeLessThan(SEUIL)
  })

  it('rend tout pour une recherche vide', () => {
    expect(fuzzyScore('', 'Peu importe')).toBe(1)
  })
})
