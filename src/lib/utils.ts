import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DayPlan } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DAY_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'] as const
export const DAY_LONG  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
export const MONTHS    = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'] as const

export const PERIOD_LABEL = { pdej: 'Petit-dej', midi: 'Midi', soir: 'Soir' } as const
export const PERIOD_LONG  = { pdej: 'Petit-déjeuner', midi: 'Déjeuner', soir: 'Dîner' } as const

/** Lundi de la semaine courante (ou d'une date donnée) */
export function getWeekMonday(from = new Date()): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d
}

/** Lundi de la semaine courante + offset (en semaines, peut être négatif) */
export function getMondayByOffset(offset: number): Date {
  const monday = getWeekMonday()
  monday.setDate(monday.getDate() + offset * 7)
  return monday
}

/** Clé unique pour une semaine (YYYY-MM-DD du lundi) */
export function getWeekKey(monday: Date): string {
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const d = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Date du Nième jour à partir du lundi */
export function getDayFromMonday(monday: Date, dayIdx: number): Date {
  const d = new Date(monday)
  d.setDate(monday.getDate() + dayIdx)
  return d
}

/** Index du jour actuel dans la semaine (0=Lun…6=Dim), ou -1 si hors semaine */
export function getTodayIndex(monday: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = getDayFromMonday(monday, i)
    if (d.getTime() === today.getTime()) return i
  }
  return -1
}

export function emptyDay(): DayPlan {
  return {
    pdej: null,
    midi: null,
    midi_entree: null,
    midi_dessert: null,
    soir: null,
    soir_entree: null,
    soir_dessert: null,
  }
}

export const CAT_LABELS: Record<string, string> = {
  legumes: 'Fruits & Légumes',
  viandes: 'Viandes',
  cremerie: 'Crèmerie',
  epicerie: 'Épicerie',
  surgeles: 'Surgelés',
  maison: 'Maison & Hygiène',
}

// ── Emoji par nom d'ingrédient ───────────────────────────────────────────────

