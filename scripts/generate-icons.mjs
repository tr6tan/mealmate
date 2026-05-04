import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir    = resolve(__dirname, '../public/icons')
const publicDir = resolve(__dirname, '../public')
const logoPng   = resolve(publicDir, 'logo-source.png')
const ogSvg     = resolve(publicDir, 'og-image-source.svg')

const icons = [
  // Icônes standard (favicon, apple touch icon)
  { name: 'apple-icon-180.png',             size: 180 },
  { name: 'favicon-196.png',                size: 196 },
  // Icônes manifest PWA (any + maskable)
  { name: 'manifest-icon-192.maskable.png', size: 192 },
  { name: 'manifest-icon-512.maskable.png', size: 512 },
]

// Icônes app depuis logo-source.png
// On zoome de ~8% pour que le bleu arrive aux bords (élimine les coins transparents)
const meta = await sharp(logoPng).metadata()
const cropFactor = 0.08
const cropPx = Math.round(meta.width * cropFactor)
const extractSize = meta.width - cropPx * 2

for (const { name, size } of icons) {
  await sharp(logoPng)
    .extract({ left: cropPx, top: cropPx, width: extractSize, height: extractSize })
    .resize(size, size)
    .png()
    .toFile(`${outDir}/${name}`)
  console.log(`✓ ${name} (${size}px)`)
}

// OG image depuis og-image-source.svg
await sharp(ogSvg, { density: 150 })
  .resize(1200, 630)
  .png()
  .toFile(resolve(publicDir, 'og-image.png'))
console.log('✓ og-image.png (1200×630)')

console.log('\nTous les assets générés avec succès.')

