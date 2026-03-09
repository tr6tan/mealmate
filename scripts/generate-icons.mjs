import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir    = resolve(__dirname, '../public/icons')
const source    = resolve(__dirname, '../public/logo-source.png')

const icons = [
  // Icônes standard (favicon, apple touch icon)
  { name: 'apple-icon-180.png',             size: 180 },
  { name: 'favicon-196.png',                size: 196 },
  // Icônes manifest PWA (any + maskable)
  { name: 'manifest-icon-192.maskable.png', size: 192 },
  { name: 'manifest-icon-512.maskable.png', size: 512 },
]

for (const { name, size } of icons) {
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(`${outDir}/${name}`)
  console.log(`✓ ${name} (${size}px)`)
}

console.log('\nTous les icônes générés avec succès.')

