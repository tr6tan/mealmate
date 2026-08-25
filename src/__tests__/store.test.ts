import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore, selectShoppingProgress } from '@/store/useAppStore'
import { DEFAULT_RECIPES } from '@/data/defaultRecipes'
import { getMondayByOffset, getWeekKey, emptyDay } from '@/lib/utils'
import type { Meal, Recipe } from '@/types'

const etatInitial = useAppStore.getState()

const repas = (name: string): Meal => ({ name, emoji: '🍽', time: '20 min', fav: false })

const semaineVide = () => {
  const s: Record<number, ReturnType<typeof emptyDay>> = {}
  for (let i = 0; i < 7; i++) s[i] = emptyDay()
  return s
}

/** Clé de la semaine visible, celle sur laquelle agissent les actions. */
const cleCourante = () => getWeekKey(getMondayByOffset(useAppStore.getState().weekOffset))

beforeEach(() => {
  useAppStore.setState({
    ...etatInitial,
    weekPlans: {},
    recipes: DEFAULT_RECIPES,
    deletedDefaults: [],
    shoppingItems: [],
    photos: {},
    weekOffset: 0,
  })
})

describe('planning', () => {
  it('pose un repas sur la semaine affichée', () => {
    useAppStore.getState().setMeal(2, 'midi', repas('Ratatouille'))
    expect(useAppStore.getState().weekPlans[cleCourante()][2].midi?.name).toBe('Ratatouille')
  })

  it('crée la semaine à la volée si elle n’existe pas', () => {
    expect(useAppStore.getState().weekPlans).toEqual({})
    useAppStore.getState().setMeal(0, 'soir', repas('Curry'))
    const semaine = useAppStore.getState().weekPlans[cleCourante()]
    // Les six autres jours existent et sont vides, pas absents.
    expect(Object.keys(semaine)).toHaveLength(7)
    expect(semaine[1].midi).toBeNull()
  })

  it('vide la semaine courante sans toucher aux autres', () => {
    const store = useAppStore.getState()
    store.setMeal(1, 'midi', repas('Lasagnes'))
    store.setWeekOffset(1)
    store.setMeal(1, 'midi', repas('Pizza'))
    const cleSuivante = cleCourante()
    store.clearWeek()

    expect(useAppStore.getState().weekPlans[cleSuivante][1].midi).toBeNull()
    useAppStore.getState().setWeekOffset(0)
    expect(useAppStore.getState().weekPlans[cleCourante()][1].midi?.name).toBe('Lasagnes')
  })

  it('recopie une semaine, et la modifier n’altère pas la source', () => {
    const store = useAppStore.getState()
    store.setMeal(3, 'soir', repas('Tajine'))
    const cleSource = cleCourante()

    store.setWeekOffset(1)
    useAppStore.getState().copyWeekFromOffset(0)
    expect(useAppStore.getState().weekPlans[cleCourante()][3].soir?.name).toBe('Tajine')

    // Modifier la copie ne doit pas altérer la source.
    useAppStore.getState().setMeal(3, 'soir', null)
    expect(useAppStore.getState().weekPlans[cleSource][3].soir?.name).toBe('Tajine')
  })

  it('ne copie rien depuis une semaine inexistante', () => {
    useAppStore.getState().copyWeekFromOffset(-5)
    expect(useAppStore.getState().weekPlans).toEqual({})
  })

  it('recopie un jour sur un autre', () => {
    const store = useAppStore.getState()
    store.setMeal(0, 'midi', repas('Poulet'))
    useAppStore.getState().copyDay(0, 4)
    const semaine = useAppStore.getState().weekPlans[cleCourante()]
    expect(semaine[4].midi?.name).toBe('Poulet')
    expect(semaine[0].midi?.name).toBe('Poulet')
  })
})

describe('generateShoppingFromPlan', () => {
  const recetteTest: Recipe = {
    id: 'test-1', name: 'Plat test', emoji: '🍲', period: 'soir', time: '30 min',
    fav: false, rapide: false,
    ingredients: [
      { name: 'Tomate', qty: '250g', category: 'legumes' },
      { name: 'Riz', qty: '100g', category: 'epicerie' },
    ],
  }

  beforeEach(() => {
    useAppStore.setState({ recipes: [recetteTest], weekPlans: {}, shoppingItems: [] })
  })

  it('additionne les quantités d’un ingrédient planifié deux fois', () => {
    const store = useAppStore.getState()
    store.setMeal(0, 'soir', repas('Plat test'))
    store.setMeal(1, 'soir', repas('Plat test'))
    useAppStore.getState().generateShoppingFromPlan()

    const items = useAppStore.getState().shoppingItems
    expect(items).toHaveLength(2)
    expect(items.find((i) => i.name === 'Tomate')?.qty).toBe('500 g')
  })

  it('conserve les articles ajoutés à la main', () => {
    useAppStore.getState().addShoppingItem({
      name: 'Éponge', qty: '', category: 'maison', checked: false,
    })
    useAppStore.getState().setMeal(0, 'soir', repas('Plat test'))
    useAppStore.getState().generateShoppingFromPlan()

    expect(useAppStore.getState().shoppingItems.map((i) => i.name)).toContain('Éponge')
  })

  it('ne duplique pas un article déjà présent sous un autre casse', () => {
    useAppStore.getState().addShoppingItem({
      name: 'tomate', qty: '1', category: 'legumes', checked: false,
    })
    useAppStore.getState().setMeal(0, 'soir', repas('Plat test'))
    useAppStore.getState().generateShoppingFromPlan()

    const tomates = useAppStore.getState().shoppingItems.filter(
      (i) => i.name.toLowerCase() === 'tomate',
    )
    expect(tomates).toHaveLength(1)
  })

  it('ignore un repas qui ne correspond à aucune recette', () => {
    useAppStore.getState().setMeal(0, 'soir', repas('Restaurant'))
    useAppStore.getState().generateShoppingFromPlan()
    expect(useAppStore.getState().shoppingItems).toEqual([])
  })
})

