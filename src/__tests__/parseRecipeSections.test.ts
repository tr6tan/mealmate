import { describe, expect, it } from 'vitest'
import { parseRecipe } from '@/lib/parseRecipe'

/**
 * Régression : le collage depuis un site de cuisine était illisible.
 *
 * Les en-têtes « Ingrédients : » et « Préparation : » se terminent par un
 * deux-points, passaient donc pour des étapes, et la règle qui veut qu'après
 * la première étape tout soit une étape avalait la liste des ingrédients
 * entière. Sur ce gratin, l'analyseur rendait trois ingrédients faux
 * (« Pour 6 personnes », « Préparation : 20 min », « Cuisson : 1 h ») et neuf
 * étapes dont six étaient des ingrédients.
 */
const MARMITON = `Gratin dauphinois
Pour 6 personnes
Préparation : 20 min
Cuisson : 1 h

Ingrédients :
- 1 kg de pommes de terre
- 50 cl de crème liquide
- 2 gousses d'ail
- sel, poivre

Préparation :
1. Préchauffer le four à 180°C.
2. Éplucher et couper les pommes de terre en fines rondelles.
3. Frotter le plat avec l'ail.`

describe('collage depuis un site de cuisine', () => {
  const d = parseRecipe(MARMITON)

  it('garde le titre sans les métadonnées', () => {
    expect(d.name).toBe('Gratin dauphinois')
  })

  it('lit les ingrédients annoncés par leur en-tête', () => {
    expect(d.ingredients.map((i) => i.name)).toEqual([
      'Pommes de terre', 'Crème liquide', 'Ail', 'Sel', 'Poivre',
    ])
    expect(d.ingredients.map((i) => i.qty)).toEqual(['1kg', '50cl', '2 gousses', '', ''])
  })

  it('ne retient que les vraies étapes', () => {
    expect(d.steps).toHaveLength(3)
    expect(d.steps[0]).toBe('Préchauffer le four à 180°C.')
  })

  it('additionne préparation et cuisson', () => {
    expect(d.time).toBe('1h20')
    expect(d.rapide).toBe(false)
  })

  it('retient le nombre de parts', () => {
    expect(d.portions).toBe(6)
  })

  it('ne déclare pas végétalien un plat à la crème', () => {
    expect(d.tags).toEqual(['vegetarien'])
  })
})

describe('durées', () => {
  it('ignore le repos, qui n’est pas du temps de cuisine', () => {
    // Une marinade d'une nuit annoncerait douze heures pour un plat qui en
    // demande vingt minutes.
    expect(parseRecipe('Poulet mariné\nPréparation : 15 min\nRepos : 12 h\n1 poulet').time)
      .toBe('15 min')
  })

  it('lit les heures et minutes combinées', () => {
    expect(parseRecipe('Bœuf\nCuisson : 2 h 30\n1 kg de bœuf').time).toBe('2h30')
  })

  it('rend les heures rondes sans minutes', () => {
    expect(parseRecipe('Pot-au-feu\nCuisson : 3 h\n1 kg de bœuf').time).toBe('3h')
  })

  it('garde une durée nue sur sa propre ligne', () => {
    expect(parseRecipe('Pâtes\n20 min\n200 g de pâtes').time).toBe('20 min')
  })
})

describe('portions', () => {
  it.each([
    ['Pour 6 personnes', 6],
    ['4 parts', 4],
    ['Pour 4', 4],
    ['8 portions', 8],
  ])('lit « %s »', (ligne, attendu) => {
    expect(parseRecipe(`Tarte\n${ligne}\n1 pâte brisée`).portions).toBe(attendu)
  })

  it('ne prend pas une quantité pour un nombre de parts', () => {
    const d = parseRecipe('Pain\n500 g de farine')
    expect(d.portions).toBeUndefined()
    expect(d.ingredients).toHaveLength(1)
  })
})

describe('quantités', () => {
  it('lit une quantité rejetée en fin de ligne', () => {
    // « Lentilles vertes 200g » donnait un ingrédient nommé avec sa quantité
    // collée, qui partait donc sans poids dans la liste de courses.
    const d = parseRecipe('Salade\nlentilles vertes 200g\nfeta 100g')
    expect(d.ingredients).toEqual([
      { name: 'Lentilles vertes', qty: '200g', category: 'epicerie' },
      { name: 'Feta', qty: '100g', category: 'cremerie' },
    ])
  })

  it('éclate une énumération sans quantité', () => {
    expect(parseRecipe('Soupe\nIngrédients :\nsel, poivre, muscade').ingredients.map((i) => i.name))
      .toEqual(['Sel', 'Poivre', 'Muscade'])
  })

  it('n’éclate pas une ligne qui porte une quantité', () => {
    const d = parseRecipe('Gâteau\nIngrédients :\n200 g de farine, tamisée')
    expect(d.ingredients).toHaveLength(1)
    expect(d.ingredients[0].name).toBe('Farine, tamisée')
  })
})

describe('sans en-tête, le comportement deviné ne change pas', () => {
  it('sépare toujours ingrédients et étapes à la première phrase', () => {
    const d = parseRecipe('Poulet au curry\npoulet\nriz\nlait de coco\nFaire revenir le poulet\nServir')
    expect(d.ingredients.map((i) => i.name)).toEqual(['Poulet', 'Riz', 'Lait de coco'])
    expect(d.steps).toEqual(['Faire revenir le poulet', 'Servir'])
  })
})
