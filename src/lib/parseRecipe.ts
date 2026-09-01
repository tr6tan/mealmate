/**
 * Lecture d'une recette écrite en texte libre.
 *
 * Créer une recette demandait de remplir sept sections avant d'atteindre le
 * premier ingrédient, puis d'ajouter chaque ingrédient un par un avec trois
 * champs chacun. On saisit désormais la recette comme on l'écrirait sur un
 * papier, et ce module en déduit la structure :
 *
 *     Pâtes carbonara
 *     20 min
 *
 *     200 g de spaghetti
 *     100 g de lardons
 *     2 œufs
 *
 *     Faire cuire les pâtes
 *     Faire revenir les lardons
 *     Mélanger hors du feu
 *
 * Le collage depuis un site de cuisine est traité à part : ces pages annoncent
 * leurs sections (« Ingrédients : », « Préparation : »), le nombre de parts et
 * des durées étiquetées. Sans les reconnaître, l'en-tête « Ingrédients : » se
 * terminait par un deux-points, passait donc pour une étape, et la règle qui
 * veut qu'après la première étape tout soit une étape avalait la liste entière.
 *
 * Rien n'est deviné en silence : l'appelant affiche le résultat pour que la
 * personne corrige avant d'enregistrer.
 */
import type { DietaryTag, Ingredient, Period, ShoppingCategory } from '@/types'
import { getStickerSlug } from '@/lib/stickers'

export interface RecipeDraft {
  name: string
  time: string
  period: Period
  ingredients: Ingredient[]
  steps: string[]
  tags: DietaryTag[]
  rapide: boolean
  /** Nombre de convives auquel les quantités se rapportent, si la recette le dit. */
  portions?: number
}

/** Unités de cuisine courantes, pour distinguer une quantité d'un nombre isolé. */
const UNITES = [
  'g', 'kg', 'mg',
  'l', 'dl', 'cl', 'ml',
  'c.à.s', 'c.à.c', 'cas', 'cac', 'cuillères?', 'cuillères? à soupe', 'cuillères? à café',
  'pincées?', 'gousses?', 'tranches?', 'branches?', 'feuilles?', 'brins?',
  'sachets?', 'boîtes?', 'bocaux', 'bocal', 'pots?', 'briques?', 'bouquets?',
  'tasses?', 'verres?', 'poignées?', 'filets?', 'morceaux?', 'parts?', 'portions?',
].join('|')

/**
 * Une ligne d'ingrédient commence par une quantité, ou reste courte et sans
 * verbe. Une étape est une phrase.
 */
const RE_QUANTITE = new RegExp(
  `^\\s*(\\d+(?:[.,]\\d+)?(?:\\s*/\\s*\\d+)?)\\s*(${UNITES})?\\b\\.?\\s*(?:de\\s+|d'|du\\s+|des\\s+|la\\s+|le\\s+|l')?(.+)$`,
  'i',
)

/**
 * Quantité rejetée en fin de ligne : « lentilles vertes 200g ». Fréquent dans
 * les listes de courses recopiées, et jusqu'ici perdu (l'ingrédient s'appelait
 * « Lentilles vertes 200g » et partait sans quantité dans la liste).
 */
const RE_QUANTITE_FIN = new RegExp(`^(.+?)[\\s:]+(\\d+(?:[.,]\\d+)?)\\s*(${UNITES})\\.?$`, 'i')

/** Verbes d'action fréquents en cuisine : leur présence trahit une étape. */
const RE_VERBE_ETAPE =
  /\b(faire|fais|mettre|mets|ajouter|ajoute|verser|verse|mélanger|mélange|remuer|remue|cuire|cuis|couper|coupe|éplucher|épluche|laver|lave|chauffer|chauffe|préchauffer|préchauffe|égoutter|égoutte|servir|sers|saler|sale|poivrer|poivre|réserver|réserve|incorporer|incorpore|battre|bats|fouetter|fouette|napper|nappe|enfourner|enfourne|démouler|démoule|laisser|laisse|porter|porte|assaisonner|dresser|dresse|parsemer|parseme|arroser|arrose|badigeonner|saisir|saisis|dorer|revenir|mijoter|frémir|refroidir|reposer|monter|étaler|garnir|farcir|découper|trancher|hacher|émincer|râper|presser|zester|filtrer|tamiser|pétrir|abaisser)\b/i

