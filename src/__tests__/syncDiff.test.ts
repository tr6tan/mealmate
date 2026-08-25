import { describe, expect, it } from 'vitest'
import {
  diffRecipes,
  diffWeekPlans,
  mergeRecipes,
  stableStringify,
} from '@/lib/syncDiff'
import type { DayPlan, Meal, Recipe, WeekPlans } from '@/types'

const repas = (name: string): Meal => ({ name, emoji: '🍽', time: '20 min', fav: false })

const jourVide = (): DayPlan => ({
  pdej: null,
  midi: null,
  midi_entree: null,
  midi_dessert: null,
  soir: null,
  soir_entree: null,
  soir_dessert: null,
})

const semaine = (modifs: Partial<Record<number, Partial<DayPlan>>> = {}): WeekPlans[string] => {
  const s: WeekPlans[string] = {}
  for (let i = 0; i < 7; i++) s[i] = { ...jourVide(), ...(modifs[i] ?? {}) }
  return s
}

describe('stableStringify', () => {
  it('ignore l’ordre des clés', () => {
    // Firestore renvoie les objets avec des clés réordonnées : sans ça, tout
    // paraît modifié à chaque snapshot.
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }))
    expect(stableStringify({ qty: '60g', name: 'Céréales' })).toBe(
      stableStringify({ name: 'Céréales', qty: '60g' }),
    )
  })

  it('respecte l’ordre des tableaux', () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]))
  })
})

describe('diffWeekPlans', () => {
  it('ne renvoie rien quand rien ne change', () => {
    const w: WeekPlans = { '2026-08-24': semaine({ 1: { midi: repas('Ratatouille') } }) }
    expect(diffWeekPlans(w, structuredClone(w))).toEqual({})
  })

  it('ne cible que le créneau modifié', () => {
    const avant: WeekPlans = { '2026-08-24': semaine() }
    const apres: WeekPlans = { '2026-08-24': semaine({ 1: { midi: repas('Ratatouille') } }) }
    const writes = diffWeekPlans(avant, apres)
    expect(Object.keys(writes)).toEqual(['weekPlans.2026-08-24.1.midi'])
    expect(writes['weekPlans.2026-08-24.1.midi']).toMatchObject({ name: 'Ratatouille' })
  })

  it('écrit null pour un repas retiré', () => {
    const avant: WeekPlans = { '2026-08-24': semaine({ 1: { midi: repas('Ratatouille') } }) }
    const apres: WeekPlans = { '2026-08-24': semaine() }
    expect(diffWeekPlans(avant, apres)).toEqual({ 'weekPlans.2026-08-24.1.midi': null })
  })

  /**
   * Le cœur du problème : deux membres du foyer modifient des jours
   * différents. Chacun ne doit toucher que son propre chemin, sinon le
   * dernier à écrire efface le repas de l'autre.
   */
  it('n’écrase pas la modification concurrente d’un autre jour', () => {
    const commun: WeekPlans = { '2026-08-24': semaine() }
    const deA: WeekPlans = { '2026-08-24': semaine({ 0: { midi: repas('Lasagnes') } }) }
    const deB: WeekPlans = { '2026-08-24': semaine({ 1: { soir: repas('Curry') } }) }

    const writesA = diffWeekPlans(commun, deA)
    const writesB = diffWeekPlans(commun, deB)

    expect(Object.keys(writesA)).toEqual(['weekPlans.2026-08-24.0.midi'])
    expect(Object.keys(writesB)).toEqual(['weekPlans.2026-08-24.1.soir'])
    // Aucun chemin commun : Firestore fusionne les deux écritures.
    const collision = Object.keys(writesA).filter((k) => k in writesB)
    expect(collision).toEqual([])
  })

  it('écrit la semaine entière quand elle est nouvelle', () => {
    const apres: WeekPlans = { '2026-08-31': semaine({ 2: { soir: repas('Pizza') } }) }
    expect(Object.keys(diffWeekPlans({}, apres))).toEqual(['weekPlans.2026-08-31'])
  })

  it('supprime une semaine purgée', () => {
    const avant: WeekPlans = { '2026-07-06': semaine(), '2026-08-24': semaine() }
    const apres: WeekPlans = { '2026-08-24': semaine() }
    const writes = diffWeekPlans(avant, apres)
    expect(Object.keys(writes)).toEqual(['weekPlans.2026-07-06'])
  })
})

