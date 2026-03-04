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

  <!-- Corps du bol -->
  <path d="M 88,294 Q 82,448 256,456 Q 430,448 424,294"
        fill="none" stroke="#D23D2D" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="256" cy="294" rx="168" ry="26"
           fill="#F8EECB" stroke="#D23D2D" stroke-width="22"/>

  <!-- Champignon – chapeau -->
  <path d="M 208,358 Q 204,308 256,304 Q 308,308 304,358 Z"
        fill="none" stroke="#D23D2D" stroke-width="16" stroke-linejoin="round"/>
  <!-- Champignon – pied -->
  <path d="M 240,356 L 240,388 Q 240,398 256,398 Q 272,398 272,388 L 272,356"
        fill="none" stroke="#D23D2D" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Olives -->
  <circle cx="164" cy="382" r="18" fill="none" stroke="#D23D2D" stroke-width="14"/>
  <circle cx="348" cy="374" r="15" fill="none" stroke="#D23D2D" stroke-width="14"/>
  <!-- Petite feuille intérieure -->
  <path d="M 145,342 Q 172,318 195,342"
        fill="none" stroke="#D23D2D" stroke-width="13" stroke-linecap="round"/>

  <!-- Tige gauche avec feuille -->
  <path d="M 174,292 C 168,240 158,200 140,162"
        fill="none" stroke="#D23D2D" stroke-width="16" stroke-linecap="round"/>
  <path d="M 161,218 C 130,205 110,178 112,150 C 138,158 158,182 161,218 Z"
        fill="none" stroke="#D23D2D" stroke-width="13" stroke-linejoin="round"/>
  <!-- Tige centrale avec feuille -->
  <path d="M 220,290 C 218,230 222,180 228,138"
        fill="none" stroke="#D23D2D" stroke-width="16" stroke-linecap="round"/>
  <path d="M 220,202 C 192,188 178,162 184,136 C 208,148 222,174 220,202 Z"
        fill="none" stroke="#D23D2D" stroke-width="13" stroke-linejoin="round"/>
  <!-- Asperge droite -->
  <path d="M 300,290 C 308,240 318,190 322,148"
        fill="none" stroke="#D23D2D" stroke-width="16" stroke-linecap="round"/>
  <path d="M 322,148 C 316,132 310,124 322,114 C 334,124 328,132 322,148"
        fill="none" stroke="#D23D2D" stroke-width="13" stroke-linejoin="round"/>
  <!-- Petite tige droite avec feuille -->
  <path d="M 338,292 C 350,256 362,222 368,190"
        fill="none" stroke="#D23D2D" stroke-width="14" stroke-linecap="round"/>
  <path d="M 364,210 C 382,196 396,196 398,178 C 378,174 362,186 364,210 Z"
        fill="none" stroke="#D23D2D" stroke-width="12" stroke-linejoin="round"/>
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

