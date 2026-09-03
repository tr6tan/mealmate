import type { RecipeFormValues } from '@/components/sheets/recipeFormOptions'
import { devinerCategorie } from '@/lib/categorieIngredient'
import { devinerPeriode, devinerRegimes } from '@/lib/classerRecette'
import { BASE_PORTIONS, resizeToBase64 } from '@/lib/utils'
import { DUREE_MAX, DUREE_MIN, formaterDuree } from '@/lib/duree'

/**
 * Import d'une recette photographiée.
 *
 * La lecture de l'image se fait sur le serveur, où vit la clé. Ici on prépare
 * la photo, on appelle, et on convertit la réponse en valeurs de formulaire.
 *
 * Rien n'est enregistré : le résultat remplit le formulaire, que la personne
 * relit avant de valider. Un modèle qui lit « 7 kg » au lieu de « 1 kg » se
 * corrige alors en un geste, au lieu de partir dans la liste de courses.
 */

/** Ce que le serveur rend. Tout est suspect jusqu'à vérification. */
export interface RecetteLue {
  lisible: boolean
  nom: string
  minutes: number
  portions: number
  ingredients: { nom: string; quantite: string }[]
  etapes: string[]
}

export class ErreurImport extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'ErreurImport'
  }
}

/** Messages destinés à la personne, pas au journal. */
const MESSAGES: Record<string, string> = {
  'cle-absente': "L'import par photo n'est pas encore configuré sur le serveur.",
  'trop-de-demandes': 'Trop de photos d’un coup. Réessaie dans une minute.',
  'image-trop-grosse': 'Photo trop lourde, réessaie avec un cadrage plus serré.',
  'image-absente': 'Aucune photo reçue.',
  'reponse-vide': 'La lecture n’a rien rendu. Réessaie avec une photo plus nette.',
  fournisseur: 'La lecture a échoué. Réessaie dans un moment.',
  reseau: 'Impossible de joindre le serveur. Vérifie ta connexion.',
  'trop-long': 'La lecture a pris trop de temps. Réessaie, ou cadre la photo sur la seule recette.',
  illisible: 'Je ne reconnais pas une recette sur cette photo.',
  // Cette panne-la s'était déguisée en « la lecture a échoué » : la requête
  // n'atteignait pas la fonction, l'app recevait la page d'accueil avec un
  // code 200, et la lecture du JSON échouait sans rien dire d'utile.
  'route-absente': "La fonction d'import n'est pas déployée (l'app a répondu à sa place).",
}

export function messageDErreur(code: string): string {
  return MESSAGES[code] ?? MESSAGES.fournisseur
}

/*
 * 1600px de large : il faut de la résolution pour lire les petits caractères
 * d'une page de livre. Le redimensionnement par défaut de l'app vise 640px,
 * fait pour une vignette, et rendrait la photo illisible.
 */
const LARGEUR = 1600
const QUALITE = 0.85

/** Envoie la photo au serveur et rend ce qui a été lu. */
export async function lirePhoto(fichier: File): Promise<RecetteLue> {
  const dataUrl = await resizeToBase64(fichier, LARGEUR, QUALITE)
  // `resizeToBase64` rend une data URL ; l'API veut le base64 seul.
  const image = dataUrl.slice(dataUrl.indexOf(',') + 1)

  /*
   * Une lecture d'image prend couramment quinze à trente secondes. Le plan
   * Vercel coupe à dix secondes par défaut, et la fonction déclare donc
   * `maxDuration`. Côté client, on abandonne un peu avant la fin du plafond
   * pour rendre un message qui dit ce qui s'est passé : sans lui, une coupure
   * de la connexion par le serveur ressemble à une absence de réseau, et le
   * message le disait à tort.
   */
  const abandon = new AbortController()
  const minuterie = setTimeout(() => abandon.abort(), 55_000)

  let reponse: Response
  try {
    reponse = await fetch('/api/importer-recette', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mimeType: 'image/jpeg' }),
      signal: abandon.signal,
    })
  } catch (e) {
    const code = (e as Error)?.name === 'AbortError' ? 'trop-long' : 'reseau'
    throw new ErreurImport(code, messageDErreur(code))
  } finally {
    clearTimeout(minuterie)
  }

  /*
   * Une réponse qui n'est pas du JSON vient de la page d'accueil renvoyée à
   * la place de la fonction : on le dit plutôt que de laisser `.json()`
   * échouer sur du HTML et remonter une panne anonyme.
   */
  const typeContenu = reponse.headers.get('content-type') ?? ''
  if (!typeContenu.includes('json')) {
    throw new ErreurImport('route-absente', messageDErreur('route-absente'))
  }

  const corps = await reponse.json().catch(() => null)
  if (corps === null) {
    throw new ErreurImport('route-absente', messageDErreur('route-absente'))
  }

  if (!reponse.ok) {
    const code = (corps as { erreur?: string }).erreur ?? 'fournisseur'
    const detail = (corps as { message?: string }).message
    // Le message du fournisseur est conservé : sans lui, une erreur de champ
    // dans la requête ressemble à une panne réseau et ne se corrige pas.
    throw new ErreurImport(code, detail ? `${messageDErreur(code)}\n${detail}` : messageDErreur(code))
  }

  const lue = corps as RecetteLue
  if (!lue?.lisible || !lue.nom?.trim()) {
    throw new ErreurImport('illisible', messageDErreur('illisible'))
  }
  return lue
}

/**
 * Convertit ce qui a été lu en valeurs de formulaire.
 *
 * Chaque champ est borné : le modèle peut rendre 0, un nombre négatif ou une
 * durée de trois jours, et le formulaire n'est pas l'endroit où découvrir ça.
 * Le rayon, le moment et le régime sont déduits ici par le code déja en
 * place, plutôt que demandés au modèle.
 */
export function versFormulaire(lue: RecetteLue): RecipeFormValues {
  const nom = lue.nom.trim()

  const ingredients = (lue.ingredients ?? [])
    .filter((i) => i?.nom?.trim())
    .map((i) => ({
      name: i.nom.trim(),
      qty: (i.quantite ?? '').trim(),
      category: devinerCategorie(i.nom),
    }))

  const etapes = (lue.etapes ?? []).map((e) => (e ?? '').trim()).filter(Boolean)

  const minutes = Number.isFinite(lue.minutes) && lue.minutes > 0
    ? Math.min(DUREE_MAX, Math.max(DUREE_MIN, Math.round(lue.minutes)))
    : 30

  const portions = Number.isFinite(lue.portions) && lue.portions > 0
    ? Math.min(24, Math.max(1, Math.round(lue.portions)))
    : BASE_PORTIONS

  return {
    name: nom,
    time: formaterDuree(minutes),
    period: devinerPeriode(nom),
    fav: false,
    rapide: minutes <= 20,
    photo: undefined,
    ingredients,
    steps: etapes.length ? etapes : [''],
    tags: devinerRegimes(ingredients, nom),
    portions,
    /*
     * Le moment et le régime viennent d'une déduction, pas d'un choix : les
     * drapeaux restent baissés pour que la personne puisse encore les voir
     * marqués « proposé » et les corriger.
     */
    periodChoisie: false,
    tagsChoisis: false,
  }
}
