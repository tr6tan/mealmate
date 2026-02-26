import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Period } from '@/types'
import { PERIOD_LABEL, cn } from '@/lib/utils'
import RecipeCard from './RecipeCard'

type FilterKey = 'all' | Period | 'fav' | 'rapide'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',    label: 'Tout' },
  { key: 'pdej',  label: 'Petit-dej' },
  { key: 'midi',  label: 'Midi' },
  { key: 'soir',  label: 'Soir' },
  { key: 'fav',   label: 'Favoris' },
  { key: 'rapide',label: 'Rapide' },
]

export default function RecipesPage() {
  const recipes = useAppStore((s) => s.recipes)
  const openSheet = useAppStore((s) => s.openSheet)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchFilter =
        filter === 'all' ||
        filter === r.period ||
        (filter === 'fav' && r.fav) ||
        (filter === 'rapide' && r.rapide)
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [recipes, filter, search])

  const counts = useMemo<Record<string, number>>(() => ({
    all: recipes.length,
    pdej: recipes.filter((r) => r.period === 'pdej').length,
    midi: recipes.filter((r) => r.period === 'midi').length,
    soir: recipes.filter((r) => r.period === 'soir').length,
    fav: recipes.filter((r) => r.fav).length,
    rapide: recipes.filter((r) => r.rapide).length,
  }), [recipes])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-text1">Recettes</h1>
          <p className="text-[13px] text-muted font-semibold mt-0.5">
            {filtered.length} recette{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => openSheet({ sheet: 'new-recipe' })}
          className="w-10 h-10 rounded-full bg-terra text-white flex items-center justify-center text-xl font-bold shadow-terra-sm active:scale-95 transition-transform"
          aria-label="Nouvelle recette"
        >
          +
        </button>
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
      <div className="flex gap-2 px-5 pb-3.5 overflow-x-auto no-scrollbar">
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

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-6">
        {filtered.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
          />
        ))}
        {/* Add card */}
        <button
          onClick={() => openSheet({ sheet: 'new-recipe' })}
          className="bg-terra-light border-2 border-dashed border-terra rounded-xl flex flex-col items-center justify-center gap-2 min-h-[160px] active:scale-[0.96] transition-transform"
        >
          <svg className="w-7 h-7 text-terra" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="text-[11px] font-extrabold text-terra">Nouvelle recette</span>
        </button>
      </div>
    </div>
  )
}