// ── Recettes ────────────────────────────────────────────────────────────────

const base: Recipe[] = [
  { id: 'a', name: 'Crêpes', emoji: '🥞', period: 'pdej', time: '20 min', fav: false, rapide: true },
  { id: 'b', name: 'Curry', emoji: '🍛', period: 'soir', time: '35 min', fav: false, rapide: false },
]

describe('diffRecipes', () => {
  it('ne garde rien quand le carnet est intact', () => {
    expect(diffRecipes(structuredClone(base), base)).toEqual({ custom: [], overrides: {} })
  })

  it('ne garde que le champ réellement modifié', () => {
    const modifie = base.map((r) => (r.id === 'a' ? { ...r, fav: true } : r))
    expect(diffRecipes(modifie, base)).toEqual({ custom: [], overrides: { a: { fav: true } } })
  })

  it('isole les recettes créées par le foyer', () => {
    const perso: Recipe = {
      id: 'z', name: 'Tarte tatin', emoji: '🥧', period: 'soir', time: '1h', fav: true, rapide: false,
    }
    const delta = diffRecipes([...base, perso], base)
    expect(delta.custom).toEqual([perso])
    expect(delta.overrides).toEqual({})
  })

  it('note un champ vidé plutôt que de l’oublier', () => {
    const sansSteps = base.map((r) =>
      r.id === 'b' ? { ...r, notes: undefined } : r,
    )
    // `notes` était absent des deux côtés : rien à signaler.
    expect(diffRecipes(sansSteps, base).overrides).toEqual({})

    const avecNotes = base.map((r) => (r.id === 'b' ? { ...r, notes: 'Ajouter du lait' } : r))
    const puisVide = avecNotes.map((r) => (r.id === 'b' ? { ...r, notes: undefined } : r))
    // Firestore refuse `undefined` : le champ vidé se note null.
    expect(diffRecipes(puisVide, avecNotes).overrides).toEqual({ b: { notes: null } })
  })

  it('ignore un simple réordonnancement des clés', () => {
    // C'est exactement ce que fait Firestore au retour d'un snapshot.
    const reordonne = base.map(
      (r) =>
        Object.keys(r)
          .sort()
          .reverse()
          .reduce<Record<string, unknown>>((acc, k) => {
            acc[k] = (r as unknown as Record<string, unknown>)[k]
            return acc
          }, {}) as unknown as Recipe,
    )
    expect(Object.keys(reordonne[0])).not.toEqual(Object.keys(base[0]))
    expect(diffRecipes(reordonne, base)).toEqual({ custom: [], overrides: {} })
  })
})

describe('mergeRecipes', () => {
  it('reconstruit exactement le carnet d’origine', () => {
    const carnet: Recipe[] = [
      { ...base[0], fav: true },
      base[1],
      { id: 'z', name: 'Tatin', emoji: '🥧', period: 'soir', time: '1h', fav: false, rapide: false },
    ]
    const delta = diffRecipes(carnet, base)
    expect(mergeRecipes(base, delta)).toEqual(carnet)
  })

  it('ne fait pas revenir une recette livrée supprimée', () => {
    const delta = diffRecipes(base.filter((r) => r.id !== 'a'), base)
    const recompose = mergeRecipes(base, delta, ['a'])
    expect(recompose.map((r) => r.id)).toEqual(['b'])
  })

  it('restitue un champ vidé', () => {
    const avecNotes = base.map((r) => (r.id === 'b' ? { ...r, notes: 'test' } : r))
    const delta = diffRecipes(base, avecNotes)
    const recompose = mergeRecipes(avecNotes, delta)
    expect(recompose.find((r) => r.id === 'b')).not.toHaveProperty('notes')
  })

  it('survit à un aller-retour complet', () => {
    const carnet = base.map((r, i) => ({ ...r, fav: i === 0, notes: i === 1 ? 'à tester' : undefined }))
    const recompose = mergeRecipes(base, diffRecipes(carnet, base))
    expect(diffRecipes(recompose, base)).toEqual(diffRecipes(carnet, base))
  })
})
