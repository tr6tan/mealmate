/**
 * Mapping nom de plat / mot-clé FR → slug de sticker Icons8 (food).
 * Les fichiers PNG sont dans /public/icons/stickers/{slug}.png (cf. scripts/icons8-food-stickers-slugs.json).
 *
 * Utilisation : `getStickerSlug("Pâtes carbonara")` → "spaghetti".
 * On matche les mots-clés dans l'ordre du tableau (premier hit gagne), on lowercase + on retire les accents.
 */

// Slugs disponibles (générés depuis l'API Icons8). À synchroniser si on retélécharge le set.
const AVAILABLE = new Set([
  'food','street-food','food-bar','poolside-bar','lunch','dinner','melting-ice-cream','meal','food-donor','no-food','take-away-food','food-cart','fish-food','dog-bowl','pizza-five-eighths','plastic-food-container','halal-food','french-fries','non-lactose-food','salami-pizza','coconut-milk','mcdonalds-french-fries','cola','leaf','organic-food','hot-chocolate-with-marshmallows','food-industry','vegan-food','pizza','bitten-apple','greek-salad','ceshew','parsley','lentil','refreshments','banana-split','white-beans','grains-of-rice','no-meat','kawaii-taco','chili-pepper','healthy-food','bay-leaf','goji','kawaii-noodle','milk-carton','gingerbread-house','korean-rice-cake','kawaii-steak','vegetables-bag','salmon-sushi','butter','artichoke','cutted-melon','cutted-watermelon','kawaii-cupcake','mango','bento','chinese-noodle','bread-loaf','peanuts','hazelnut','sausage','pancake','cinnamon-roll','soy','potato','slice-of-watermelon','squash','wheat','hops','thyme','spinach','samosa','biscuits','vegetarian-food','avocado','berry-7','restaurant-building','cotton-candy','no-fish','soy-sauce','rolled-oats','toaster-oven','egg-basket','lime','blueberry','cucumber','beet','restaurant','restaurant--v2','pelmen','tangelo','kawaii-egg','toaster','corn','apple','apple--v2','noodles','asparagus','bread','salt','radish','jelly','onion','steak','sushi','garlic','bread-and-rolling-pin','dim-sum','weber','takeaway-hot-drink','sashimi','cauliflower','nutshell','apricot','hamper','lunchbox','pastel-de-nata','paleo-diet','broccoli','paprika','fry','orange','grass','eggplant','halloween-candy','restaurant-menu','burger-dip','soup-plate','jamon','ice-cream-bowl','rice-bowl','prawn','sack-of-flour','cherry','chocolate-bar','whole-fish','steak-rare','grocery-shelf','salami','mint','vending-machine','restaurant-pickup','diabetic-food','hot-dog','deliver-food','hamburger','fried-chicken','cookies','milk-bottle','natural-food','food-and-wine','kawaii-french-fries','grocery-bag','fast-food-drive-thru','hello-fresh','cream-cheese-bagel','cooker','tin-can','tapas','stall','blue-apron','porridge','no-sugar','watermelon','gingerbread-man','citrus-1','tiffin','almond','energy-drink','halal-sign','melon','cutlery','cook-female','market-square','naan','kawaii-pizza','kawaii-sushi','wedding-cake','kawaii-croissant','kawaii-broccoli','jam','fiber','quesadilla','celery','green-tea','soda-water','orange-soda','thanksgiving','kawaii-ice-cream','miso-soup','tomato','picnic-table','banana','pear','waiter','cookie','taco','pie','spaghetti','haram-food','ingredients','plum','no-milk','paella','wrap','healthy-eating','jam','whole-melon','kiwi','christmas-candy','raspberry','mulled-wine','mixer','kitchenwares','sugar-cube','half-orange','salad',
  // Nouveaux stickers téléchargés
  'carrot','leek','pineapple','peach','cheese','mushroom','lettuce','coffee','croissant','olive','grapes','beer','cabbage','macaron','sandwich','kebab','olive-oil','guacamole','milk','peas','coconut',
  'duck','yogurt','bacon','sweet-potato','crab',
])

