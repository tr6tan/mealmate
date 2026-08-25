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

/** Verbes d'action fréquents en cuisine : leur présence trahit une étape. */
const RE_VERBE_ETAPE =
  /\b(faire|fais|mettre|mets|ajouter|ajoute|verser|verse|mélanger|mélange|remuer|remue|cuire|cuis|couper|coupe|éplucher|épluche|laver|lave|chauffer|chauffe|préchauffer|préchauffe|égoutter|égoutte|servir|sers|saler|sale|poivrer|poivre|réserver|réserve|incorporer|incorpore|battre|bats|fouetter|fouette|napper|nappe|enfourner|enfourne|démouler|démoule|laisser|laisse|porter|porte|assaisonner|dresser|dresse|parsemer|parseme|arroser|arrose|badigeonner|saisir|saisis|dorer|revenir|mijoter|frémir|refroidir|reposer|monter|étaler|garnir|farcir|découper|trancher|hacher|émincer|râper|presser|zester|filtrer|tamiser|pétrir|abaisser)\b/i

const RE_TEMPS = /^\s*(?:temps\s*:?\s*)?(\d+)\s*(min(?:utes?)?|h(?:eures?)?)\b/i

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

  // Un temps isolé, où qu'il soit, alimente la durée plutôt que les étapes.
  const restant: string[] = []
  for (const ligne of reste) {
    const m = ligne.match(RE_TEMPS)
    if (m && ligne.length < 24 && !draft.time) {
      const valeur = parseInt(m[1], 10)
      const heures = /^h/i.test(m[2])
      draft.time = heures ? `${valeur}h` : `${valeur} min`
      draft.rapide = !heures && valeur <= 20
      continue
    }
    restant.push(ligne)
  }

  for (const ligne of restant) {
    const nu = sansNumero(ligne)
    if (!nu) continue
    // Une fois les étapes commencées, tout ce qui suit en fait partie : une
    // recette n'alterne pas ingrédients et instructions.
    if (draft.steps.length === 0 && estIngredient(nu)) {
      draft.ingredients.push(lireIngredient(nu))
    } else {
      draft.steps.push(majuscule(nu))
    }
  }

  draft.tags = deduireTags(draft.ingredients)

  // Sans durée annoncée, on en propose une plutôt que de laisser le champ vide.
  if (!draft.time) {
    const estime = Math.min(60, Math.max(10, draft.steps.length * 5))
    draft.time = `${estime} min`
    draft.rapide = estime <= 20
  }

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
