import { useState, useEffect, useMemo } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS, ingredientEmoji } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

// ─── Catalogue d'articles ────────────────────────────────────────────────────

type CatalogItem = { name: string; category: ShoppingCategory }
type CatalogSection = { id: string; label: string; items: CatalogItem[] }

const mk =
  (cat: ShoppingCategory) =>
  (items: string[]): CatalogItem[] =>
    items.map((name) => ({ name, category: cat }))

const l = mk('legumes')
const v = mk('viandes')
const c = mk('cremerie')
const e = mk('epicerie')
const s = mk('surgeles')
const m = mk('maison')

const CATALOG: CatalogSection[] = [
  {
    id: 'legumes', label: 'Légumes', items: l([
      'Tomate', 'Tomate cerise', 'Carotte', 'Concombre',
      'Salade', 'Épinards', 'Brocoli', 'Chou-fleur',
      'Poivron rouge', 'Poivron vert', 'Oignon', 'Échalote',
      'Poireau', 'Ail', 'Champignon', 'Maïs',
      'Pomme de terre', 'Patate douce', 'Aubergine', 'Courgette',
      'Avocat', 'Haricots verts', 'Petits pois', 'Potiron',
      'Radis', 'Asperge',
    ]),
  },
  {
    id: 'fruits', label: 'Fruits', items: l([
      'Pomme', 'Poire', 'Banane', 'Citron',
      'Orange', 'Fraise', 'Framboise', 'Mangue',
      'Ananas', 'Raisin', 'Pêche', 'Cerise',
      'Kiwi', 'Melon',
    ]),
  },
  {
    id: 'viandes', label: 'Viandes & Poissons', items: v([
      'Poulet', 'Boeuf haché', 'Saumon', 'Jambon',
      'Lardons', 'Crevettes', 'Thon', 'Escalope',
      'Steak', 'Dinde', 'Saucisses', 'Cabillaud',
    ]),
  },
  {
    id: 'cremerie', label: 'Crèmerie', items: c([
      'Lait', 'Yaourt', 'Fromage', 'Beurre',
      'Creme fraiche', 'Oeufs', 'Mozzarella', 'Parmesan',
      'Gruyere', 'Feta',
    ]),
  },
  {
    id: 'epicerie', label: 'Épicerie', items: e([
      'Pates', 'Riz', 'Farine', 'Sucre',
      'Sel', "Huile d'olive", 'Sauce tomate', 'Bouillon',
      'Pain', 'Cafe', 'Chocolat', 'Confiture',
      'Miel', 'Chips',
    ]),
  },
  {
    id: 'surgeles', label: 'Surgelés', items: s([
      'Epinards surgelés', 'Petits pois surgelés', 'Pizza surgelée',
      'Frites surgelées', 'Glace', 'Nuggets', 'Poisson pané',
    ]),
  },
  {
    id: 'maison', label: 'Maison', items: m([
      'Savon', 'Lessive', 'Liquide vaisselle',
      'Papier toilette', 'Sac poubelle', 'Eponge',
      'Sopalin', 'Dentifrice',
    ]),
  },
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
    'rillette','terrine','mousse','aiguillette','viande','poisson','charcuterie',
    'bacon','chorizo','andouille','foie','roti','pate de campagne','pate de foie',
  ],
  cremerie: [
    'lait','yaourt','fromage','beurre','creme','oeuf','mozzarella','camembert',
    'brie','comte','gruyere','parmesan','ricotta','feta','gouda','edam',
    'emmental','roquefort','coulommier','cottage','kefir','mascarpone',
    'creme fraiche','dessert lacte','creme dessert',
  ],
  epicerie: [
    'farine','sucre','sel','pate','pasta','spaghetti','penne','tagliatelle',
    'fusilli','rigatoni','macaroni','riz','huile','vinaigre','sauce','ketchup',
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
  surgeles: [
    'surgele','glace','epinard surgele','pizza surgelee','cordon bleu',
    'poisson pane','frite','legumes surgeles','sorbet','bac','nugget',
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
    legumes: 0, viandes: 0, cremerie: 0, epicerie: 0, surgeles: 0, maison: 0,
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
  const sheetState = useAppStore((s) => s.sheetState)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Map<string, CatalogItem>>(new Map())

  const isOpen = sheetState.sheet === 'add-item'
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelected(new Map())
    }
  }, [isOpen])

  const toggleItem = (item: CatalogItem) => {
    setSelected(prev => {
      const next = new Map(prev)
      next.has(item.name) ? next.delete(item.name) : next.set(item.name, item)
      return next
    })
  }

  const filteredSections = useMemo(() => {
    if (!search.trim()) return CATALOG
    const q = search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return CATALOG
      .map(sec => ({
        ...sec,
        items: sec.items.filter(it =>
          it.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
        ),
      }))
      .filter(sec => sec.items.length > 0)
  }, [search])

  const hasResults = filteredSections.length > 0
  const customCategory: ShoppingCategory = useMemo(() => guessCategory(search.trim()) ?? 'epicerie', [search])

  const handleAdd = () => {
    if (selected.size === 0) return
    for (const item of selected.values()) {
      addShoppingItem({ name: item.name, qty: '', category: item.category, checked: false })
    }
    const n = selected.size
    closeSheet()
    showToast(`${n} article${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} !`)
  }

  const handleAddCustom = () => {
    if (!search.trim()) return
    addShoppingItem({ name: search.trim(), qty: '', category: customCategory, checked: false })
    closeSheet()
    showToast(`${search.trim()} ajouté !`)
  }

  return (
    <BottomSheet name="add-item" noScroll className="!px-0 !pt-0">
      {/* Header fixe */}
      <div className="shrink-0 px-5 pt-1 pb-3">
        <h2 className="text-[20px] font-extrabold text-text1 mb-3">Ajouter à la liste</h2>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: '#9CA3AF' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck={true}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-[15px] font-medium text-text1 outline-none placeholder:text-muted"
            style={{ background: '#EBEBEB' }}
          />
        </div>
      </div>

      {/* Catalogue scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-5">
        {filteredSections.map(section => (
          <div key={section.id} className="mb-6">
            <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase mb-3"
              style={{ color: '#6B7280' }}>
              {section.label}
            </p>

            <div className="grid grid-cols-4 gap-x-2 gap-y-5">
              {section.items.map(item => {
                const sel = selected.has(item.name)
                return (
                  <button
                    key={item.name}
                    onClick={() => toggleItem(item)}
                    className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <div className="relative">
                      <div
                        className="w-[58px] h-[58px] rounded-full flex items-center justify-center select-none"
                        style={{ background: sel ? '#001DC1' : '#F0F0F0' }}
                      >
                        <span className="text-[26px] leading-none">
                          {ingredientEmoji(item.name)}
                        </span>
                      </div>
                      {sel && (
                        <div
                          className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                          style={{ background: '#22C55E', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"
                            strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-center leading-tight w-full"
                      style={{ color: '#374151' }}>
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Fallback article personnalisé */}
        {search.trim() && !hasResults && (
          <button
            onClick={handleAddCustom}
            className="w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: 'rgba(0,24,168,0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{ background: '#0018A8' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-text1">Ajouter «&nbsp;{search.trim()}&nbsp;»</p>
              <p className="text-[11px] text-muted">{CAT_LABELS[customCategory]}</p>
            </div>
          </button>
        )}

        {/* Espace de respiration en bas */}
        <div className="h-4" />
      </div>

      {/* Footer : bouton d'ajout (visible seulement si sélection) */}
      {selected.size > 0 && (
        <div
          className="shrink-0 px-5 pt-3 border-t border-black/[0.06]"
          style={{ paddingBottom: '16px' }}
        >
          <button
            onClick={handleAdd}
            className="w-full py-3.5 rounded-2xl text-sm font-extrabold transition-all active:scale-[0.97]"
            style={{ background: '#0018A8', color: '#fff', boxShadow: '0 6px 20px rgba(0,24,168,0.3)' }}
          >
            Ajouter {selected.size} article{selected.size > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