const RE_TEMPS = /^\s*(?:temps\s*:?\s*)?(\d+)\s*(min(?:utes?)?|h(?:eures?)?)\b/i

/**
 * Durée étiquetée d'un site de cuisine : « Préparation : 20 min », « Cuisson :
 * 1 h ». Le repos n'entre pas dans le total : une marinade d'une nuit ferait
 * annoncer douze heures pour un plat qui en demande vingt minutes.
 */
const RE_TEMPS_ETIQUETE =
  /^\s*(préparation|preparation|cuisson|repos|attente|marinade|total|temps)\s*:?\s*(\d+)\s*(?:(h|heures?)\s*(\d+)?|min(?:utes?)?)\b/i

/** « Pour 6 personnes », « 4 parts », « Pour 4 ». */
const RE_PORTIONS =
  /^\s*(?:pour\s+)?(\d+)\s*(?:personnes?|parts?|portions?|convives?|pers\.?)?\s*:?\s*$/i
const RE_PORTIONS_MOT = /^\s*(?:pour\s+)?(\d+)\s*(personnes?|parts?|portions?|convives?|pers\b)/i

/** En-têtes de section des sites de cuisine. */
const RE_ENTETE_INGREDIENTS =
  /^\s*(?:les\s+)?(ingr[ée]dients?|liste\s+des\s+ingr[ée]dients?|il\s+vous\s+faut|pour\s+(?:la|le|les)\s+\w+)\s*:?\s*$/i
const RE_ENTETE_ETAPES =
  /^\s*(pr[ée]parations?|instructions?|[ée]tapes?|r[ée]alisations?|marche\s+[àa]\s+suivre|recette|d[ée]roul[ée]|montage|cuisson)\s*:?\s*$/i

/** Catégorie de rayon, devinée à partir du nom de l'ingrédient. */
export function devinerCategorie(nom: string): ShoppingCategory {
  const n = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/poulet|boeuf|porc|veau|agneau|dinde|canard|jambon|lardon|bacon|saucisse|steak|escalope|viande|merguez|chorizo|salami|poisson|saumon|thon|cabillaud|crevette|gambas|moule|crabe|anchois|sardine/.test(n)) return 'viandes'
  if (/lait|creme|crème|beurre|fromage|yaourt|oeuf|œuf|mozzarella|parmesan|gruyere|emmental|feta|ricotta|mascarpone|chevre|comte|cheddar/.test(n)) return 'cremerie'
  if (/surgele|congele|glace\b/.test(n)) return 'surgeles'
  if (/lessive|savon|eponge|papier|sopalin|poubelle|vaisselle|nettoyant|dentifrice/.test(n)) return 'maison'
  if (/tomate|carotte|oignon|ail\b|salade|laitue|courgette|aubergine|poivron|champignon|epinard|brocoli|chou|poireau|celeri|concombre|radis|navet|patate|pomme de terre|haricot|petit pois|mais|potiron|courge|echalote|persil|basilic|coriandre|menthe|citron|pomme|banane|orange|fraise|framboise|mangue|ananas|raisin|peche|poire|kiwi|melon|avocat|olive/.test(n)) return 'legumes'
  return 'epicerie'
}

