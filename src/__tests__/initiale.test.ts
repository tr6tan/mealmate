import { describe, expect, it } from 'vitest'
import { LETTRES, comparerNoms, initiale } from '@/lib/initiale'

describe('initiale', () => {
  it('range les accents sous la lettre nue', () => {
    // Sans cela « Épinards » se classait après Z, hors de l'index.
    expect(initiale('Épinards à la crème')).toBe('E')
    expect(initiale('Œufs mimosa')).toBe('O')
    expect(initiale('Ananas rôti')).toBe('A')
  })

  it('accepte les minuscules', () => {
    expect(initiale('tarte tatin')).toBe('T')
  })

  it('envoie chiffres et symboles sous #', () => {
    expect(initiale('3 fromages')).toBe('#')
    expect(initiale('« Bœuf » façon grand-mère')).toBe('#')
    expect(initiale('')).toBe('#')
  })

  it('couvre les 26 lettres plus le fourre-tout', () => {
    expect(LETTRES).toHaveLength(27)
    expect(LETTRES[0]).toBe('A')
    expect(LETTRES[25]).toBe('Z')
    expect(LETTRES[26]).toBe('#')
  })
})

describe('comparerNoms', () => {
  it('classe sans tenir compte des accents', () => {
    const noms = ['Épinards', 'Endives', 'Escalope']
    expect([...noms].sort(comparerNoms)).toEqual(['Endives', 'Épinards', 'Escalope'])
  })

  it('classe les nombres dans l’ordre numérique', () => {
    expect(['Pizza 4 saisons', 'Pizza 12 pouces'].sort(comparerNoms))
      .toEqual(['Pizza 4 saisons', 'Pizza 12 pouces'])
  })
})
