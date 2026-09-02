import { describe, expect, it } from 'vitest'
import {
  DUREE_MAX, DUREE_MIN, dureePrecedente, dureeSuivante, enMinutes, formaterDuree,
} from '@/lib/duree'

describe('enMinutes', () => {
  it.each([
    ['25 min', 25], ['1h', 60], ['1h30', 90], ['2 h 15', 135], ['45', 45],
  ])('lit %s', (t, m) => expect(enMinutes(t)).toBe(m))

  it('rend zéro sur un texte sans chiffre', () => {
    expect(enMinutes('? min')).toBe(0)
  })
})

describe('formaterDuree', () => {
  it.each([
    [25, '25 min'], [60, '1h'], [90, '1h30'], [125, '2h05'], [180, '3h'],
  ])('écrit %i', (m, t) => expect(formaterDuree(m)).toBe(t))
})

describe('incréments', () => {
  it('avance de 5 en 5 sous la demi-heure', () => {
    expect(dureeSuivante(10)).toBe(15)
    expect(dureeSuivante(25)).toBe(30)
  })

  it('avance de 15 en 15 jusqu’à deux heures', () => {
    expect(dureeSuivante(30)).toBe(45)
    expect(dureeSuivante(105)).toBe(120)
  })

  it('avance de 30 en 30 au-dela', () => {
    expect(dureeSuivante(120)).toBe(150)
  })

  it('les deux flèches se répondent', () => {
    // Régression : le pas calculé sur la valeur de départ faisait descendre
    // 30 vers 15, alors que 15 remontait vers 20.
    for (const m of [10, 15, 25, 30, 45, 60, 120, 150, 300]) {
      expect(dureePrecedente(dureeSuivante(m))).toBe(m)
    }
  })

  it('reste dans les bornes', () => {
    expect(dureePrecedente(DUREE_MIN)).toBe(DUREE_MIN)
    expect(dureeSuivante(DUREE_MAX)).toBe(DUREE_MAX)
  })
})
