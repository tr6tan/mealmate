import { describe, expect, it } from 'vitest'
import { mergeQty, parseQty } from '@/store/useAppStore'

describe('parseQty', () => {
  it('sépare nombre et unité', () => {
    expect(parseQty('250g')).toEqual({ num: 250, unit: 'g' })
    expect(parseQty('2 pièces')).toEqual({ num: 2, unit: 'pièces' })
    expect(parseQty('1,5 L')).toEqual({ num: 1.5, unit: 'l' })
  })

  it('renvoie null sans quantité chiffrée', () => {
    expect(parseQty('un peu')).toBeNull()
    expect(parseQty('')).toBeNull()
  })
})

describe('mergeQty', () => {
  it('additionne les unités compatibles', () => {
    // L'unité est normalisée : espace avant, minuscules.
    expect(mergeQty('250g', '100g')).toBe('350 g')
    expect(mergeQty('1,5 L', '0,5 L')).toBe('2 l')
    expect(mergeQty('2 pièces', '1 pièce')).toBe('2 pièces + 1 pièce')
  })

  it('juxtapose les unités incompatibles', () => {
    expect(mergeQty('250g', '2 pièces')).toBe('250g + 2 pièces')
  })

  it('ignore une quantité vide', () => {
    expect(mergeQty('', '100g')).toBe('100g')
    expect(mergeQty('100g', '')).toBe('100g')
  })
})
