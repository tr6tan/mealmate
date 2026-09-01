import { describe, expect, it } from 'vitest'
import { lireDuree } from '@/lib/dureeEtape'

describe('lireDuree', () => {
  it('lit les minutes', () => {
    expect(lireDuree('Enfourner 30 min à 180°')).toEqual({ secondes: 1800, libelle: '30 min' })
    expect(lireDuree('Laisser cuire 5 minutes')).toMatchObject({ secondes: 300 })
  })

  it('lit les heures et les secondes', () => {
    expect(lireDuree('Laisser mijoter 2 h')).toMatchObject({ secondes: 7200 })
    expect(lireDuree('Blanchir 30 secondes')).toMatchObject({ secondes: 30 })
  })

  it('retient la borne haute d’un intervalle', () => {
    // Mieux vaut vérifier une cuisson un peu tard que la manquer.
    expect(lireDuree('Cuire 3 à 4 min')).toMatchObject({ secondes: 240 })
    expect(lireDuree('Dorer 2-3 minutes')).toMatchObject({ secondes: 180 })
  })

  it('ignore ce qui n’est pas une durée', () => {
    expect(lireDuree('Préchauffer le four à 180 °C')).toBeNull()
    expect(lireDuree('Ajouter 200 g de farine')).toBeNull()
    expect(lireDuree('Mélanger délicatement')).toBeNull()
    expect(lireDuree('')).toBeNull()
  })

  it('écarte les durées trop longues pour un minuteur', () => {
    // Une marinade d'une nuit n'a pas à lancer un compte à rebours.
    expect(lireDuree('Laisser mariner 12 h')).toBeNull()
    expect(lireDuree('Reposer 1 h')).toMatchObject({ secondes: 3600 })
  })

  it('prend la première durée quand il y en a plusieurs', () => {
    expect(lireDuree('Cuire 10 min puis laisser reposer 5 min')).toMatchObject({ secondes: 600 })
  })

  it('garde le libellé écrit dans l’étape', () => {
    expect(lireDuree('Enfourner 25 minutes')?.libelle).toBe('25 minutes')
  })
})
