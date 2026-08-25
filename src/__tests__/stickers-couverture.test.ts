import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getStickerSlug } from '@/lib/stickers'
import { CATALOG } from '@/data/shoppingCatalog'

const root = process.cwd()

const slugsDisponibles = new Set(
  readdirSync(resolve(root, 'public/icons/stickers')).map((f) => f.replace(/\.png$/, '')),
)

const source = readFileSync(resolve(root, 'src/data/defaultRecipes.ts'), 'utf8')
const plats = [...source.matchAll(/^\s{4}name: '([^']+)'/gm)].map((m) => m[1])
const ingredients = [
  ...new Set([...source.matchAll(/\{ name: '([^']+)', qty/g)].map((m) => m[1])),
]

// Le catalogue est désormais une donnée importable, plus un bloc à extraire
// du composant à coups d'expression régulière.
const catalogue = [...new Set(CATALOG.flatMap((s) => s.items.map((i) => i.name)))]

describe('couverture des stickers', () => {
  it('ne référence que des fichiers qui existent', () => {
    // La liste AVAILABLE de stickers.ts est écrite à la main : une règle qui
    // pointe vers un slug absent renvoie null en silence.
    const manquants = [...plats, ...ingredients, ...catalogue]
      .map((n) => getStickerSlug(n))
      .filter((s): s is string => !!s)
      .filter((s) => !slugsDisponibles.has(s))
    expect([...new Set(manquants)]).toEqual([])
  })

  it('illustre chaque recette livrée avec l’app', () => {
    expect(plats.filter((p) => !getStickerSlug(p))).toEqual([])
  })

  it('illustre chaque ingrédient de ces recettes', () => {
    expect(ingredients.filter((i) => !getStickerSlug(i))).toEqual([])
  })

  it('couvre le catalogue de courses, hors produits non alimentaires', () => {
    const sans = catalogue.filter((n) => !getStickerSlug(n))
    // Ces trois-là n'ont aucun équivalent dans un jeu d'icônes culinaires :
    // mieux vaut le visuel de repli de l'appelant qu'un sticker trompeur.
    expect(sans.sort()).toEqual(['Dentifrice', 'Papier toilette', 'Sopalin'])
  })
})

describe('attributions vérifiées', () => {
  /**
   * Régressions constatées sur le jeu réel. Chaque cas ici a été observé
   * comme faux avant correction.
   */
  const cas: [string, string][] = [
    // « bœuf » contient « œuf » : la ligature échappait à la normalisation et
    // le bœuf haché s'affichait avec un panier d'œufs.
    ['Bœuf haché', 'steak-rare'],
    ['Rôti de bœuf', 'steak'],
    ['Œufs', 'egg-basket'],
    // « pâte » (à tarte, de miso) n'est pas « pâtes ».
    ['Pâte brisée', 'pie'],
    ['Pâte de miso', 'miso-soup'],
    ['Pâtes', 'spaghetti'],
    // Termes avalés par un mot plus général.
    ['Tomates cerises', 'tomato'],
    ['Cerise', 'cherry'],
    ['Citronnelle', 'grass'],
    ['Citron vert', 'lime'],
    ['Poulet citronnelle', 'fried-chicken'],
    ['Dentifrice', null as unknown as string],
    // Pluriels qui ne matchaient aucune règle.
    ['Pommes de terre', 'potato'],
    ['Patates douces', 'sweet-potato'],
    ['Olives noires', 'olive'],
    ['Navets', 'beet'],
    ['Cordons bleus', 'fried-chicken'],
    // Retombées sur un sticker générique « nourriture ».
    ['Huile neutre', 'olive-oil'],
    ['Huile de sésame', 'olive-oil'],
    ['Savon', 'kitchenwares'],
    ['Lessive', 'hamper'],
    // Yaourts à boire.
    ['Yop', 'yogurt'],
  ]

  it.each(cas)('%s → %s', (nom, attendu) => {
    expect(getStickerSlug(nom)).toBe(attendu)
  })

  it('n’utilise plus les variantes kawaii, étrangères au reste du jeu', () => {
    const rules = readFileSync(resolve(root, 'src/lib/stickers.ts'), 'utf8')
    const kawaiiUtilises = [...new Set(
      [...rules.matchAll(/,\s*'(kawaii-[a-z-]+)'\]/g)].map((m) => m[1]),
    )]
    // Le cupcake est la seule exception assumée : le jeu n'offre pas de
    // muffin réaliste, et `pie` ou `cookie` seraient plus faux que kawaii.
    expect(kawaiiUtilises).toEqual(['kawaii-cupcake'])
  })
})
