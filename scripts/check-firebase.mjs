/**
 * Script de vérification Firebase — lit les collections foyers et foyers_dev
 * Usage : node scripts/check-firebase.mjs
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Charge le .env.local manuellement (Vite ne tourne pas ici)
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

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
}

console.log(`\n🔥  Projet Firebase : ${firebaseConfig.projectId}`)

const app = initializeApp(firebaseConfig)
// getFirestore() sans persistance → compatible Node.js
const db = getFirestore(app)

async function checkCollection(name) {
  try {
    console.log(`\n📂  Collection "${name}" …`)
    const snap = await getDocs(collection(db, name))
    if (snap.empty) {
      console.log('    (vide)')
      return
    }
    snap.forEach((docSnap) => {
      const d = docSnap.data()
      const weeks    = Object.keys(d.weekPlans  ?? {}).length
      const recipes  = (d.recipes       ?? []).length
      const items    = (d.shoppingItems ?? []).length
      console.log(`    ✅  ${docSnap.id}`)
      console.log(`        weekPlans     : ${weeks} semaine(s)`)
      console.log(`        recipes       : ${recipes} recette(s)`)
      console.log(`        shoppingItems : ${items} article(s)`)
      if (d.settings) {
        console.log(`        settings      : ${JSON.stringify(d.settings)}`)
      }
    })
  } catch (err) {
    console.error(`    ❌  Erreur sur "${name}" :`, err.message)
  }
}

await checkCollection('foyers')
await checkCollection('foyers_dev')

console.log('\n✅  Vérification terminée.\n')
process.exit(0)