/** Les régimes se déduisent des ingrédients, jamais imposés en silence. */
function deduireTags(ingredients: Ingredient[]): DietaryTag[] {
  if (!ingredients.length) return []
  const noms = ingredients.map((i) => i.name.toLowerCase()).join(' ')
  const tags: DietaryTag[] = []

  const viande = /poulet|boeuf|bœuf|porc|veau|agneau|dinde|canard|jambon|lardon|bacon|saucisse|steak|viande|poisson|saumon|thon|cabillaud|crevette|gambas|anchois|sardine|merguez|chorizo|salami/.test(noms)
  const animal = /lait|crème|creme|beurre|fromage|yaourt|oeuf|œuf|miel|mozzarella|parmesan|gruyère|emmental|feta|ricotta|mascarpone/.test(noms)

  if (!viande) tags.push('vegetarien')
  if (!viande && !animal) tags.push('vegan')
  return tags
}

function estIngredient(ligne: string): boolean {
  if (RE_QUANTITE.test(ligne)) return true
  if (RE_QUANTITE_FIN.test(ligne)) return true

  const mots = ligne.trim().split(/\s+/).length
  // Un mot seul est un ingrédient : « Poivre » ou « Sel » s'écrivent comme
  // les verbes correspondants, et une étape tient rarement en un mot.
  if (mots === 1) return true

  // Sinon : ligne courte, sans verbe d'action ni ponctuation de phrase
  // (« huile d'olive », « fleur de sel »).
  return mots <= 5 && !RE_VERBE_ETAPE.test(ligne) && !/[.!?;:]$/.test(ligne.trim())
}

/** Sépare une ligne en quantité et nom. */
function lireIngredient(ligne: string): Ingredient {
  const nettoyee = ligne.replace(/^\s*[-–—•*·]\s*/, '').trim()

  const m = nettoyee.match(RE_QUANTITE)
  if (m) {
    const [, nombre, unite, reste] = m
    const nom = reste.trim().replace(/^[-–—:]\s*/, '')
    const qty = unite ? `${nombre}${/^[a-z]/i.test(unite) && unite.length <= 2 ? '' : ' '}${unite}` : nombre
    return { name: majuscule(nom), qty: qty.trim(), category: devinerCategorie(nom) }
  }

  // « Lentilles vertes 200g » : la quantité est à la fin.
  const f = nettoyee.match(RE_QUANTITE_FIN)
  if (f) {
    const [, nom, nombre, unite] = f
    const propre = nom.trim().replace(/[-–—:,]$/, '').trim()
    const qty = `${nombre}${/^[a-z]/i.test(unite) && unite.length <= 2 ? '' : ' '}${unite}`
    return { name: majuscule(propre), qty: qty.trim(), category: devinerCategorie(propre) }
  }

  return { name: majuscule(nettoyee), qty: '', category: devinerCategorie(nettoyee) }
}

function majuscule(s: string): string {
  const t = s.trim()
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** Retire une éventuelle numérotation de début de ligne. */
function sansNumero(ligne: string): string {
  return ligne.replace(/^\s*(?:\d+[.)]|[-–—•*·])\s*/, '').trim()
}

/** Met une durée en minutes au format de l'app : « 45 min », « 2h », « 1h20 ». */
function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Une ligne d'ingrédients sans chiffre peut en porter plusieurs :
 * « sel, poivre » vaut deux entrées. On ne découpe que faute de quantité, pour
 * ne pas casser « 200 g de farine, tamisée ».
 */
function eclaterIngredients(ligne: string): string[] {
  if (/\d/.test(ligne) || !ligne.includes(',')) return [ligne]
  const parts = ligne.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return [ligne]
  return parts.every((p) => p.split(/\s+/).length <= 3) ? parts : [ligne]
}