describe('recettes', () => {
  it('mémorise la suppression d’une recette livrée', () => {
    const livree = DEFAULT_RECIPES[0]
    useAppStore.getState().deleteRecipe(livree.id)
    expect(useAppStore.getState().deletedDefaults).toContain(livree.id)
    expect(useAppStore.getState().recipes.find((r) => r.id === livree.id)).toBeUndefined()
  })

  it('ne mémorise pas la suppression d’une recette personnelle', () => {
    useAppStore.getState().addRecipe({
      name: 'Perso', emoji: '🥘', period: 'soir', time: '10 min', fav: false, rapide: true,
    })
    const perso = useAppStore.getState().recipes[0]
    useAppStore.getState().deleteRecipe(perso.id)
    expect(useAppStore.getState().deletedDefaults).toEqual([])
  })

  it('insère la copie juste après l’originale', () => {
    const source = DEFAULT_RECIPES[3]
    useAppStore.getState().duplicateRecipe(source.id)
    const recettes = useAppStore.getState().recipes
    const idx = recettes.findIndex((r) => r.id === source.id)
    expect(recettes[idx + 1].name).toBe(`${source.name} (copie)`)
    expect(recettes[idx + 1].id).not.toBe(source.id)
  })

  it('remet le carnet à zéro, suppressions comprises', () => {
    useAppStore.getState().deleteRecipe(DEFAULT_RECIPES[0].id)
    useAppStore.getState().resetRecipes()
    expect(useAppStore.getState().recipes).toHaveLength(DEFAULT_RECIPES.length)
    expect(useAppStore.getState().deletedDefaults).toEqual([])
  })
})

describe('liste de courses', () => {
  beforeEach(() => {
    const store = useAppStore.getState()
    store.addShoppingItem({ name: 'A', qty: '', category: 'legumes', checked: false })
    store.addShoppingItem({ name: 'B', qty: '', category: 'legumes', checked: false })
  })

  it('horodate et place le dernier ajout en tête', () => {
    const items = useAppStore.getState().shoppingItems
    expect(items[0].name).toBe('B')
    expect(items[0].addedAt).toBeTypeOf('number')
  })

  it('ne retire que les articles cochés', () => {
    const items = useAppStore.getState().shoppingItems
    useAppStore.getState().toggleShoppingItem(items[0].id)
    useAppStore.getState().clearCheckedItems()
    expect(useAppStore.getState().shoppingItems.map((i) => i.name)).toEqual(['A'])
  })

  it('coche et décoche toute la liste', () => {
    useAppStore.getState().setAllChecked(true)
    expect(selectShoppingProgress(useAppStore.getState()).pct).toBe(100)
    useAppStore.getState().setAllChecked(false)
    expect(selectShoppingProgress(useAppStore.getState()).pct).toBe(0)
  })

  it('compte une liste vide sans diviser par zéro', () => {
    useAppStore.getState().clearAllItems()
    expect(selectShoppingProgress(useAppStore.getState())).toEqual({ total: 0, checked: 0, pct: 0 })
  })
})

describe('_hydrate', () => {
  it('écarte les semaines de plus de quatre semaines', () => {
    const vieille = getWeekKey(getMondayByOffset(-10))
    const recente = getWeekKey(getMondayByOffset(-1))
    useAppStore.getState()._hydrate({
      weekPlans: { [vieille]: semaineVide(), [recente]: semaineVide() },
      shoppingItems: [],
      settings: useAppStore.getState().settings,
    })
    const clefs = Object.keys(useAppStore.getState().weekPlans)
    expect(clefs).toContain(recente)
    expect(clefs).not.toContain(vieille)
  })

  it('retire la photo recopiée dans les repas planifiés', () => {
    const cle = getWeekKey(getMondayByOffset(0))
    const semaine = semaineVide()
    // Ancien format : la photo de la recette était dupliquée dans le créneau.
    semaine[0] = {
      ...semaine[0],
      midi: { ...repas('Avec photo'), photo: 'data:image/jpeg;base64,AAA' } as Meal,
    }
    useAppStore.getState()._hydrate({
      weekPlans: { [cle]: semaine },
      shoppingItems: [],
      settings: useAppStore.getState().settings,
    })
    const midi = useAppStore.getState().weekPlans[cle][0].midi
    expect(midi?.name).toBe('Avec photo')
    expect(midi).not.toHaveProperty('photo')
  })

  it('préserve le mode sombre, qui est une préférence locale', () => {
    useAppStore.getState().updateSettings({ darkMode: true })
    useAppStore.getState()._hydrate({
      weekPlans: {},
      shoppingItems: [],
      settings: { personnes: 4, nomFoyer: 'Distant', darkMode: false },
    })
    const settings = useAppStore.getState().settings
    expect(settings.darkMode).toBe(true)
    expect(settings.personnes).toBe(4)
  })

  it('accepte la liste de courses dans ses deux formats', () => {
    const article = {
      id: 'x', name: 'Pain', qty: '', category: 'epicerie' as const, checked: false, addedAt: 5,
    }
    useAppStore.getState()._hydrate({
      weekPlans: {}, shoppingItems: { x: article }, settings: useAppStore.getState().settings,
    })
    expect(useAppStore.getState().shoppingItems).toEqual([article])
  })
})
