import { describe, expect, it } from 'vitest'
import { getStickerSlug } from '@/lib/stickers'

/**
 * Régression : la protéine gagnait sur le plat.
 *
 * Les règles des viandes passaient avant celles des salades et des bols, si
 * bien qu'une « Salade César poulet » recevait le seau de poulet frit. Sur une
 * liste de cent lignes, l'icône est souvent le seul indice avant le nom : elle
 * ne doit pas annoncer un autre plat.
 */
describe('le plat prime sur sa protéine', () => {
  it.each([
    ['Salade César poulet', 'salad'],
    ['Taboulé', 'salad'],
    ['Bowl quinoa poulet provençal', 'rice-bowl'],
    ['Wok de légumes', 'broccoli'],
  ])('%s → %s', (nom, slug) => {
    expect(getStickerSlug(nom)).toBe(slug)
  })

  it('laisse les pâtes aux pâtes', () => {
    // « Salade de pâtes » garde la fourchette de spaghettis : ce sont bien des
    // pâtes, alors qu'un bol de verdure annoncerait une salade verte.
    expect(getStickerSlug('Salade de pâtes')).toBe('spaghetti')
  })

  it('laisse les plats de viande à leur viande', () => {
    expect(getStickerSlug('Poulet rôti')).toBe('fried-chicken')
    expect(getStickerSlug('Rôti de porc')).toBe('steak-rare')
    expect(getStickerSlug('Parmentier de canard')).toBe('duck')
  })

  it('garde les salades plus précises', () => {
    expect(getStickerSlug('Salade grecque')).toBe('greek-salad')
    expect(getStickerSlug('Salade verte')).toBe('lettuce')
    expect(getStickerSlug('Salade de fruits')).toBe('apple')
  })

  it('donne un verre au smoothie, pas une canette', () => {
    expect(getStickerSlug('Smoothie')).toBe('orange-soda')
    expect(getStickerSlug('Smoothie bowl')).toBe('rice-bowl')
  })
})