const INGREDIENT_EMOJIS: [RegExp, string][] = [
  // ── Légumes ──────────────────────────────────────────────────────────────
  [/tomat/i,                                           '🍅'],
  [/carott/i,                                          '🥕'],
  [/poireau/i,                                         '🧅'],
  [/echalote|échalote/i,                               '🧅'],
  [/oignon/i,                                          '🧅'],
  [/ciboule|ciboulette|cebette|cébette|cive\b/i,       '🧅'],
  [/ail|gousse d'ail/i,                                '🧄'],
  [/poivron/i,                                         '🫑'],
  [/piment/i,                                          '🌶️'],
  [/courgett/i,                                        '🥒'],
  [/concombr/i,                                        '🥒'],
  [/brocoli|brocco/i,                                  '🥦'],
  [/chou-fleur|choufleur/i,                            '🥦'],
  [/chou\b|choux|pak cho|bok cho|blette/i,             '🥬'],
  [/endive|chicorée|mache|mâche|laitue|roquette|épinard|spinach|salade\b/i, '🥬'],
  [/champignon|morille|girolles?|chanterelle|cèpe/i,   '🍄'],
  [/pomme de terre|patate\b/i,                         '🥔'],
  [/aubergine/i,                                       '🍆'],
  [/mais\b|maïs\b/i,                                   '🌽'],
  [/avocat/i,                                          '🥑'],
  [/courge|butternut|potimarron|potiron|patisson|pâtisson|citrouille/i, '🎃'],
  [/betterave/i,                                       '🔴'],
  [/navet|radis|panais/i,                              '🌱'],
  [/asperge/i,                                         '🌿'],
  [/artichaut/i,                                       '🌿'],
  [/fenouil|céleri|celeri|rhubarbe/i,                  '🌿'],
  [/citronnelle/i,                                     '🌿'],
  [/haricot vert|haricot plat/i,                       '🫘'],
  [/petit pois|petits pois|pois gourmand|mangetout/i,  '🫘'],
  [/edamame/i,                                         '🫘'],
  // ── Fruits ───────────────────────────────────────────────────────────────
  [/citron vert/i,                                     '🍋'],
  [/citron|lime/i,                                     '🍋'],
  [/orange|clémentine|clementine|mandarine|pamplemousse/i, '🍊'],
  [/pomme/i,                                           '🍎'],
  [/poire\b/i,                                         '🍐'],
  [/banane/i,                                          '🍌'],
  [/fraise/i,                                          '🍓'],
  [/framboise|mûre|myrtille/i,                         '🍓'],
  [/cerise/i,                                          '🍒'],
  [/peche|pêche|abricot|nectarine/i,                   '🍑'],
  [/prune|pruneaux|quetsche/i,                         '🍇'],
  [/raisin/i,                                          '🍇'],
  [/kiwi/i,                                            '🥝'],
  [/ananas/i,                                          '🍍'],
  [/noix de coco|coco rapé|coco rappé/i,               '🥥'],
  [/lait de coco/i,                                    '🥥'],
  [/mangue/i,                                          '🥭'],
  [/pastèque/i,                                        '🍉'],
  [/melon|cantaloup/i,                                 '🍈'],
  [/figue/i,                                           '🍈'],
  // ── Herbes & épices ──────────────────────────────────────────────────────
  [/basilic|persil|coriandre|thym|romarin|origan|menthe|laurier|estragon|aneth|sauge|cerfeuil|sarriette/i, '🌿'],
  [/herbe|herbes de provence|bouquet garni/i,          '🌿'],
  [/vanille|cannelle|cardamome|curcuma|paprika|cumin|curry|gingembre|muscade|sumac|ras el hanout|zaatar|harissa|quatre épice/i, '🌶️'],
  [/épice|épices|mélange/i,                            '🌶️'],
  [/sel|poivre/i,                                      '🧂'],
  // ── Viandes ──────────────────────────────────────────────────────────────
  [/poulet|dinde|volaille|pintade|caille|canard|oie/i, '🍗'],
  [/porc|cochon|filet mignon|rôti de|côtelette/i,      '🥓'],
  [/lard|bacon|lardons/i,                              '🥓'],
  [/jambon/i,                                          '🥓'],
  [/saucisse|saucisson|merguez|chorizo|chipolata|boudin/i, '🌭'],
  [/agneau|mouton|gigot|côtelettes d'agneau/i,         '🍖'],
  [/veau|bœuf|boeuf|steak|hach|entrecôte|paleron|jarret|osso buco/i, '🥩'],
  [/lapin/i,                                           '🥩'],
  [/viande/i,                                          '🥩'],
  // ── Poissons & fruits de mer ─────────────────────────────────────────────
  [/crevette|gambas/i,                                 '🦐'],
  [/langouste|homard/i,                                '🦞'],
  [/crabe/i,                                           '🦀'],
  [/moule|coquille saint.jacques|palourde|huitre|huître|clovisse/i, '🦪'],
  [/poulpe|pieuvre|seiche/i,                           '🐙'],
  [/calamar|calmar/i,                                  '🦑'],
  [/saumon fumé/i,                                     '🐟'],
  [/saumon|thon|cabillaud|morue|truite|sole|dorade|lieu|flétan|maquereau|sardine|anchois|hareng|bar\b|lotte|colin|merlu|espadon/i, '🐟'],
  [/poisson/i,                                         '🐟'],
  // ── Crèmerie ─────────────────────────────────────────────────────────────
  [/parmesan|mozzarella|gruyere|gruyère|emmental|feta|brie|camembert|roquefort|gouda|cheddar|comté|ricotta|mascarpone|fromage/i, '🧀'],
  [/oeuf|œuf|oeufs|œufs/i,                            '🥚'],
  [/beurre/i,                                          '🧈'],
  [/crème fraîche|crème liquide|crème épaisse|crème entière|crème fleurette/i, '🥛'],
  [/crème|creme/i,                                     '🥛'],
  [/fromage blanc|cottage/i,                           '🥛'],
  [/yaourt|yogourt|yoghurt|skyr/i,                     '🥛'],
  [/lait/i,                                            '🥛'],
  // ── Céréales & féculents ─────────────────────────────────────────────────
  [/pâte\b|pasta|spaghetti|tagliatelle|rigatoni|fusilli|macaroni|lasagne|penne|linguine|fettucine|gnocchi|orzo|coquillette|vermicelle|capellini/i, '🍝'],
  [/riz\b/i,                                           '🍚'],
  [/quinoa/i,                                          '🌾'],
  [/couscous|semoule|boulgour|boulghour/i,             '🌾'],
  [/polenta/i,                                         '🌾'],
  [/avoine|flocon|muesli|granola|porridge/i,           '🥣'],
  [/farine|maizena|maïzena|fécule|chapelure|mie de pain/i, '🌾'],
  [/pain\b|baguette|brioche|toast|biscottes|naan|pita|focaccia|tortilla de blé/i, '🍞'],
  // ── Légumineuses & protéines végétales ───────────────────────────────────
  [/tofu/i,                                            '🫘'],
  [/tempeh|seitan/i,                                   '🫘'],
  [/lentille/i,                                        '🫘'],
  [/pois chiche/i,                                     '🫘'],
  [/haricot\b|flageolet|pois cassé|fèves?/i,           '🫘'],
  [/soja\b/i,                                          '🫘'],
  // ── Noix & graines ────────────────────────────────────────────────────────
  [/noix de cajou|noix de macadamia|noix de pécan|noix\b/i, '🥜'],
  [/noisette|amande|pistache|cacahuète|cacahuete/i,    '🥜'],
  [/graine de chia|graine de lin|graine de sésame|graine de tournesol|graine de pavot/i, '🌱'],
  [/graine|graines/i,                                  '🌱'],
  [/sesame|sésame|tahini/i,                            '🌰'],
  // ── Produits sucrés ──────────────────────────────────────────────────────
  [/sucre|cassonade|vergeoise/i,                       '🍬'],
  [/sirop d'érable|sirop d'agave|sirop de/i,           '🍯'],
  [/miel/i,                                            '🍯'],
  [/chocolat|cacao/i,                                  '🍫'],
  [/confiture|marmelade|gelée de/i,                    '🍓'],
  [/caramel|praline|pralinoise/i,                      '🍬'],
  [/vanille extrait/i,                                 '🌶️'],
  // ── Boissons & sauces ────────────────────────────────────────────────────
  [/café|cafe/i,                                       '☕'],
  [/thé\b|the\b/i,                                     '🍵'],
  [/vin blanc|vin rouge|vin rosé|vin/i,                '🍷'],
  [/bière|biere/i,                                     '🍺'],
  [/eau\b|eau gazeuse|eau plate/i,                     '💧'],
  [/jus d'orange|jus de fruit|jus de citron|jus de pomme/i, '🥤'],
  [/lait de coco/i,                                    '🥥'],
  [/huile/i,                                           '🫙'],
  [/vinaigre/i,                                        '🫙'],
  [/bouillon|fond de/i,                                '🫙'],
  [/sauce soja|sauce poisson|nuoc.mam|tamari|worcestershire|sauce\b|ketchup|mayonnaise|mayo\b|moutarde/i, '🫙'],
  [/levure|bicarbonate/i,                              '🧫'],
  // ── Surgelés ─────────────────────────────────────────────────────────────
  [/surgelé|surgele|glace|sorbet/i,                    '🧊'],
  // ── Maison ───────────────────────────────────────────────────────────────
  [/détergent|nettoyant|liquide vaisselle|savon|shampoo/i, '🧴'],
  [/papier|essuie/i,                                   '🧻'],
]

export function ingredientEmoji(name: string): string {
  for (const [pattern, emoji] of INGREDIENT_EMOJIS) {
    if (pattern.test(name)) return emoji
  }
  return '🫙'
}

/** Vibration haptic légère (iOS silent, Android light) */
export function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern) } catch { /* silencé si non supporté */ }
}

