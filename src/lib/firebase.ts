import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// Colle ici ta config Firebase (console.firebase.google.com → Ton projet → </> → Config)
// OU remplis le fichier .env.local avec tes valeurs
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// Persistance offline native Firestore (IndexedDB)
//, Les écritures hors ligne sont mises en file et envoyées dès le retour de connexion
//, Les lectures fonctionnent depuis le cache même sans réseau
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

/**
 * Authentification anonyme.
 *
 * Elle donne à chaque appareil un uid stable, ce qui permet aux règles
 * Firestore (cf. firestore.rules) d'exiger `request.auth != null` au lieu de
 * laisser la base ouverte à tous. Aucune inscription n'est demandée à
 * l'utilisateur.
 *
 * Best-effort : si la méthode « Anonyme » n'est pas activée dans la console
 * Firebase, on journalise et l'app continue de fonctionner comme avant.
 */
export const auth = getAuth(app)

export const authReady: Promise<void> = signInAnonymously(auth)
  .then(() => undefined)
  .catch((e) => {
    console.warn(
      '[MealMate] Connexion anonyme impossible. Active « Anonymous » dans ' +
        'Firebase Console → Authentication → Sign-in method.',
      e,
    )
  })
