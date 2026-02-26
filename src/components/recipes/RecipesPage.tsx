import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Period } from '@/types'
import { cn } from '@/lib/utils'
import RecipeCard from './RecipeCard'

type FilterKey = 'all' | Period | 'fav' | 'rapide'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',    label: 'Tout' },
  { key: 'pdej',  label: 'Petit-dej' },
  { key: 'midi',  label: 'Midi' },
  { key: 'soir',  label: 'Soir' },
  { key: 'fav',   label: '♥ Favoris' },
  { key: 'rapide',label: '⚡ Rapide' },
]

export default function RecipesPage() {
  const recipes   = useAppStore((s) => s.recipes)
  const weekPlans = useAppStore((s) => s.weekPlans)
  const openSheet = useAppStore((s) => s.openSheet)

  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<FilterKey>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favFirst, setFavFirst] = useState(false)

  // Compte de planification par recipe.id (toutes semaines confondues)
  const planCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const weekPlan of Object.values(weekPlans)) {
      for (let day = 0; day < 7; day++) {
        const plan = weekPlan[day]
        if (!plan) continue
        const slots = [plan.pdej, plan.midi, plan.midi_entree, plan.midi_dessert, plan.soir, plan.soir_entree, plan.soir_dessert]
        slots.forEach((meal) => {
          if (!meal) return
          const r = recipes.find((rc) => rc.name === meal.name)
          if (r) counts[r.id] = (counts[r.id] ?? 0) + 1
        })
      }
    }
    return counts
  }, [weekPlans, recipes])

  const filtered = useMemo(() => {
    let list = recipes.filter((r) => {
      const matchFilter =
        filter === 'all' ||
        filter === r.period ||
        (filter === 'fav' && r.fav) ||
        (filter === 'rapide' && r.rapide)
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
    if (favFirst) list = [...list.filter((r) => r.fav), ...list.filter((r) => !r.fav)]
    return list
  }, [recipes, filter, search, favFirst])

  const counts = useMemo<Record<string, number>>(() => ({
    all: recipes.length,
    pdej: recipes.filter((r) => r.period === 'pdej').length,
    midi: recipes.filter((r) => r.period === 'midi').length,
    soir: recipes.filter((r) => r.period === 'soir').length,
    fav: recipes.filter((r) => r.fav).length,
    rapide: recipes.filter((r) => r.rapide).length,
  }), [recipes])

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-text1">Recettes</h1>
          <p className="text-[13px] text-muted font-semibold mt-0.5">
            {filtered.length} recette{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle favs en premier */}
          <button
            onClick={() => setFavFirst((v) => !v)}
            title="Favoris en premier"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-base transition-all active:scale-90',
              favFirst ? 'bg-[#FDE8F0] text-[#E91E63]' : 'bg-card border-[1.5px] border-border text-muted',
            )}
          >
            ♥
          </button>
          {/* Toggle vue */}
          <button
            onClick={() => setViewMode((v) => v === 'grid' ? 'list' : 'grid')}
            title={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
            className="w-9 h-9 rounded-full bg-card border-[1.5px] border-border text-muted flex items-center justify-center text-base transition-all active:scale-90"
          >
            {viewMode === 'grid' ? '☰' : '⊞'}
          </button>
          <button
            onClick={() => openSheet({ sheet: 'new-recipe' })}
            className="w-10 h-10 rounded-full bg-terra text-white flex items-center justify-center text-xl font-bold shadow-terra-sm active:scale-95 transition-transform"
            aria-label="Nouvelle recette"
          >
            +
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mx-5 mb-3.5 bg-card rounded-2xl px-3.5 py-3 flex items-center gap-2.5 border-[1.5px] border-border">
        <svg className="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Chercher une recette…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-[Nunito] text-sm font-semibold text-text1 placeholder:text-muted"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-muted text-sm">✕</button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200 whitespace-nowrap flex items-center gap-1',
              filter === f.key
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {f.label}
            {(counts[f.key] ?? 0) > 0 && (
              <span className={cn('text-[10px] font-extrabold', filter === f.key ? 'opacity-70' : 'opacity-45')}>
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {recipes.length === 0 ? (
        /* Empty state global */
        <div className="px-5 pt-4 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-terra-light flex items-center justify-center text-4xl">🍳</div>
          <div>
            <p className="text-base font-extrabold text-text1 mb-1">Aucune recette</p>
            <p className="text-[13px] text-muted font-semibold">Ajoute ta première recette pour commencer à planifier tes repas.</p>
          </div>
          <button
            onClick={() => openSheet({ sheet: 'new-recipe' })}
            className="w-full bg-terra text-white rounded-2xl py-3.5 text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
          >
            + Créer ma première recette
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* No results */
        <div className="px-5 pt-6 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">&#x1F50D;</span>
          <p className="text-sm font-extrabold text-text1">Aucune recette trouvée</p>
          <p className="text-[12px] text-muted font-semibold">Essaie un autre mot-clé ou filtre.</p>
          <button
            onClick={() => { setSearch(''); setFilter('all') }}
            className="px-4 py-2 rounded-full bg-terra-light text-terra text-xs font-extrabold active:scale-95 transition-transform"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Vue grille */
        <div className="grid grid-cols-2 gap-3 px-5">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              view="grid"
              planCount={planCounts[recipe.id] ?? 0}
              onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
            />
          ))}
          <button
            onClick={() => openSheet({ sheet: 'new-recipe' })}
            className="bg-terra-light border-2 border-dashed border-terra rounded-2xl flex flex-col items-center justify-center gap-2 min-h-[170px] active:scale-[0.96] transition-transform"
          >
            <svg className="w-7 h-7 text-terra" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="text-[11px] font-extrabold text-terra">Nouvelle recette</span>
          </button>
        </div>
      ) : (
        /* Vue liste */
        <div className="px-5 flex flex-col gap-2">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              view="list"
              planCount={planCounts[recipe.id] ?? 0}
              onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
            />
          ))}
          <button
            onClick={() => openSheet({ sheet: 'new-recipe' })}
            className="flex items-center gap-3.5 px-4 py-3.5 bg-terra-light border-2 border-dashed border-terra rounded-2xl active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-terra flex items-center justify-center text-white text-xl font-bold flex-shrink-0">+</div>
            <span className="text-sm font-extrabold text-terra">Nouvelle recette</span>
          </button>
        </div>
      )}
    </div>
  )
}
