import { describe, expect, it } from 'vitest'
import { devinerCategorie, parseRecipe } from '@/lib/parseRecipe'

describe('parseRecipe', () => {
  const texte = `Pâtes carbonara
20 min

200 g de spaghetti
100 g de lardons
2 œufs
50 g de parmesan

Faire cuire les pâtes dans l'eau bouillante salée.
Faire revenir les lardons à la poêle.
Mélanger les œufs battus hors du feu.`

  it('sépare titre, durée, ingrédients et étapes', () => {
    const d = parseRecipe(texte)
    expect(d.name).toBe('Pâtes carbonara')
    expect(d.time).toBe('20 min')
    expect(d.ingredients).toHaveLength(4)
    expect(d.steps).toHaveLength(3)
  })

  it('découpe la quantité du nom', () => {
    const d = parseRecipe(texte)
    // Format aligné sur les recettes livrées : « 200g », « 1 c.à.s ».
    expect(d.ingredients[0]).toMatchObject({ name: 'Spaghetti', qty: '200g' })
    expect(d.ingredients[2]).toMatchObject({ name: 'Œufs', qty: '2' })
  })

  it('range chaque ingrédient dans son rayon', () => {
    const d = parseRecipe(texte)
    expect(d.ingredients.find((i) => i.name === 'Lardons')?.category).toBe('viandes')
    expect(d.ingredients.find((i) => i.name === 'Parmesan')?.category).toBe('cremerie')
    expect(d.ingredients.find((i) => i.name === 'Spaghetti')?.category).toBe('epicerie')
  })

  it('marque rapide une recette courte', () => {
    expect(parseRecipe(texte).rapide).toBe(true)
    expect(parseRecipe('Bœuf bourguignon\n3h\n\n1 kg de bœuf\n\nCuire longuement.').rapide).toBe(false)
  })

  it('accepte les puces et la numérotation', () => {
    const d = parseRecipe(`Salade
- 2 tomates
- 1 concombre

1. Couper les légumes.
2. Assaisonner.`)
    expect(d.ingredients.map((i) => i.name)).toEqual(['Tomates', 'Concombre'])
    expect(d.steps).toEqual(['Couper les légumes.', 'Assaisonner.'])
  })

  it('reconnaît un ingrédient nommé sans quantité', () => {
    const d = parseRecipe('Omelette\n\n3 œufs\nSel\nPoivre\n\nBattre les œufs.')
    expect(d.ingredients.map((i) => i.name)).toEqual(['Œufs', 'Sel', 'Poivre'])
    expect(d.steps).toEqual(['Battre les œufs.'])
  })

  it('ne prend pas une étape courte pour un ingrédient', () => {
    const d = parseRecipe('Riz\n\n200 g de riz\n\nFaire bouillir.\nÉgoutter.')
    expect(d.ingredients).toHaveLength(1)
    expect(d.steps).toEqual(['Faire bouillir.', 'Égoutter.'])
  })

  it('déduit les régimes des ingrédients', () => {
    expect(parseRecipe('Salade\n\n2 tomates\n1 concombre\n\nMélanger.').tags).toEqual([
      'vegetarien',
      'vegan',
    ])
    // Le fromage exclut le vegan, pas le végétarien.
    expect(parseRecipe('Gratin\n\n200 g de fromage\n\nEnfourner.').tags).toEqual(['vegetarien'])
    expect(parseRecipe('Poulet rôti\n\n1 poulet\n\nEnfourner.').tags).toEqual([])
  })

  it('reconnaît un petit-déjeuner à son vocabulaire', () => {
    expect(parseRecipe('Porridge\n\n60 g de flocons\n\nChauffer.').period).toBe('pdej')
    expect(parseRecipe('Lasagnes\n\n300 g de pâtes\n\nEnfourner.').period).toBe('midi')
  })

  it('propose une durée quand elle manque', () => {
    const d = parseRecipe('Truc\n\n1 chose\n\nFaire ceci.\nPuis cela.')
    expect(d.time).toMatch(/^\d+ min$/)
  })

  it('accepte un texte vide ou réduit au titre', () => {
    expect(parseRecipe('')).toMatchObject({ name: '', ingredients: [], steps: [] })
    const seul = parseRecipe('Tarte aux pommes')
    expect(seul.name).toBe('Tarte aux pommes')
    expect(seul.ingredients).toEqual([])
  })

  it('met une majuscule sans toucher au reste', () => {
    const d = parseRecipe('tarte tatin\n\n200g de pommes\n\néplucher les pommes.')
    expect(d.name).toBe('Tarte tatin')
    expect(d.steps[0]).toBe('Éplucher les pommes.')
  })
})

describe('devinerCategorie', () => {
  it('range les aliments courants', () => {
    expect(devinerCategorie('Blanc de poulet')).toBe('viandes')
    expect(devinerCategorie('Crème fraîche')).toBe('cremerie')
    expect(devinerCategorie('Tomates cerises')).toBe('legumes')
    expect(devinerCategorie('Farine')).toBe('epicerie')
    expect(devinerCategorie('Petits pois surgelés')).toBe('surgeles')
    expect(devinerCategorie('Liquide vaisselle')).toBe('maison')
  })

  it('ignore accents et casse', () => {
    expect(devinerCategorie('CRÈME')).toBe('cremerie')
    expect(devinerCategorie('epinards')).toBe('legumes')
  })
})
