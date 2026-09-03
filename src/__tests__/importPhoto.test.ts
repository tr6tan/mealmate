import { describe, expect, it } from 'vitest'
import { messageDErreur, versFormulaire, type RecetteLue } from '@/lib/importPhoto'

const lue = (patch: Partial<RecetteLue> = {}): RecetteLue => ({
  lisible: true,
  nom: 'Blanquette de veau',
  minutes: 90,
  portions: 6,
  ingredients: [
    { nom: 'Épaule de veau', quantite: '1 kg' },
    { nom: 'Carottes', quantite: '3' },
    { nom: 'Crème fraîche', quantite: '20 cl' },
  ],
  etapes: ['Couper le veau en morceaux.', 'Porter à frémissement.'],
  ...patch,
})

describe('versFormulaire', () => {
  it('reprend ce qui a été lu', () => {
    const v = versFormulaire(lue())
    expect(v.name).toBe('Blanquette de veau')
    expect(v.time).toBe('1h30')
    expect(v.portions).toBe(6)
    expect(v.steps).toHaveLength(2)
  })

  it('devine le rayon de chaque ingrédient', () => {
    const v = versFormulaire(lue())
    expect(v.ingredients.map((i) => i.category)).toEqual(['viandes', 'legumes', 'cremerie'])
  })

  it('déduit le moment et le régime sans les demander au modèle', () => {
    const v = versFormulaire(lue())
    expect(v.period).toBe('soir')
    // Du veau : ni végétarien ni végétalien.
    expect(v.tags).toEqual([])
    expect(v.periodChoisie).toBe(false)
    expect(v.tagsChoisis).toBe(false)
  })

  it('sépare bien la quantité du nom', () => {
    const v = versFormulaire(lue())
    expect(v.ingredients[0]).toMatchObject({ name: 'Épaule de veau', qty: '1 kg' })
  })

  describe('bornes', () => {
    // Un modèle peut rendre n'importe quoi ; le formulaire n'est pas
    // l'endroit où le découvrir.
    it.each([
      [0, '30 min'],
      [-20, '30 min'],
      [2, '5 min'],
      [99999, '6h'],
      [Number.NaN, '30 min'],
    ])('durée %p devient %s', (minutes, attendu) => {
      expect(versFormulaire(lue({ minutes })).time).toBe(attendu)
    })

    it.each([[0, 2], [-3, 2], [999, 24]])('portions %i deviennent %i', (p, attendu) => {
      expect(versFormulaire(lue({ portions: p })).portions).toBe(attendu)
    })
  })

  it('écarte les ingrédients et les étapes vides', () => {
    const v = versFormulaire(lue({
      ingredients: [{ nom: '  ', quantite: '1 kg' }, { nom: 'Riz', quantite: '' }],
      etapes: ['', '  ', 'Cuire le riz.'],
    }))
    expect(v.ingredients).toHaveLength(1)
    expect(v.steps).toEqual(['Cuire le riz.'])
  })

  it('laisse une étape vide plutôt qu’une liste vide', () => {
    // L'éditeur d'étapes a besoin d'une ligne pour inviter à écrire.
    expect(versFormulaire(lue({ etapes: [] })).steps).toEqual([''])
  })

  it('marque rapide une recette de vingt minutes ou moins', () => {
    expect(versFormulaire(lue({ minutes: 15 })).rapide).toBe(true)
    expect(versFormulaire(lue({ minutes: 25 })).rapide).toBe(false)
  })

  it('survit à des champs absents', () => {
    const v = versFormulaire({ lisible: true, nom: 'Truc' } as RecetteLue)
    expect(v.ingredients).toEqual([])
    expect(v.steps).toEqual([''])
    expect(v.time).toBe('30 min')
  })
})

describe('messageDErreur', () => {
  it('nomme les pannes que la personne peut corriger', () => {
    expect(messageDErreur('illisible')).toMatch(/photo/i)
    expect(messageDErreur('trop-de-demandes')).toMatch(/quota/i)
    expect(messageDErreur('reseau')).toMatch(/connexion/i)
  })

  it('dit que le quota est épuisé, pas que Gemini est en panne', () => {
    /*
     * Régression : un quota épuisé était annoncé comme une surcharge du
     * fournisseur, donc comme une panne chez Google. Deux causes qui
     * n'appellent pas la même conduite : la surcharge se réessaie, le quota
     * se change de modèle ou s'attend.
     */
    expect(messageDErreur('quota')).toMatch(/quota/i)
    expect(messageDErreur('quota')).not.toBe(messageDErreur('surcharge'))
  })

  it('distingue un délai dépassé d’une absence de réseau', () => {
    /*
     * Régression : la fonction était coupée à dix secondes par le plan
     * Vercel, la connexion tombait, et le seul message existant annonçait
     * « Pas de connexion » alors que le réseau allait très bien. Un message
     * qui accuse la mauvaise cause coûte plus cher que pas de message.
     */
    expect(messageDErreur('trop-long')).not.toBe(messageDErreur('reseau'))
    expect(messageDErreur('trop-long')).toMatch(/temps/i)
  })

  it('dit que le serveur est injoignable, sans accuser le réseau seul', () => {
    expect(messageDErreur('reseau')).toMatch(/serveur/i)
  })

  it('retombe sur un message générique plutôt que sur un code', () => {
    expect(messageDErreur('inconnu-xyz')).toBe(messageDErreur('fournisseur'))
  })
})
