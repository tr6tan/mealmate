// Télécharge les 219 stickers food d'Icons8 listés dans icons8-food-stickers-slugs.json
// CDN : https://img.icons8.com/stickers/{size}/{slug}.png
import fs from 'node:fs/promises'
import path from 'node:path'

const SIZE = 200
const OUT_DIR = path.resolve('public/icons/stickers')
const SLUGS = JSON.parse(await fs.readFile('scripts/icons8-food-stickers-slugs.json', 'utf-8'))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

await fs.mkdir(OUT_DIR, { recursive: true })

async function dl(slug) {
  // normalisation : minuscules, slug commençant par "-" → on retire le tiret de tête
  const clean = slug.toLowerCase().replace(/^-+/, '')
  const dest = path.join(OUT_DIR, `${clean}.png`)
  try { await fs.access(dest); return 'skip' } catch {}
  const url = `https://img.icons8.com/stickers/${SIZE}/${encodeURIComponent(slug)}.png`
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://icons8.com/' } })
  if (!res.ok) return `fail:${res.status}`
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 500) return 'fail:tiny'
  await fs.writeFile(dest, buf)
  return 'ok'
}

const concurrency = 10
let i = 0, ok = 0, skip = 0, fail = 0
const failed = []
async function worker() {
  while (i < SLUGS.length) {
    const slug = SLUGS[i++]
    const r = await dl(slug)
    if (r === 'ok') { ok++; process.stdout.write('.') }
    else if (r === 'skip') { skip++; process.stdout.write('-') }
    else { fail++; failed.push(`${slug} → ${r}`); process.stdout.write('x') }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker))
console.log(`\n\nok=${ok} skip=${skip} fail=${fail} total=${SLUGS.length}`)
if (failed.length) console.log('Échecs :\n  ' + failed.join('\n  '))
