/**
 * Photos de recettes — stockées hors du document foyer.
 *
 * Un document Firestore plafonne à 1 Mio. Une photo compressée pèse ~40 Ko en
 * base64 : quelques recettes illustrées suffisaient à faire dépasser le doc
 * `foyers/{id}` et à faire échouer TOUTES les écritures (planning, courses…).
 *
 * Chaque photo vit donc dans son propre document :
 *     foyers/{foyerId}/photos/{recipeId}  →  { data: "data:image/jpeg;base64,…" }
 *
 * Le champ `Recipe.photo` ne contient plus que des URL distantes (recettes
 * importées du web). Les photos prises par l'utilisateur passent ici.
 */
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTION, getFoyerId } from '@/lib/foyer'

export const PHOTOS_SUBCOLLECTION = 'photos'

/** Une dataURL base64 (photo locale) par opposition à une URL http distante. */
export function isDataUrl(v: string | undefined | null): boolean {
  return typeof v === 'string' && v.startsWith('data:')
}

/** Limite de sécurité par photo (le doc Firestore plafonne à 1 Mio). */
export const MAX_PHOTO_BYTES = 700 * 1024

function photoRef(recipeId: string) {
  return doc(db, COLLECTION, getFoyerId(), PHOTOS_SUBCOLLECTION, recipeId)
}

/** Écrit (ou remplace) la photo d'une recette. Rejette si elle est trop lourde. */
export async function savePhoto(recipeId: string, dataUrl: string): Promise<void> {
  if (dataUrl.length > MAX_PHOTO_BYTES) {
    throw new Error(`Photo trop lourde (${Math.round(dataUrl.length / 1024)} Ko)`)
  }
  await setDoc(photoRef(recipeId), { data: dataUrl })
}

/** Supprime la photo d'une recette (sans erreur si elle n'existe pas). */
export async function deletePhoto(recipeId: string): Promise<void> {
  await deleteDoc(photoRef(recipeId)).catch(() => {
    /* déjà absente */
  })
}

let warnedOnce = false

/** S'abonne aux photos du foyer. Renvoie la fonction de désinscription. */
export function subscribePhotos(
  onChange: (photos: Record<string, string>) => void,
): () => void {
  const col = collection(db, COLLECTION, getFoyerId(), PHOTOS_SUBCOLLECTION)
  return onSnapshot(
    col,
    (snap) => {
      const photos: Record<string, string> = {}
      snap.forEach((d) => {
        const data = d.data() as { data?: string }
        if (data?.data) photos[d.id] = data.data
      })
      onChange(photos)
    },
    (e: { code?: string }) => {
      // Sous-collection non autorisée : les règles Firestore n'ont pas encore
      // été déployées (cf. firestore.rules). L'app reste utilisable sans les
      // photos, on prévient une seule fois au lieu de saturer la console.
      if (warnedOnce) return
      warnedOnce = true
      if (e?.code === 'permission-denied') {
        console.warn(
          '[MealMate] Photos inaccessibles : déploie les règles Firestore ' +
            '(firebase deploy --only firestore:rules). L\'app continue sans elles.',
        )
      } else {
        console.error('[MealMate] Lecture des photos impossible:', e)
      }
      onChange({})
    },
  )
}