export function parseRecipe(texte: string): RecipeDraft {
  const lignes = texte.split(/\r?\n/).map((l) => l.trim())
  const utiles = lignes.filter(Boolean)

  const draft: RecipeDraft = {
    name: '',
    time: '',
    period: 'midi',
    ingredients: [],
    steps: [],
    tags: [],
    rapide: false,
  }
  if (!utiles.length) return draft

  // La première ligne non vide est le titre.
  draft.name = majuscule(sansNumero(utiles[0]))
  const reste = utiles.slice(1)

  // ── Premier passage : les lignes de métadonnées, où qu'elles soient ────────
  let minutes = 0
  let tempsSimple = ''
  const restant: string[] = []

  for (const ligne of reste) {
    // Durée étiquetée. Testée avant l'en-tête de section : « Préparation : »
    // seul annonce les étapes, « Préparation : 20 min » annonce une durée.
    const te = ligne.match(RE_TEMPS_ETIQUETE)
    if (te && ligne.length < 40) {
      const [, label, valeur, heures, minutesApres] = te
      const bas = label.toLowerCase()
      if (/repos|attente|marinade/.test(bas)) continue // hors du temps annoncé
      const n = parseInt(valeur, 10)
      minutes += heures ? n * 60 + (minutesApres ? parseInt(minutesApres, 10) : 0) : n
      continue
    }

    // Nombre de parts.
    const pm = ligne.match(RE_PORTIONS_MOT) ?? (ligne.length < 12 ? ligne.match(RE_PORTIONS) : null)
    if (pm && !draft.portions) {
      const n = parseInt(pm[1], 10)
      if (n >= 1 && n <= 24) {
        draft.portions = n
        continue
      }
    }

    // Durée nue : « 40 min ».
    const m = ligne.match(RE_TEMPS)
    if (m && ligne.length < 24 && !tempsSimple) {
      const valeur = parseInt(m[1], 10)
      tempsSimple = /^h/i.test(m[2]) ? formaterDuree(valeur * 60) : formaterDuree(valeur)
      continue
    }

    restant.push(ligne)
  }

  if (minutes > 0) draft.time = formaterDuree(minutes)
  else if (tempsSimple) draft.time = tempsSimple

  // ── Second passage : ingrédients et étapes ────────────────────────────────
  // Tant qu'aucun en-tête n'est rencontré, on devine ligne par ligne. Dès
  // qu'un site annonce ses sections, on lui fait confiance.
  let section: 'auto' | 'ingredients' | 'etapes' = 'auto'

  for (const ligne of restant) {
    if (RE_ENTETE_INGREDIENTS.test(ligne)) {
      section = 'ingredients'
      continue
    }
    if (RE_ENTETE_ETAPES.test(ligne)) {
      section = 'etapes'
      continue
    }

    const nu = sansNumero(ligne)
    if (!nu) continue

    const estIng =
      section === 'ingredients' ? true
      : section === 'etapes' ? false
      // En mode deviné, une recette n'alterne pas ingrédients et instructions :
      // une fois les étapes commencées, tout ce qui suit en fait partie.
      : draft.steps.length === 0 && estIngredient(nu)

    if (estIng) {
      for (const part of eclaterIngredients(nu)) draft.ingredients.push(lireIngredient(part))
    } else {
      draft.steps.push(majuscule(nu))
    }
  }

  draft.tags = deduireTags(draft.ingredients)

  // Sans durée annoncée, on en propose une plutôt que de laisser le champ vide.
  if (!draft.time) {
    const estime = Math.min(60, Math.max(10, draft.steps.length * 5))
    draft.time = formaterDuree(estime)
  }
  draft.rapide = /^(\d+) min$/.test(draft.time) && parseInt(draft.time, 10) <= 20

  // Le petit-déjeuner se reconnaît à son vocabulaire ; sinon on laisse midi,
  // que la personne peut changer d'un geste.
  const bas = `${draft.name} ${draft.ingredients.map((i) => i.name).join(' ')}`.toLowerCase()
  if (/petit.?dej|porridge|granola|tartine|pancake|crepe|crêpe|gaufre|smoothie|muesli|brioche|croissant|oeufs? brouilles|cereales|céréales/.test(bas)) {
    draft.period = 'pdej'
  }

  return draft
}

/** Emoji de repli, choisi d'après le nom quand aucun sticker ne correspond. */
export function devinerEmoji(nom: string): string {
  return getStickerSlug(nom) ? '' : '🍽'
}