// ── Recherche floue (fuzzy search) ──────────────────────────────────────────

/** Retire accents + minuscules */
function normalizeStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/** Distance de Levenshtein bornée */
function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

/**
 * Recherche floue : retourne un score > 0 si `query` matche `target`.
 * Tolère fautes de frappe, accents manquants, sous-chaînes.
 * Score plus élevé = meilleur match.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = normalizeStr(query)
  const t = normalizeStr(target)
  if (!q) return 1 // query vide → tout match
  if (t === q) return 100 // exact
  if (t.includes(q)) return 80 // sous-chaîne exacte
  if (q.length >= 3 && t.startsWith(q)) return 90 // préfixe

  // Recherche par mots du query dans le target
  const qWords = q.split(/\s+/).filter(w => w.length >= 2)
  const tWords = t.split(/\s+/)
  if (qWords.length === 0) return 1

  let totalScore = 0
  for (const qw of qWords) {
    let bestWord = 0
    for (const tw of tWords) {
      if (tw.includes(qw)) { bestWord = 60; break }
      if (qw.length >= 3 && tw.startsWith(qw)) { bestWord = Math.max(bestWord, 55); continue }
      const d = levenshtein(qw, tw)
      if (d <= 1 && qw.length >= 3) bestWord = Math.max(bestWord, 40)
      else if (d <= 2 && qw.length >= 5) bestWord = Math.max(bestWord, 20)
    }
    // Aussi tester contre le target entier (ex: "bolo" dans "bolognaise")
    if (bestWord < 60 && t.includes(qw)) bestWord = Math.max(bestWord, 50)
    totalScore += bestWord
  }

  return totalScore / qWords.length
}

/**
 * Filtre + trie une liste par pertinence fuzzy.
 * Retourne uniquement les éléments avec un score suffisant.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  minScore = 15,
): (T & { _fuzzyScore: number })[] {
  if (!query.trim()) return items.map(item => ({ ...item, _fuzzyScore: 1 }))
  return items
    .map(item => ({ ...item, _fuzzyScore: fuzzyScore(query, getText(item)) }))
    .filter(item => item._fuzzyScore >= minScore)
    .sort((a, b) => b._fuzzyScore - a._fuzzyScore)
}

/**
 * Nombre de personnes pour lequel les quantités des recettes sont écrites.
 * Sert de base au calcul des portions : une recette affichée pour 4 personnes
 * voit ses quantités multipliées par 4 / BASE_PORTIONS.
 */
