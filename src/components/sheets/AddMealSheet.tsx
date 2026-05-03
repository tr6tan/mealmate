import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Recipe } from '@/types'
import { DAY_LONG, haptic, fuzzyScore, getMondayByOffset, getWeekKey } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

type TabMode = 'recette' | 'resto' | 'libre'

const SLOT_LABEL: Record<string, string> = {
  pdej: 'Petit-déjeuner',
  midi: 'Déjeuner', midi_entree: 'Déjeuner', midi_dessert: 'Déjeuner',
  soir: 'Dîner', soir_entree: 'Dîner', soir_dessert: 'Dîner',
}

function LeafIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 9 9" fill="none">
      <path d="M4.125 7.5C3.467 7.502 2.831 7.256 2.346 6.812C1.86 6.368 1.559 5.757 1.502 5.101C1.445 4.445 1.637 3.791 2.04 3.27C2.442 2.749 3.026 2.398 3.675 2.288C5.813 1.875 6.375 1.68 7.125 0.75C7.5 1.5 7.875 2.318 7.875 3.75C7.875 5.813 6.083 7.5 4.125 7.5Z" stroke="#00C950" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M0.75 7.875C0.75 6.75 1.444 5.865 2.655 5.625C3.563 5.445 4.5 4.875 4.875 4.5" stroke="#00C950" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function RecipeRow({ recipe, onSelect, onDetail }: { recipe: Recipe; onSelect: (r: Recipe) => void; onDetail: () => void }) {
  const isVege = recipe.tags?.some(t => t === 'vegetarien' || t === 'vegan')
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(recipe)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(recipe)}
      className="w-full flex items-center gap-3 px-1 py-2.5 rounded-2xl text-left transition-colors active:bg-black/[0.04] cursor-pointer"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[20px] leading-none"
        style={{ background: '#0018A8' }}
      >
        {recipe.emoji || '🍽'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text1 truncate">{recipe.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {recipe.time && <span className="text-[12px] text-neutral-400">{recipe.time}</span>}
          {isVege && <LeafIcon />}
          {recipe.rapide && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: '#FEF3C7', color: '#92400E' }}>⚡</span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDetail() }}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
        style={{ background: 'rgba(0,201,80,0.12)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C950" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
    </div>
  )
}

const TABS: { key: TabMode; label: string; icon: ReactNode }[] = [
  { key: 'recette', label: 'Recette', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M8.5 14.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5"/>
    </svg>
  )},
  { key: 'resto', label: 'Resto', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  )},
  { key: 'libre', label: 'Libre', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  )},
]

