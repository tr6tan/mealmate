import type { ShoppingCategory } from '@/types'

/**
 * Devine le rayon d'un ingrédient à partir de son nom.
 *
 * Le formulaire demandait de choisir la catégorie à la main pour chaque
 * ingrédient : cinq boutons à viser sous chaque ligne, alors que le nom la
 * donne presque toujours. Elle est désormais proposée dès la saisie du nom, et
 * reste modifiable, c'est une proposition, pas une décision.
 *
 * Extrait de `parseRecipe`, supprimé avec le mode « coller un texte ».
 */
export function devinerCategorie(nom: string): ShoppingCategory {
  /*
   * NFD ne décompose pas les ligatures : « Œufs » restait « œufs » et
   * n'était donc pas reconnu par le motif « oeuf », ce qui l'envoyait en
   * épicerie au lieu de la crémerie. Même piège pour « Bœuf ».
   */
  const n = nom
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (/poulet|boeuf|porc|veau|agneau|dinde|canard|jambon|lardon|bacon|saucisse|steak|escalope|viande|merguez|chorizo|salami|poisson|saumon|thon|cabillaud|crevette|gambas|moule|crabe|anchois|sardine/.test(n)) return 'viandes'
  if (/lait|creme|beurre|fromage|yaourt|oeuf|mozzarella|parmesan|gruyere|emmental|feta|ricotta|mascarpone|chevre|comte|cheddar/.test(n)) return 'cremerie'
  if (/surgele|congele|glace\b/.test(n)) return 'surgeles'
  if (/lessive|savon|eponge|papier|sopalin|poubelle|vaisselle|nettoyant|dentifrice/.test(n)) return 'maison'
  if (/tomate|carotte|oignon|ail\b|salade|laitue|courgette|aubergine|poivron|champignon|epinard|brocoli|chou|poireau|celeri|concombre|radis|navet|patate|pomme de terre|haricot|petit pois|mais|potiron|courge|echalote|persil|basilic|coriandre|menthe|citron|pomme|banane|orange|fraise|framboise|mangue|ananas|raisin|peche|poire|kiwi|melon|avocat|olive|blette|bette\b|endive|fenouil|artichaut|asperge|betterave|panais|topinambour|cresson|roquette|mache|poivron|courge|butternut|rutabaga|chou-fleur|petits pois|feve/.test(n)) return 'legumes'
  return 'epicerie'
}
