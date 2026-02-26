import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

const CATEGORIES: { id: ShoppingCategory; icon: string }[] = [
  { id: 'legumes',  icon: '🥦' },
  { id: 'viandes',  icon: '🥩' },
  { id: 'cremerie', icon: '🧀' },
  { id: 'epicerie', icon: '🛒' },
  { id: 'maison',   icon: '🧴' },
]

// ─── Moteur de reconnaissance ─────────────────────────────────────────────────

/**
 * Dictionnaire de mots-clés par catégorie.
 * Le stemming + score gèrent pluriels, accents et fautes de frappe —
 * pas besoin de lister toutes les variantes.
 */
const KEYWORDS: Record<ShoppingCategory, string[]> = {
  legumes: [
    'carotte','tomate','salade','courgette','brocoli','champignon','poivron',
    'oignon','ail','pomme de terre','concombre','haricot','epinard','radis',
    'fenouil','artichaut','asperge','patate','poireau','navet','betterave',
    'chou','endive','laitue','mais','celeri','persil','basilic','coriandre',
    'menthe','thym','romarin','avocat','pomme','poire','banane','orange',
    'citron','fraise','framboise','raisin','cerise','mangue','ananas','melon',
    'pasteque','peche','abricot','kiwi','figue','prune','myrtille','grenade',
    'noix','noisette','amande','pistache','legume','fruit','herbe',
  ],
  viandes: [
    'poulet','boeuf','porc','agneau','dinde','canard','lapin','veau','saumon',
    'thon','cabillaud','crevette','bar','dorade','sardine','maquereau','truite',
    'moule','coquille','calmar','jambon','lardon','saucisse','saucisson',
    'merguez','chipolata','steak','filet','cote','escalope','gigot','boudin',
    'pate','rillette','aiguillette','viande','poisson','charcuterie','bacon',
    'chorizo','andouille','foie','roti',
  ],
  cremerie: [
    'lait','yaourt','fromage','beurre','creme','oeuf','mozzarella','camembert',
    'brie','comte','gruyere','parmesan','ricotta','feta','gouda','edam',
    'emmental','roquefort','coulommier','cottage','kefir','mascarpone',
    'creme fraiche','dessert lacte','creme dessert',
  ],
  epicerie: [
    'farine','sucre','sel','pate','riz','huile','vinaigre','sauce','ketchup',
    'mayonnaise','moutarde','cornichon','conserve','cafe','the','chocolat',
    'confiture','miel','sirop','cereale','muesli','granola','pain','biscuit',
    'gateau','chips','crackers','eau','jus','soda','biere','vin','champagne',
    'bouillon','cube','levure','maizena','lentille','pois','quinoa','boulgour',
    'couscous','semoule','pizza','surgele','epice','curry','cumin','paprika',
    'cannelle','vanille','poivre','muscade','origan','coulis','compote','cacao',
    'fecule','amidon','flag','soja','tofu',
  ],
  maison: [
    'savon','shampoing','gel douche','lessive','adoucissant','eponge','sopalin',
    'sac poubelle','nettoyant','liquide vaisselle','deodorant','dentifrice',
    'brosse','rasoir','coton','mouchoir','papier toilette','lotion','demaquillant',
    'mascara','parfum','pansement','doliprane','ibuprofene','paracetamol',
    'vitamine','aspirine','lingette','aluminium','film alimentaire','bougie',
    'pile','ampoule','essuie',
  ],
}


/** Retire les accents et met en minuscules */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/** Stemming léger français : retire pluriels / suffixes courants */
function stem(w: string): string {
  return w
    .replace(/eaux$/, 'eau').replace(/ieux$/, 'ieu').replace(/aux$/, 'al')
    .replace(/ettes?$/, 'et').replace(/ettes?$/, 'ette')
    .replace(/ons$/, 'on').replace(/ées?$/, 'ee').replace(/ies?$/, 'ie')
    .replace(/es$/, 'e').replace(/s$/, '')
}

/** Distance de Levenshtein (pour tolérer les fautes de frappe) */
function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[a.length][b.length]
}

/** Score d'un mot input contre un mot du dictionnaire */
function scoreWord(input: string, keyword: string): number {
  const ni = normalize(input), nk = normalize(keyword)
  const si = stem(ni),        sk = stem(nk)
  if (ni === nk)              return 12   // exact
  if (si === sk)              return 10   // même racine
  if (nk.startsWith(ni) && ni.length >= 3) return 8  // préfixe
  if (nk.includes(ni) && ni.length >= 4)  return 6  // sous-chaîne
  if (ni.includes(nk) && nk.length >= 4)  return 5  // inverse
  const d = lev(si, sk)
  if (d === 1 && si.length >= 4) return 4  // 1 faute
  if (d === 2 && si.length >= 6) return 2  // 2 fautes
  return 0
}

/** Retourne la catégorie la plus probable ou null si confiance insuffisante */
function guessCategory(input: string): ShoppingCategory | null {
  const tokens = normalize(input).split(/[\s,]+/).filter(t => t.length >= 2)
  if (tokens.length === 0) return null

  const scores: Record<ShoppingCategory, number> = {
    legumes: 0, viandes: 0, cremerie: 0, epicerie: 0, maison: 0,
  }

  for (const [cat, words] of Object.entries(KEYWORDS) as [ShoppingCategory, string[]][]) {
    for (const token of tokens) {
      let best = 0
      for (const kw of words) {
        const s = scoreWord(token, kw)
        if (s > best) best = s
        if (best >= 12) break   // exact → pas la peine de continuer
      }
      scores[cat] += best
    }
  }

  const [topCat, topScore] = (Object.entries(scores) as [ShoppingCategory, number][])
    .reduce((a, b) => b[1] > a[1] ? b : a)

  return topScore >= 4 ? topCat : null
}


export default function AddItemSheet() {
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [category, setCategory] = useState<ShoppingCategory>('epicerie')
  const [autoDetected, setAutoDetected] = useState(false)

  const handleAdd = () => {
    if (!name.trim()) return
    addShoppingItem({ name: name.trim(), qty: qty.trim(), category, checked: false })
    setName('')
    setQty('')
    setAutoDetected(false)
    closeSheet()
    showToast(`${name.trim()} ajouté !`)
  }

  const handleNameChange = (v: string) => {
    setName(v)
    const detected = guessCategory(v)
    if (detected) {
      setCategory(detected)
      setAutoDetected(true)
    } else {
      setAutoDetected(false)
    }
  }

  return (
    <BottomSheet name="add-item">
      <h2 className="text-[17px] font-extrabold text-text1 mb-4">Ajouter un article</h2>

      <div className="space-y-2.5 mb-4">
        <input
          type="text"
          placeholder="Nom de l'article…"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
        />
        <input
          type="text"
          placeholder="Quantité (ex : 500g, 2 pièces…)"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted">Catégorie</p>
        {autoDetected && (
          <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
            ✦ Détectée auto
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setAutoDetected(false) }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200',
              category === cat.id
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {cat.icon} {CAT_LABELS[cat.id].split(' ')[0]}
          </button>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-3.5 bg-terra text-white rounded-2xl text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
      >
        Ajouter à la liste
      </button>
    </BottomSheet>
  )
}
