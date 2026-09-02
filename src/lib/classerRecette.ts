import type { DietaryTag, Ingredient, Period } from '@/types'

/**
 * Devine le moment du repas et le régime d'une recette.
 *
 * Ces deux champs se remplissaient à la main alors que la recette les dit
 * déja : un porridge est un petit-déjeuner, une recette sans viande ni
 * poisson est végétarienne. On les propose donc, et la personne garde la main
 * : dès qu'elle touche au champ, la devinette se tait.
 */

const RE_PDEJ =
  /petit.?dej|porridge|granola|muesli|tartine|pancake|crepe|gaufre|smoothie|brioche|croissant|cereale|yaourt|fromage blanc|oeufs? brouilles?|overnight oats|brunch|pain perdu/i

const RE_SOIR =
  /soupe|potage|veloute|gratin|tartiflette|raclette|fondue|pot.?au.?feu|blanquette|bourguignon|osso|carbonade|daube|navarin|quiche|tourte|croque/i

/** Chair animale : sa présence exclut le végétarien. */
const RE_VIANDE =
  /poulet|boeuf|porc|veau|agneau|dinde|canard|jambon|lardon|bacon|saucisse|steak|escalope|viande|merguez|chorizo|salami|poisson|saumon|thon|cabillaud|crevette|gambas|moule|crabe|anchois|sardine|bar\b|maquereau|colin|lieu|sole|truite|calamar|poulpe|coquille|vongole|nuggets|magret|rillette|pate\b|charcuterie|gelatine|surimi|fruits? de mer/i

/** Produits animaux sans mise a mort : leur présence exclut le végétalien. */
const RE_ANIMAL =
  /lait|creme|beurre|fromage|yaourt|oeuf|miel|mozzarella|parmesan|gruyere|emmental|feta|ricotta|mascarpone|chevre|comte|cheddar|reblochon|raclette|mimolette|brie|camembert|bleu\b|roquefort|skyr|kefir|ghee|lactose|caseine/i

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Moment du repas déduit du nom.
 *
 * Le déjeuner est la valeur par défaut : c'est le moment le plus fréquent, et
 * se tromper vers midi coûte un geste, pas une recette mal rangée.
 */
export function devinerPeriode(nom: string): Period {
  const n = normaliser(nom)
  if (RE_PDEJ.test(n)) return 'pdej'
  if (RE_SOIR.test(n)) return 'soir'
  return 'midi'
}

/**
 * Régimes déduits des ingrédients.
 *
 * Seuls le végétarien et le végétalien sont proposés, et jamais le sans-gluten
 * ni le sans-lactose. La différence n'est pas technique mais de conséquence :
 * ces deux-la se suivent souvent pour raison médicale, et on ne peut pas les
 * affirmer depuis une liste en texte libre. Le gluten se cache dans la sauce
 * soja, le bouillon cube et la levure chimique ; ne pas lire « farine » ne
 * prouve rien. Se tromper sur le végétarien contrarie, se tromper sur le
 * gluten envoie quelqu'un à l'hôpital.
 *
 * Le végétarien, lui, se déduit d'un signal positif : la présence de chair
 * animale. Rien n'est affirmé sans ingrédients non plus, une recette vide
 * n'étant pas végane mais inconnue.
 */
export function devinerRegimes(ingredients: Ingredient[], nom = ''): DietaryTag[] {
  const utiles = ingredients.filter((i) => i.name.trim())
  if (utiles.length < 2) return []

  const texte = normaliser([nom, ...utiles.map((i) => i.name)].join(' '))
  const tags: DietaryTag[] = []

  const viande = RE_VIANDE.test(texte)
  const animal = RE_ANIMAL.test(texte)

  if (!viande) tags.push('vegetarien')
  if (!viande && !animal) tags.push('vegan')

  return tags
}
