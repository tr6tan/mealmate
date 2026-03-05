/**
 * Nettoie la collection "foyers" (prod) :
 * — Supprime tous les foyers dont weekPlans est vide
 * — Affiche les foyers conservés (ceux qui ont du planning)
 * Usage : node scripts/cleanup-prod.mjs
 */
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
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

const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
}

console.log(`\n🔥  Projet : ${firebaseConfig.projectId}`)

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const COLLECTION = 'foyers'

console.log(`\n📂  Lecture de la collection "${COLLECTION}" …\n`)

const snap = await getDocs(collection(db, COLLECTION))

const toDelete = []
const toKeep   = []

snap.forEach((docSnap) => {
  const d = docSnap.data()
  const weekCount = Object.keys(d.weekPlans ?? {}).length
  if (weekCount === 0) {
    toDelete.push(docSnap.id)
  } else {
    toKeep.push({ id: docSnap.id, weekCount, recipes: (d.recipes ?? []).length })
  }
})

console.log(`    Foyers à SUPPRIMER (weekPlans vide) : ${toDelete.length}`)
for (const id of toDelete) {
  console.log(`    🗑  ${id}`)
}

console.log(`\n    Foyers à CONSERVER (ont du planning) : ${toKeep.length}`)
for (const { id, weekCount, recipes } of toKeep) {
  console.log(`    ✅  ${id}  (${weekCount} semaine(s), ${recipes} recette(s))`)
}

// Suppression
if (toDelete.length === 0) {
  console.log('\n✅  Rien à supprimer.\n')
  process.exit(0)
}

console.log(`\n🧹  Suppression de ${toDelete.length} foyer(s) vides…`)
let deleted = 0
for (const id of toDelete) {
  try {
    await deleteDoc(doc(db, COLLECTION, id))
    console.log(`    ✅  Supprimé : ${id}`)
    deleted++
  } catch (err) {
    console.error(`    ❌  Erreur sur ${id} :`, err.message)
  }
}

console.log(`\n✅  Terminé : ${deleted}/${toDelete.length} foyers supprimés.`)
console.log(`    ${toKeep.length} foyer(s) conservé(s) en base.\n`)

process.exit(0)