export const BASE_PORTIONS = 2

/**
 * Met une quantité à l'échelle d'un nombre de convives.
 * "200g" pour 4 personnes → "400 g". Une quantité sans nombre (« un peu de
 * sel ») est renvoyée telle quelle.
 *
 * `base` est le nombre de convives auquel la recette est écrite. Il valait
 * toujours BASE_PORTIONS : une recette maison saisie pour 4 était donc doublée
 * quand le foyer cuisinait pour 4. Les recettes qui le déclarent passent
 * désormais leur propre valeur.
 *
 * Cette fonction était dupliquée dans RecipeDetailSheet et MealActionsSheet,
 * avec deux conventions incompatibles (multiplicateur d'un côté, nombre de
 * personnes de l'autre) : la même recette affichait donc des quantités
 * différentes selon l'écran par lequel on l'ouvrait.
 */
export function scaleQty(qty: string, people: number, base: number = BASE_PORTIONS): string {
  const factor = people / (base > 0 ? base : BASE_PORTIONS)
  if (!qty || factor === 1) return qty
  const m = qty.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
  if (!m) return qty
  const num = parseFloat(m[1].replace(',', '.'))
  const unit = m[2].trim()
  const scaled = Math.round(num * factor * 10) / 10
  return unit ? `${scaled} ${unit}` : `${scaled}`
}

/**
 * Redimensionne + compresse une image (File) en base64 JPEG.
 * 640px / q0.62 vise ~40 Ko : les photos partent dans la sous-collection
 * `photos` (un document Firestore par photo, plafonné à 1 Mio).
 */
export function resizeToBase64(file: File, maxW = 640, quality = 0.62): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