export default function AddMealSheet() {
  const sheetState  = useAppStore((s) => s.sheetState)
  const recipes     = useAppStore((s) => s.recipes)
  const setMeal     = useAppStore((s) => s.setMeal)
  const closeSheet  = useAppStore((s) => s.closeSheet)
  const weekPlans   = useAppStore((s) => s.weekPlans)
  const weekOffset  = useAppStore((s) => s.weekOffset)
  const openSheet   = useAppStore((s) => s.openSheet)

  const isOpen = sheetState.sheet === 'add-meal'

  const [tab,         setTab]         = useState<TabMode>('recette')
  const [freeName,    setFreeName]    = useState('')
  const [restoName,   setRestoName]   = useState('')
  const [search,      setSearch]      = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const updateSearch = (val: string) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 200)
  }

  useEffect(() => {
    if (isOpen) {
      setTab('recette')
      setSearch('')
      setDebouncedSearch('')
      setFreeName('')
      setRestoName('')
    }
  }, [isOpen])

  const context   = sheetState.mealContext
  const dayLabel  = context ? DAY_LONG[context.dayIdx] : ''
  const slotLabel = context ? (SLOT_LABEL[context.slotKey] ?? 'Repas') : ''

  // Noms des repas déjà planifiés cette semaine → suggestions = non utilisés
  const weekKey   = useMemo(() => getWeekKey(getMondayByOffset(weekOffset)), [weekOffset])
  const usedNames = useMemo(() => {
    const names = new Set<string>()
    const plan  = weekPlans[weekKey]
    if (!plan) return names
    for (let d = 0; d < 7; d++) {
      const day = plan[d]
      if (!day) continue
      ;[day.pdej, day.midi, day.midi_entree, day.midi_dessert, day.soir, day.soir_entree, day.soir_dessert]
        .forEach(m => { if (m?.name) names.add(m.name) })
    }
    return names
  }, [weekPlans, weekKey])

  const filtered = useMemo(() => {
    const base = recipes.map(r => ({
      ...r,
      _fuzzy: fuzzyScore(debouncedSearch, r.name),
    })).filter(r => r._fuzzy >= (debouncedSearch ? 15 : 1))

    return base.sort((a, b) => {
      if (debouncedSearch) return b._fuzzy - a._fuzzy
      const sA = (a.fav ? 2 : 0) + (a.rapide ? 1 : 0)
      const sB = (b.fav ? 2 : 0) + (b.rapide ? 1 : 0)
      return sB - sA
    })
  }, [recipes, debouncedSearch])

  const suggestions = useMemo(
    () => filtered.filter(r => !usedNames.has(r.name)).slice(0, 5),
    [filtered, usedNames]
  )

  const handleSelect = (recipe: Recipe) => {
    if (!context) return
    haptic(10)
    setMeal(context.dayIdx, context.slotKey, {
      name: recipe.name, emoji: recipe.emoji, time: recipe.time, fav: recipe.fav, photo: recipe.photo,
    })
    closeSheet()
    showToast(`${recipe.name} ajouté !`)
  }

  const handleFree = () => {
    if (!context || !freeName.trim()) return
    haptic(10)
    setMeal(context.dayIdx, context.slotKey, { name: freeName.trim(), emoji: '', time: '?', fav: false })
    closeSheet()
    setFreeName('')
    showToast('Repas ajouté !')
  }

  const handleResto = () => {
    if (!context || !restoName.trim()) return
    haptic(10)
    setMeal(context.dayIdx, context.slotKey, { name: restoName.trim(), emoji: '🍴', time: '?', fav: false, isRestaurant: true })
    closeSheet()
    setRestoName('')
    showToast('Restaurant ajouté !')
  }

  return (
    <BottomSheet name="add-meal" noScroll>

      {/* ── Header figé ── */}
      <div className="flex-shrink-0 pb-1">
        <h2 className="text-[22px] font-black text-text1 mb-0.5">Que mangez-vous ?</h2>
        {dayLabel && (
          <p className="text-[13px] text-neutral-400 font-medium mb-4">{dayLabel} — {slotLabel}</p>
        )}

        {/* 3 onglets */}
        <div className="flex gap-2 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.97]"
              style={
                tab === t.key
                  ? { background: '#0018A8', color: '#fff', boxShadow: '0 4px 14px rgba(0,24,168,0.28)' }
                  : { background: 'rgba(0,0,0,0.05)', color: '#9ca3af' }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Barre de recherche — onglet Recette seulement */}
        {tab === 'recette' && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl mb-1" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="search" inputMode="search" placeholder="Chercher une recette…"
              value={search} onChange={(e) => updateSearch(e.target.value)}
              autoComplete="on" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} enterKeyHint="search"
              className="flex-1 bg-transparent outline-none text-[14px] font-medium text-text1 placeholder:text-neutral-400"
            />
            {search && (
              <button onClick={() => updateSearch('')} className="active:scale-90 transition-transform">
                <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Onglet Recette : liste scrollable ── */}
      {tab === 'recette' && (
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar" style={{ touchAction: 'pan-y' }}>

          {/* Section Suggestions */}
          {!debouncedSearch && suggestions.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-1 py-2">
                <svg className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                <p className="text-[11px] text-neutral-400 font-semibold">Suggestions (pas encore mangé cette semaine)</p>
              </div>
              {suggestions.map(recipe => (
                <RecipeRow key={recipe.id} recipe={recipe} onSelect={handleSelect}
                  onDetail={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })} />
              ))}
              <div className="px-1 pt-3 pb-1.5">
                <p className="text-[11px] text-neutral-400 font-semibold">Toutes les recettes</p>
              </div>
            </>
          )}

          {/* Toutes les recettes */}
          <div className="pb-6">
            {filtered.map(recipe => (
              <RecipeRow key={recipe.id} recipe={recipe} onSelect={handleSelect}
                onDetail={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-neutral-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm font-semibold">Aucune recette trouvée</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Onglet Resto ── */}
      {tab === 'resto' && (
        <div className="flex-1 flex flex-col gap-3 pt-2">
          <input
            type="text" inputMode="text" placeholder="Nom du restaurant…"
            value={restoName} onChange={(e) => setRestoName(e.target.value)}
            autoComplete="on" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} enterKeyHint="done"
            className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium text-text1 outline-none placeholder:text-neutral-400"
            style={{ background: 'rgba(0,0,0,0.05)' }}
          />
          <button onClick={handleResto} disabled={!restoName.trim()} className="btn-primary w-full" style={!restoName.trim() ? { opacity: 0.4 } : {}}>
            Ajouter ce restaurant
          </button>
        </div>
      )}

      {/* ── Onglet Libre ── */}
      {tab === 'libre' && (
        <div className="flex-1 flex flex-col gap-3 pt-2">
          <input
            type="text" inputMode="text" placeholder="Nom du repas…"
            value={freeName} onChange={(e) => setFreeName(e.target.value)}
            autoComplete="on" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} enterKeyHint="done"
            className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-medium text-text1 outline-none placeholder:text-neutral-400"
            style={{ background: 'rgba(0,0,0,0.05)' }}
          />
          <button onClick={handleFree} disabled={!freeName.trim()} className="btn-primary w-full" style={!freeName.trim() ? { opacity: 0.4 } : {}}>
            Ajouter ce repas
          </button>
        </div>
      )}

    </BottomSheet>
  )
}
