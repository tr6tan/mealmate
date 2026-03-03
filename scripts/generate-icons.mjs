import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir    = resolve(__dirname, '../public/icons')

// ── SVG standard (fond crème arrondi — icône "any") ──────────────────────────
const svgRounded = readFileSync(resolve(__dirname, '../public/favicon.svg'))

// ── SVG maskable (fond plein carré — icône adaptative Android/iOS) ───────────
const svgMaskable = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Fond plein (pas de border-radius : Android/iOS applique son propre masque) -->
  <rect width="512" height="512" fill="#F8EECB"/>

  <!-- Zone safe = cercle 80% → les éléments restent dans un cercle ⌀ 409px -->
  <!-- Fourchette légèrement réduite et décalée pour rester dans la safe zone -->

  <!-- 3 dents -->
  <rect x="212" y="100" width="24" height="126" rx="12" fill="#D23D2D"/>
  <rect x="244" y="100" width="24" height="126" rx="12" fill="#D23D2D"/>
  <rect x="276" y="100" width="24" height="126" rx="12" fill="#D23D2D"/>

  <!-- Base pleine -->
  <rect x="212" y="212" width="88" height="42" fill="#D23D2D"/>

  <!-- Cône de transition -->
  <path d="M212,248 L300,248 L276,282 L236,282 Z" fill="#D23D2D"/>

  <!-- Manche -->
  <rect x="234" y="268" width="44" height="148" rx="22" fill="#D23D2D"/>
</svg>`)

const icons = [
  // Icônes standard (fond arrondi transparent sur le "any")
  { svg: svgRounded,   name: 'apple-icon-180.png',             size: 180 },
  { svg: svgRounded,   name: 'favicon-196.png',                size: 196 },
  // Icônes maskable (fond plein, safe zone respectée)
  { svg: svgMaskable,  name: 'manifest-icon-192.maskable.png', size: 192 },
  { svg: svgMaskable,  name: 'manifest-icon-512.maskable.png', size: 512 },
]

for (const { svg, name, size } of icons) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`${outDir}/${name}`)
  console.log(`✓ ${name} (${size}px)`)
}

console.log('\nTous les icônes générés avec succès.')

