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
  /** Cadre de la photographie du plat sur la page, si elle en porte une. */
  photo?: { presente: boolean; boite: number[] }
  /** Photo du plat déja recadrée, ajoutée après la lecture. */
  photoPlat?: string
}

export class ErreurImport extends Error {
  constructor(
    readonly code: string,
    message: string,
    /** Secondes à attendre avant de réessayer, quand le fournisseur les donne. */
    readonly attendre?: number,
  ) {
    super(message)
    this.name = 'ErreurImport'
  }
}

/** Messages destinés à la personne, pas au journal. */
const MESSAGES: Record<string, string> = {
  'cle-absente': "L'import par photo n'est pas encore configuré sur le serveur.",
  'trop-de-demandes': 'Quota de lecture épuisé. Réessaie plus tard.',
  'image-trop-grosse': 'Photo trop lourde, réessaie avec un cadrage plus serré.',
  'image-absente': 'Aucune photo reçue.',
  'reponse-vide': 'La lecture n’a rien rendu. Réessaie avec une photo plus nette.',
  fournisseur: 'La lecture a échoué. Réessaie dans un moment.',
  reseau: 'Impossible de joindre le serveur. Vérifie ta connexion.',
  'trop-long': 'La lecture a pris trop de temps. Réessaie, ou cadre la photo sur la seule recette.',
  // Le palier gratuit sature aux heures pleines. Le serveur a déja réessayé
  // une fois : dire que c'est passager évite de chercher une faute ailleurs.
  surcharge: 'Gemini est saturé en ce moment. Réessaie dans une minute.',
  // Le palier gratuit tient 20 lectures par minute. Google indique le délai
  // exact dans sa réponse : autant le reprendre plutôt qu'inventer un ordre
  // de grandeur.
  quota: 'Quota de lecture épuisé sur tous les modèles essayés.',
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

/**
 * Découpe la photographie du plat dans la page.
 *
 * Le modèle rend un cadre en [ymin, xmin, ymax, xmax] rapporté à 0-1000, ce
 * qui le rend indépendant de la taille : on recadre donc le fichier d'origine
 * en pleine résolution, et non la version réduite envoyée pour la lecture.
 *
 * Deux cadres sont refusés. Celui qui couvre presque toute la page ne serait
 * qu'une vignette de la fiche entière, illisible à 52px. Celui qui ne couvre
 * presque rien est une erreur de détection, et donnerait une bouillie de
 * pixels. Dans les deux cas mieux vaut aucune photo que celle-la : le sticker
 * illustré prend alors le relais.
 */
async function recadrer(fichier: File, boite: number[]): Promise<string | undefined> {
  if (boite.length !== 4) return undefined
  const [ymin, xmin, ymax, xmax] = boite
  const part = ((ymax - ymin) / 1000) * ((xmax - xmin) / 1000)
  if (!(part > 0.02 && part < 0.85)) return undefined

  const url = URL.createObjectURL(fichier)
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = ko
      i.src = url
    })

    const x = (xmin / 1000) * img.width
    const y = (ymin / 1000) * img.height
    const l = ((xmax - xmin) / 1000) * img.width
    const h = ((ymax - ymin) / 1000) * img.height
    if (l < 40 || h < 40) return undefined

    // Même gabarit que les photos prises dans le formulaire : la vignette est
    // affichée en carré de 52px et en bandeau de 232px.
    const cote = Math.min(720, Math.max(l, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round((l / Math.max(l, h)) * cote)
    canvas.height = Math.round((h / Math.max(l, h)) * cote)
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    ctx.drawImage(img, x, y, l, h, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82)
  } catch {
    // Un recadrage raté ne doit pas faire échouer l'import : la recette est
    // lue, c'est l'essentiel.
    return undefined
  } finally {
    URL.revokeObjectURL(url)
  }
}

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

    // Google donne le délai d'attente : le reprendre évite de faire réessayer
    // au hasard, et de consommer une requête de plus pour rien.
    if (code === 'quota') {
      const secondes = (corps as { secondes?: number | null }).secondes ?? undefined
      throw new ErreurImport(code, messageDErreur(code), secondes)
    }

    const detail = (corps as { message?: string }).message
    // Le message du fournisseur est conservé : sans lui, une erreur de champ
    // dans la requête ressemble à une panne réseau et ne se corrige pas.
    throw new ErreurImport(code, detail ? `${messageDErreur(code)}\n${detail}` : messageDErreur(code))
  }

  const lue = corps as RecetteLue
  if (!lue?.lisible || !lue.nom?.trim()) {
    throw new ErreurImport('illisible', messageDErreur('illisible'))
  }

  if (lue.photo?.presente) {
    lue.photoPlat = await recadrer(fichier, lue.photo.boite ?? [])
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
    photo: lue.photoPlat,
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
