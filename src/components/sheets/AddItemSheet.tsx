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

// ─── Dictionnaire de reconnaissance automatique ───────────────────────────────
const KEYWORDS: Record<ShoppingCategory, string[]> = {
  legumes: [
    'carotte','tomate','salade','courgette','brocoli','champignon','poivron',
    'oignon','ail','pomme de terre','concombre','haricot','épinard','epinard',
    'radis','fenouil','artichaut','asperge','patate','poireau','navet','betterave',
    'chou','endive','laitue','maïs','mais','céleri','celeri','persil','basilic',
    'coriandre','menthe','thym','romarin','avocat','pomme','poire','banane',
    'orange','citron','fraise','framboise','raisin','cerise','mangue','ananas',
    'melon','pastèque','pasteque','peche','pêche','abricot','kiwi','figue','prune',
    'myrtille','grenade','noix','noisette','amande','pistache','légume','legume',
    'fruit','herbe','saison',
  ],
  viandes: [
    'poulet','bœuf','boeuf','porc','agneau','dinde','canard','lapin','veau',
    'saumon','thon','cabillaud','crevette','bar','dorade','sardine','maquereau',
    'truite','moule','coquille','saint-jacques','calamars','jambon','lardons',
    'lardon','saucisse','saucisson','merguez','chipolata','steak','filet','côte',
    'cote','escalope','gigot','côtelette','cotelette','boudin','pâté','pate',
    'rillette','blanc de poulet','aiguillette','viande','poisson','fruits de mer',
    'charcuterie','bacon','chorizo',
  ],
  cremerie: [
    'lait','yaourt','yogurt','fromage','beurre','crème','creme','oeuf','œuf','oeufs',
    'mozzarella','camembert','brie','comté','comte','gruyère','gruyere','parmesan',
    'ricotta','feta','gouda','edam','emmental','roquefort','coulommiers',
    'fromage blanc','cottage','kéfir','kefir','crème fraîche','creme fraiche',
    'mascarpone','crème épaisse','lait ribot','soja','avoine','amande','végétal',
    'vegetal','dessert',
  ],
  epicerie: [
    'farine','sucre','sel','pâtes','pasta','riz','huile','vinaigre','sauce','ketchup',
    'mayonnaise','moutarde','cornichon','conserve','boîte','boite','café','cafe',
    'thé','the','chocolat','confiture','miel','sirop','céréales','cereales',
    'müsli','muesli','granola','pain','biscuit','gâteau','gateau','chips','crackers',
    'eau','jus','soda','bière','biere','vin','champagne','bouillon','cube',
    'levure','maïzena','maizena','amidon','lentille','pois','pois chiche',
    'haricot sec','flageolet','quinoa','boulgour','couscous','semoule','pizza',
    'surgelé','surgele','épice','epice','curry','cumin','paprika','cannelle',
    'vanille','poivre','noix de muscade','origan','huile d\'olive','huile de tournesol',
    'vinaigre balsamique','sauce tomate','coulis','tomate pelée','tomate pelee',
    'soupe','bouillon','compote','jus d\'orange','limonade','cacao','nutella',
  ],
  maison: [
    'savon','shampooing','shampoing','gel douche','gel','lessive','adoucissant',
    'éponge','eponge','papier','essuie-tout','sopalin','sac','sac poubelle',
    'nettoyant','liquide vaisselle','produit','désodorisant','deodorant','déodorant',
    'dentifrice','brosse','rasoir','coton','serviette','mouchoir','kleenex',
    'papier toilette','pq','protège-slip','tampon','soin','crème hydratante',
    'lotion','démaquillant','demaquillant','mascara','rouge à lèvres','parfum',
    'pansement','doliprane','ibuprofène','ibuprofen','paracétamol','paracetamol',
    'vitamine','aspirine','lingette','aluminium','film étirable','film alimentaire',
    'bougie','allumette','pile','ampoule','éco-responsable','recharge',
  ],
}

function guessCategory(input: string): ShoppingCategory | null {
  const normalized = input.toLowerCase().trim()
  if (!normalized) return null
  for (const [cat, words] of Object.entries(KEYWORDS) as [ShoppingCategory, string[]][]) {
    if (words.some(w => normalized.includes(w) || w.includes(normalized) && normalized.length >= 3)) {
      return cat
    }
  }
  return null
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
