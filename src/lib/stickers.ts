/**
 * Mapping nom de plat / mot-clé FR → slug de sticker Icons8 (food).
 * Les fichiers PNG sont dans /public/icons/stickers/{slug}.png (cf. scripts/icons8-food-stickers-slugs.json).
 *
 * Utilisation : `getStickerSlug("Pâtes carbonara")` → "spaghetti".
 * On matche les mots-clés dans l'ordre du tableau (premier hit gagne), on lowercase + on retire les accents.
 */

// Slugs disponibles (générés depuis l'API Icons8). À synchroniser si on retélécharge le set.
const AVAILABLE = new Set([
  'food','street-food','food-bar','poolside-bar','lunch','dinner','melting-ice-cream','meal','food-donor','no-food','take-away-food','food-cart','fish-food','dog-bowl','pizza-five-eighths','plastic-food-container','halal-food','french-fries','non-lactose-food','salami-pizza','coconut-milk','mcdonalds-french-fries','cola','leaf','organic-food','hot-chocolate-with-marshmallows','food-industry','vegan-food','pizza','bitten-apple','greek-salad','ceshew','parsley','lentil','refreshments','banana-split','white-beans','grains-of-rice','no-meat','kawaii-taco','chili-pepper','healthy-food','bay-leaf','goji','kawaii-noodle','milk-carton','gingerbread-house','korean-rice-cake','kawaii-steak','vegetables-bag','salmon-sushi','butter','artichoke','cutted-melon','cutted-watermelon','kawaii-cupcake','mango','bento','chinese-noodle','bread-loaf','peanuts','hazelnut','sausage','pancake','cinnamon-roll','soy','potato','slice-of-watermelon','squash','wheat','hops','thyme','spinach','samosa','biscuits','vegetarian-food','avocado','berry-7','restaurant-building','cotton-candy','no-fish','soy-sauce','rolled-oats','toaster-oven','egg-basket','lime','blueberry','cucumber','beet','restaurant','restaurant--v2','pelmen','tangelo','kawaii-egg','toaster','corn','apple','apple--v2','noodles','asparagus','bread','salt','radish','jelly','onion','steak','sushi','garlic','bread-and-rolling-pin','dim-sum','weber','takeaway-hot-drink','sashimi','cauliflower','nutshell','apricot','hamper','lunchbox','pastel-de-nata','paleo-diet','broccoli','paprika','fry','orange','grass','eggplant','halloween-candy','restaurant-menu','burger-dip','soup-plate','jamon','ice-cream-bowl','rice-bowl','prawn','sack-of-flour','cherry','chocolate-bar','whole-fish','steak-rare','grocery-shelf','salami','mint','vending-machine','restaurant-pickup','diabetic-food','hot-dog','deliver-food','hamburger','fried-chicken','cookies','milk-bottle','natural-food','food-and-wine','kawaii-french-fries','grocery-bag','fast-food-drive-thru','hello-fresh','cream-cheese-bagel','cooker','tin-can','tapas','stall','blue-apron','porridge','no-sugar','watermelon','gingerbread-man','citrus-1','tiffin','almond','energy-drink','halal-sign','melon','cutlery','cook-female','market-square','naan','kawaii-pizza','kawaii-sushi','wedding-cake','kawaii-croissant','kawaii-broccoli','kawaii-jam','fiber','quesadilla','celery','green-tea','soda-water','orange-soda','thanksgiving','kawaii-ice-cream','miso-soup','tomato','picnic-table','banana','pear','waiter','cookie','taco','pie','spaghetti','haram-food','ingredients','plum','no-milk','paella','wrap','healthy-eating','jam','whole-melon','kiwi','christmas-candy','raspberry','mulled-wine','mixer','kitchenwares','sugar-cube','half-orange','salad',
])

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Règles ordonnées : la première qui matche un mot du nom (en substring sur le nom normalisé) gagne.
 * Pour une vraie spécificité, mettre les plats composés AVANT les ingrédients génériques.
 */
