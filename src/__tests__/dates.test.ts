import { describe, expect, it } from 'vitest'
import { getDayFromMonday, getTodayIndex, getWeekKey, getWeekMonday } from '@/lib/utils'

describe('semaines', () => {
  it('ramène toujours au lundi, dimanche inclus', () => {
    // 2026-08-25 est un mardi → lundi 24
    expect(getWeekKey(getWeekMonday(new Date(2026, 7, 25)))).toBe('2026-08-24')
    // dimanche 30 appartient encore à la semaine du 24
    expect(getWeekKey(getWeekMonday(new Date(2026, 7, 30)))).toBe('2026-08-24')
    // lundi 31 ouvre la semaine suivante
    expect(getWeekKey(getWeekMonday(new Date(2026, 7, 31)))).toBe('2026-08-31')
  })

  it('produit une clé locale, pas UTC', () => {
    const monday = getWeekMonday(new Date(2026, 0, 1))
    const key = getWeekKey(monday)
    // La clé doit décrire la date locale du lundi, quel que soit le fuseau.
    expect(key).toBe(
      `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(
        monday.getDate(),
      ).padStart(2, '0')}`,
    )
  })

  it('situe aujourd’hui dans la semaine courante', () => {
    const monday = getWeekMonday()
    const idx = getTodayIndex(monday)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(7)
    expect(getDayFromMonday(monday, idx).toDateString()).toBe(new Date().toDateString())
  })

  it('renvoie -1 pour une semaine qui ne contient pas aujourd’hui', () => {
    const past = getWeekMonday(new Date(2020, 0, 6))
    expect(getTodayIndex(past)).toBe(-1)
  })
})