function normalize(s: string): string {
  return s
    .toLowerCase()
    // Les ligatures ne se décomposent pas en NFD : « bœuf » restait tel quel
    // et échappait à la règle du bœuf pour tomber sur celle des œufs.
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Règles ordonnées : la première qui matche un mot du nom (en substring sur le nom normalisé) gagne.
 * Pour une vraie spécificité, mettre les plats composés AVANT les ingrédients génériques.
 */
const RULES: Array<[RegExp, string]> = [
  // ── Désambiguïsations ─────────────────────────────────────────────────
  // « pâte » (à tarte, de miso, de curry) n'a rien à voir avec « pâtes » :
  // ces règles doivent passer avant la règle des pâtes.
  [/pate a pizza/, 'pizza'],
  [/pate (brisee|feuilletee|sablee|sucree|a tarte)/, 'pie'],
  [/pate (de )?miso|\bmiso\b/, 'miso-soup'],
  [/pate (de )?curry/, 'chili-pepper'],

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
  [/poke\b/, 'rice-bowl'],
  [/bibimbap|donburi|bento/, 'bento'],
  [/paella/, 'paella'],
  [/semoule/, 'wheat'],
  [/tajine|couscous/, 'tiffin'],
  [/curry|tikka|masala|dahl|dhal/, 'rice-bowl'],
  [/burger|hamburger/, 'hamburger'],
  [/hot ?dog/, 'hot-dog'],
  [/tacos?/, 'taco'],
  [/fajitas?/, 'wrap'],
  [/quesadilla/, 'quesadilla'],
  [/wrap/, 'wrap'],
  [/croque/, 'sandwich'],
  [/sandwich/, 'sandwich'],
  [/tartines? avocat|toast avocat|avocat toast/, 'avocado'],
  [/bruschetta|tartine/, 'bread'],
  [/baguette|pain perdu|brioche/, 'bread'],
  [/quiche|tarte (flambee|flamb)/, 'pie'],
  [/tarte/, 'pie'],
  [/pancake|crepe|gaufre/, 'pancake'],
  [/galette/, 'pancake'],
  [/boeuf hache|viande hachee|hachis|steak hache/, 'steak-rare'],
  [/roti de boeuf|rosbif|paleron|\bboeuf\b|bourguignon/, 'steak'],
  [/omelette|shakshuka|\boeufs?\b|\beggs?\b/, 'egg-basket'],
  [/frites? ?\(?mcdo|mcdonald/, 'mcdonalds-french-fries'],
  [/frites?|fish ?& ?chips/, 'french-fries'],
  [/steak frites?/, 'steak-rare'],
  [/steak|entrecote|boeuf bourguignon|bourguignon|boeuf/, 'steak'],
  [/roti de boeuf|rosbif/, 'steak-rare'],
  [/\bbacon\b/, 'bacon'],
  [/chorizo|lardons/, 'salami'],
  [/roti de porc|porc\b/, 'steak-rare'],
  [/canard|duck|magret/, 'duck'],
  [/escalope|schnitzel|milanaise/, 'steak-rare'],
  [/teriyaki|yakitori/, 'bento'],
  [/poulet|chicken|cordon bleu|nuggets|coq|dinde|volaille/, 'fried-chicken'],
  [/saucisse|merguez|chipolata/, 'sausage'],
  [/jambon|jamon/, 'jamon'],
  // saumon → whole-fish (pas de sticker saumon seul dans le style stickers)
  [/saumon|salmon/, 'whole-fish'],
  [/crevette|prawn|gambas|langoustine/, 'prawn'],
  [/\bcrabes?\b|crabe/, 'crab'],
  [/thon|cabillaud|dorade|daurade|maquereau|sardine|truite|morue|merlu|colin|bar\b/, 'whole-fish'],
  [/poisson|fish/, 'whole-fish'],
  [/potage|gazpacho|gaspacho|vichyssoise/, 'soup-plate'],
  [/soupe|soup|veloute|miso|bouillon/, 'soup-plate'],
  [/salade composee|salade grecque/, 'greek-salad'],
  [/salade|salad|tabou?le|nicoise|cesar/, 'salad'],
  [/yop|actimel|danette|yaourt a boire/, 'yogurt'],
  [/fromage blanc|faisselle/, 'yogurt'],
  [/reblochon|chevre|bleu\b|roquefort|raclette (fromage)?|tomme|munster|maroilles/, 'cheese'],
  [/buddha bowl|bowl/, 'rice-bowl'],
  [/dim ?sum|gyoza|raviolis chinois|pelmen/, 'dim-sum'],
  [/samosa/, 'samosa'],
  [/naan/, 'naan'],
  [/parmigiana|moussaka/, 'eggplant'],
  [/rosti|rösti|hash.?brown/, 'potato'],
  [/raclette|fondue|tartiflette|gratin dauphinois/, 'cooker'],
  [/gratin de courgettes?/, 'cucumber'],
  [/gratin de chou.?fleur/, 'cauliflower'],
  [/gratin|hachis|parmentier/, 'cooker'],
  [/wok|sautee?|stir/, 'chinese-noodle'],
  [/blanquette|pot.?au.?feu|carbonade|osso|boulettes?/, 'soup-plate'],
  [/chili/, 'chili-pepper'],
  [/haricot vert|haricot plat|petit pois|petits pois|edamame|feve|fèves?/, 'peas'],
  [/haricot|bean|flageolet|pois chiche/, 'white-beans'],
  [/lentille|lentil|dahl/, 'lentil'],
  [/courgette|zucchini/, 'cucumber'],
  [/aubergine|eggplant/, 'eggplant'],
  [/poivron/, 'paprika'],
  [/piment/, 'chili-pepper'],
  [/champignon|morille|girolle|cepe|chanterelle/, 'mushroom'],
  [/tomate farcie|tomates? farcies?/, 'tomato'],
  [/chou.?fleur|cauliflower/, 'cauliflower'],
  [/brocoli|broccoli/, 'broccoli'],
  [/asperge|asparagus/, 'asparagus'],
  [/epinard|spinach/, 'spinach'],
  [/celeri/, 'celery'],
  [/fenouil/, 'celery'],
  [/poireau/, 'leek'],
  [/\bnavet\b|panais/, 'radish'],
  [/chou rouge|chou vert|chou blanc|choucroute|chou/, 'cabbage'],
  [/laitue|salade verte|endive|scarole/, 'lettuce'],
  [/carotte/, 'carrot'],
  [/legume|vegetable/, 'vegetables-bag'],
  // Herbes & épices
  [/basilic|persil|coriandre/, 'parsley'],
  [/menthe|mint/, 'mint'],
  [/thym/, 'thyme'],
  [/laurier|herbes de provence|origan|romarin|aneth|estragon|sauge|bouquet garni|ciboulette/, 'bay-leaf'],
  [/paprika|piment d.espelette|curcuma|cumin|cannelle|muscade|ras el hanout|epices?|curry en poudre|4 epices/, 'paprika'],
  [/gingembre|ginger/, 'garlic'],
  [/wasabi/, 'chili-pepper'],
  [/nori|wakame|algues?/, 'grass'],
  [/mirin|vinaigre de riz/, 'soy-sauce'],
  [/dashi/, 'miso-soup'],
  // Petits-déj / desserts
  [/porridge|overnight oats|avoine/, 'porridge'],
  [/granola|cereale|cereal/, 'rolled-oats'],
  [/yaourt|yogurt|skyr|kefir/, 'yogurt'],
  [/smoothie bowl/, 'rice-bowl'],
  [/smoothie|jus|juice/, 'energy-drink'],
  [/cafe|café|espresso|cappuccino|latte|americano/, 'coffee'],
  [/chocolat chaud/, 'hot-chocolate-with-marshmallows'],
  [/the vert|thé vert/, 'green-tea'],
  [/\bthe\b|thé|tisane/, 'food'],
  [/\bbiere\b|\bbière\b|\bbeer\b/, 'beer'],
  [/vin\b|wine/, 'food-and-wine'],
  [/cookies?/, 'cookies'],
  [/biscuit|sable/, 'biscuits'],
  [/macaron/, 'macaron'],
  [/clafoutis|cake|gateau|brownie/, 'pie'],
  [/glace|ice cream|sorbet/, 'ice-cream-bowl'],
  [/cupcake|muffin/, 'kawaii-cupcake'],
  [/croissant|viennoiserie|chocolatine/, 'croissant'],
  [/cinnamon roll|pain cinnamon|pain cannelle/, 'cinnamon-roll'],
  // Fruits
  [/banane yaourt|yaourt banane|bowl banane/, 'yogurt'],
  [/banane|banana/, 'banana'],
  [/patates? douces?|sweet potato/, 'sweet-potato'],
  [/pommes? de terre|patates?\b|\brattes?\b/, 'potato'],
  [/pomme\b|apple/, 'apple'],
  [/avocat|avocado/, 'avocado'],
  [/fraise/, 'berry-7'],
  [/fruits? rouges?|fruits? des bois/, 'raspberry'],
  [/fruits? (frais|de saison)|salade de fruits/, 'apple'],
  [/myrtille|bleuet/, 'blueberry'],
  [/framboise/, 'raspberry'],
  [/tomates? cerises?/, 'tomato'],
  [/cerise/, 'cherry'],
  [/\bkiwi\b/, 'kiwi'],
  [/mangue/, 'mango'],
  [/pasteque|pastèque/, 'watermelon'],
  [/\bmelon\b/, 'melon'],
  [/abricot/, 'apricot'],
  [/\bpeche\b|pêche/, 'peach'],
  [/prune|pruneau/, 'plum'],
  [/\bpoire\b/, 'pear'],
  [/\borange\b|clémentine|clementine|mandarine/, 'orange'],
  [/citronnelle/, 'grass'],
  [/citron vert|lime/, 'lime'],
  [/citron/, 'citrus-1'],
  [/ananas|pineapple/, 'pineapple'],
  [/raisin|grape/, 'grapes'],
  [/figue/, 'plum'],
  [/noix de coco|coconut/, 'coconut'],
  // Légumes bruts
  [/\btomate/, 'tomato'],
  [/oignon|echalote/, 'onion'],
  [/\bail\b|gousse d.?ail/, 'garlic'],
  [/concombre/, 'cucumber'],
  [/radis/, 'radish'],
  [/betterave/, 'beet'],
  [/\bmaïs\b|\bmais\b/, 'corn'],
  [/artichaut/, 'artichoke'],
  [/courge|butternut|potiron|potimarron|citrouille/, 'squash'],
  // Crèmerie & épicerie
  [/fromage blanc|faisselle/, 'yogurt'],
  [/fromage|parmesan|mozzarella|gruyere|emmental|feta|brie|camembert|comté|cheddar|ricotta|mascarpone|gouda/, 'cheese'],
  [/beurre/, 'butter'],
  [/\blait\b/, 'milk'],
  [/creme fraiche|creme|crème/, 'milk-carton'],
  [/\boeufs?\b/, 'egg-basket'],
  [/bechamel|bechamel/, 'milk-carton'],
  [/huile/, 'olive-oil'],
  [/levure|bicarbonate/, 'sack-of-flour'],
  [/croutons?|chapelure|pain rassis/, 'bread'],
  [/tortillas?|galette de ble/, 'wrap'],
  [/cornichons?|pickles/, 'cucumber'],
  [/olives?\b/, 'olive'],
  [/anchois|sardines?|maquereau/, 'whole-fish'],
  [/graines? de (sesame|chia|courge|tournesol|lin)|pignons? de pin|graines?\b/, 'nutshell'],
  [/\bveau\b|jarret|escalope de veau|osso ?bucco/, 'steak-rare'],
  [/cordons? bleus?/, 'fried-chicken'],
  [/charcuterie|rosette|coppa|pancetta/, 'salami'],
  [/palourdes?|moules?|coques?|huitres?|saint.jacques?/, 'crab'],
  [/navets?|rutabaga/, 'beet'],
  [/\bsel\b|fleur de sel/, 'salt'],
  [/sucre|cassonade/, 'sugar-cube'],
  [/chocolat|cacao/, 'chocolate-bar'],
  [/farine|maizena|fecule/, 'sack-of-flour'],
  [/\bpain\b|baguette|toast|brioche|biscottes/, 'bread-loaf'],
  [/miel/, 'jam'],
  [/confiture|marmelade/, 'jam'],
  [/noisette/, 'hazelnut'],
  [/amande/, 'almond'],
  [/cajou|ceshew|cashew/, 'ceshew'],
  [/cacahuete|arachide|peanut/, 'peanuts'],
  [/pistache|noix|pecan/, 'nutshell'],
  [/huile d.?olive/, 'olive-oil'],
  [/olive\b/, 'olive'],
  [/huile/, 'food'],
  [/soja|tofu|tempeh/, 'soy'],
  [/riz saute|riz sauté|riz cantonais|riz cantonnais|fried rice/, 'rice-bowl'],
  [/\briz\b|\brice\b/, 'grains-of-rice'],
  [/quinoa|boulgour|couscous|semoule|polenta/, 'wheat'],
  [/pates|pasta/, 'spaghetti'],
  [/vinaigre|sauce soja|sauce|ketchup|mayo|moutarde/, 'soy-sauce'],
  [/guacamole/, 'guacamole'],
  [/kebab|shawarma/, 'kebab'],
  // Sandwichs & snacks
  [/sandwich|panini|sub|baguette garnie/, 'sandwich'],
  [/chips|crisps|popcorn|crackers/, 'french-fries'],
  // Surgelés / ménager
  [/surgele|surgelé/, 'plastic-food-container'],
  [/lessive|adoucissant/, 'hamper'],
  [/liquide vaisselle|eponge|nettoyant|savon/, 'kitchenwares'],
  [/sac poubelle/, 'plastic-food-container'],
  // Restaurant
  [/brunch/, 'pancake'],
  [/restaurant/, 'dinner'],
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
