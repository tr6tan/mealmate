import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `getFoyerId` mémorise son résultat : chaque cas recharge le module pour
 * repartir d'un cache vide.
 */
async function freshFoyer(url: string) {
  vi.resetModules()
  window.history.replaceState({}, '', url)
  return import('@/lib/foyer')
}

describe('identité du foyer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retombe sur le foyer historique sans indication', async () => {
    const { getFoyerId, isLegacyFoyer } = await freshFoyer('/')
    expect(getFoyerId()).toBe('c1cfad8f-ddba-4518-a320-7776f3c0f5f7')
    expect(isLegacyFoyer()).toBe(true)
  })

  it('rejoint le foyer porté par le lien d’invitation', async () => {
    const id = 'AbCdEfGhIjKlMnOpQrStU'
    const { getFoyerId, isLegacyFoyer } = await freshFoyer(`/?foyer=${id}`)
    expect(getFoyerId()).toBe(id)
    expect(isLegacyFoyer()).toBe(false)
    // l'id est mémorisé et retiré de l'URL
    expect(localStorage.getItem('mealmate-foyer-id')).toBe(id)
    expect(window.location.search).toBe('')
  })

  it('ignore un id trop court ou mal formé', async () => {
    const { getFoyerId } = await freshFoyer('/?foyer=court')
    expect(getFoyerId()).toBe('c1cfad8f-ddba-4518-a320-7776f3c0f5f7')
  })

  it('réutilise le dernier foyer connu de l’appareil', async () => {
    const id = 'ZzYyXxWwVvUuTtSsRrQqP'
    localStorage.setItem('mealmate-foyer-id', id)
    const { getFoyerId } = await freshFoyer('/')
    expect(getFoyerId()).toBe(id)
  })

  it('crée un foyer privé assez long pour les règles Firestore', async () => {
    const { createFoyer } = await freshFoyer('/')
    const id = createFoyer()
    expect(id.length).toBeGreaterThanOrEqual(16)
    expect(id).not.toBe('c1cfad8f-ddba-4518-a320-7776f3c0f5f7')
    expect(localStorage.getItem('mealmate-foyer-id')).toBe(id)
  })

  it('porte l’id du foyer dans le lien d’invitation', async () => {
    const id = 'MmNnOoPpQqRrSsTtUuVvW'
    const { joinFoyer, getInviteUrl } = await freshFoyer('/')
    expect(joinFoyer(id)).toBe(true)
    expect(getInviteUrl()).toContain(`foyer=${id}`)
  })
})
