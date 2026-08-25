import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getStickerSlug } from '@/lib/stickers'

describe('getStickerSlug', () => {
  it('reconnaît un plat composé avant ses ingrédients', () => {
    expect(getStickerSlug('Pâtes carbonara')).toBe('spaghetti')
    expect(getStickerSlug('Pizza margherita')).toBe('pizza')
  })

  it('ignore la casse et les accents', () => {
    expect(getStickerSlug('PÂTES PESTO')).toBe('spaghetti')
    expect(getStickerSlug('pates pesto')).toBe('spaghetti')
  })

  it('renvoie null quand rien ne matche', () => {
    expect(getStickerSlug('')).toBeNull()
    expect(getStickerSlug('zzzzz')).toBeNull()
  })

  /**
   * Régression : ces trois règles contenaient un caractère backspace (0x08)
   * au lieu de `\b`, elles ne matchaient donc jamais.
   */
  it('matche les règles à frontière de mot', () => {
    expect(getStickerSlug('Bacon grillé')).toBe('bacon')
    expect(getStickerSlug('Rôti de porc')).toBe('steak-rare')
    expect(getStickerSlug('Crabe farci')).toBe('crab')
  })

  it('ne contient plus de caractères de contrôle dans ses motifs', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/lib/stickers.ts'), 'utf8')
    // eslint-disable-next-line no-control-regex
    expect(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(src)).toBe(false)
  })
})
