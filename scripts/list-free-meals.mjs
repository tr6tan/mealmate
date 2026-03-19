/**
 * Script pour extraire les repas "libres" (pas dans les recettes) depuis Firestore
 * Usage : node scripts/list-free-meals.mjs
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const env = {}
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [k, ...v] = line.trim().split('=')
    if (k && v.length) env[k] = v.join('=')
  }
} catch {
  console.error('❌  Impossible de lire .env.local')
  process.exit(1)
}

const app = initializeApp({
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

const snap = await getDocs(collection(db, 'foyers'))
const SLOTS = ['pdej', 'midi', 'midi_entree', 'midi_dessert', 'soir', 'soir_entree', 'soir_dessert']

for (const docSnap of snap.docs) {
  const d = docSnap.data()
  const recipeNames = new Set((d.recipes ?? []).map(r => r.name))
  const freeMeals = new Map() // name → { emoji, slots, count }

  for (const [weekKey, week] of Object.entries(d.weekPlans ?? {})) {
    for (let day = 0; day < 7; day++) {
      const plan = week[day]
      if (!plan) continue
      for (const slot of SLOTS) {
        const meal = plan[slot]
        if (!meal || !meal.name) continue
        if (recipeNames.has(meal.name)) continue
        const key = meal.name
        if (!freeMeals.has(key)) {
          freeMeals.set(key, { emoji: meal.emoji, slots: new Set(), count: 0 })
        }
        const entry = freeMeals.get(key)
        entry.slots.add(slot)
        entry.count++
      }
    }
  }

  if (freeMeals.size > 0) {
    console.log(`\n📋  Foyer ${docSnap.id} — ${freeMeals.size} repas libres :\n`)
    for (const [name, info] of [...freeMeals.entries()].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`    ${info.emoji} ${name}  (×${info.count})  [slots: ${[...info.slots].join(', ')}]`)
    }
  }
}

console.log('\n✅  Terminé.\n')
process.exit(0)