const RULES: Array<[RegExp, string]> = [
  // Plats composés / signature
  [/\bpizza\b/, 'pizza'],
  [/\bsushi/, 'sushi'],
  [/sashimi/, 'sashimi'],
  [/ramen/, 'noodles'],
  [/nouilles|nouille|noodle/, 'noodles'],
  [/pad ?thai/, 'noodles'],
  [/spaghetti|bolognaise|carbonara|vongole/, 'spaghetti'],
  [/lasagne/, 'spaghetti'],
  [/gnocchi/, 'spaghetti'],
  [/cannelloni/, 'spaghetti'],
  [/pates? pesto|pesto/, 'spaghetti'],
  [/\bpates?\b/, 'spaghetti'],
  [/risotto/, 'rice-bowl'],
  [/bibimbap|poke|donburi|bento/, 'bento'],
  [/paella/, 'paella'],
  [/tajine|couscous/, 'tiffin'],
  [/curry|tikka|masala|dahl|dhal/, 'rice-bowl'],
  [/burger|hamburger/, 'hamburger'],
  [/hot ?dog/, 'hot-dog'],
  [/tacos?/, 'taco'],
  [/fajitas?/, 'wrap'],
  [/quesadilla/, 'quesadilla'],
  [/wrap/, 'wrap'],
  [/croque/, 'cream-cheese-bagel'],
  [/sandwich/, 'cream-cheese-bagel'],
  [/bruschetta|tartine/, 'bread'],
  [/baguette|pain perdu|brioche/, 'bread'],
  [/quiche|tarte (flambee|flamb)/, 'pie'],
  [/tarte/, 'pie'],
  [/pancake|crepe|gaufre/, 'pancake'],
  [/galette/, 'pancake'],
  [/omelette|oeufs?|egg|shakshuka/, 'kawaii-egg'],
  [/frites? ?\(?mcdo|mcdonald/, 'mcdonalds-french-fries'],
  [/frites?|fish ?& ?chips/, 'french-fries'],
  [/steak|entrecote|boeuf bourguignon|bourguignon/, 'steak'],
  [/roti de boeuf|rosbif/, 'steak-rare'],
  [/roti de porc|porc/, 'steak-rare'],
  [/poulet|chicken|cordon bleu|nuggets|escalope|coq/, 'fried-chicken'],
  [/saucisse|merguez|hot dog/, 'sausage'],
  [/jambon|jamon/, 'jamon'],
  [/saumon|salmon/, 'salmon-sushi'],
  [/crevette|prawn|gambas/, 'prawn'],
  [/bar |daurade|cabillaud|poisson|fish/, 'whole-fish'],
  [/soupe|soup|veloute|miso/, 'soup-plate'],
  [/salade|salad|tabou?le|nicoise|cesar/, 'salad'],
  [/buddha bowl|bowl/, 'rice-bowl'],
  [/dim ?sum|gyoza|raviolis chinois|pelmen/, 'dim-sum'],
  [/samosa/, 'samosa'],
  [/naan/, 'naan'],
  [/raclette|fondue|tartiflette|gratin dauphinois|rosti/, 'cooker'],
  [/gratin|hachis|parmentier|moussaka|parmigiana/, 'cooker'],
  [/wok|sautee?|stir/, 'chinese-noodle'],
  [/blanquette|pot.?au.?feu|carbonade|osso|boulettes?/, 'soup-plate'],
  [/chili|haricot|bean/, 'white-beans'],
  [/lentille|lentil|dahl/, 'lentil'],
  [/courgette|zucchini/, 'eggplant'],
  [/aubergine|eggplant/, 'eggplant'],
  [/tomate farcie|tomates? farcies?/, 'tomato'],
  [/chou.?fleur|cauliflower/, 'cauliflower'],
  [/brocoli|broccoli/, 'broccoli'],
  [/asperge|asparagus/, 'asparagus'],
  [/epinard|spinach/, 'spinach'],
  [/legume|vegetable/, 'vegetables-bag'],
  // Petits-déj / desserts
  [/porridge|overnight oats|avoine/, 'porridge'],
  [/granola|cereale|cereal/, 'rolled-oats'],
  [/yaourt|yogurt|fromage blanc/, 'milk-carton'],
  [/smoothie|jus|juice/, 'energy-drink'],
  [/cookies?/, 'cookies'],
  [/biscuit|sable/, 'biscuits'],
  [/clafoutis|cake|gateau|brownie/, 'pie'],
  [/glace|ice cream/, 'kawaii-ice-cream'],
  [/cupcake|muffin/, 'kawaii-cupcake'],
  [/croissant|viennoiserie|chocolatine/, 'kawaii-croissant'],
  [/banane|banana/, 'banana'],
  [/pomme|apple/, 'apple'],
  [/avocat|avocado/, 'avocado'],
  [/brunch/, 'pancake'],
  [/restaurant/, 'dinner'],
  // Catch-all ingrédients courants
  [/riz|rice/, 'rice-bowl'],
  [/pates|pasta/, 'spaghetti'],
]

/** Renvoie le slug du sticker correspondant au nom, ou null si aucun match. */
export function getStickerSlug(name: string): string | null {
  if (!name) return null
  const n = normalize(name)
  for (const [pattern, slug] of RULES) {
    if (pattern.test(n) && AVAILABLE.has(slug)) return slug
  }
  return null
}

export function stickerUrl(slug: string): string {
  return `/icons/stickers/${slug}.png`
}
