import { useState, useEffect, useMemo, useRef } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, Recipe } from '@/types'
import { cn, PERIOD_LABEL, haptic } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import MealAvatar from '@/components/ui/MealAvatar'

type MealTab = Period

const TABS: { key: MealTab; label: string }[] = [
  { key: 'midi', label: 'Midi' },
  { key: 'soir', label: 'Soir' },
]

export default function AddMealSheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const recipes = useAppStore((s) => s.recipes)
  const setMeal = useAppStore((s) => s.setMeal)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const isOpen = sheetState.sheet === 'add-meal'
  const weekPlans = useAppStore((s) => s.weekPlans)
  const [activeTab, setActiveTab] = useState<MealTab>('midi')
  const [freeName, setFreeName] = useState('')
  const [freeEmoji, setFreeEmoji] = useState('')
  const [showFreeForm, setShowFreeForm] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const updateSearch = (val: string) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(val), 200)
  }

  // Reset à chaque ouverture du sheet
  useEffect(() => {
    if (isOpen) {
      setActiveTab(sheetState.addMealPeriod ?? 'midi')
      setSearch('')
      setDebouncedSearch('')
      setShowFreeForm(false)
      setFreeName('')
      setFreeEmoji('')
    }
  }, [isOpen, sheetState.addMealPeriod])

  const context = sheetState.mealContext

  // Comptage des planifications par recette
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

  // Tri : période correspondante en tête, puis popularité + favori
  const filtered = useMemo(() =>
    recipes
      .filter((r) => r.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .sort((a, b) => {
        const periodA = a.period === activeTab ? 1 : 0
        const periodB = b.period === activeTab ? 1 : 0
        const sA = periodA * 10 + (planCounts[a.id] ?? 0) * 2 + (a.fav ? 1 : 0)
        const sB = periodB * 10 + (planCounts[b.id] ?? 0) * 2 + (b.fav ? 1 : 0)
        return sB - sA
      })
  , [recipes, activeTab, debouncedSearch, planCounts])

  const handleSelect = (recipe: Recipe) => {
    if (!context) return
    haptic(10)
    setMeal(context.dayIdx, context.slotKey, {
      name: recipe.name,
      emoji: recipe.emoji,
      time: recipe.time,
      fav: recipe.fav,
      photo: recipe.photo,
    })
    closeSheet()
    showToast(`${recipe.name} ajouté !`)
  }

  const handleFree = () => {
    if (!context || !freeName.trim()) return
    haptic(10)
    setMeal(context.dayIdx, context.slotKey, {
      name: freeName.trim(),
      emoji: freeEmoji,
      time: '?',
      fav: false,
    })
    closeSheet()
    setFreeName('')
    setFreeEmoji('')
    setShowFreeForm(false)
    showToast('Repas ajouté !')
  }

  return (
    <BottomSheet name="add-meal" noScroll>

      {/* ── Header figé ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0">

        {/* Titre + bouton Libre/Suggestions */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-extrabold text-text1">Ajouter un repas</h2>
          <button
            onClick={() => setShowFreeForm((v) => !v)}
            className={cn(
              'text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95',
              showFreeForm
                ? 'bg-sep text-muted'
                : 'bg-terra-light text-terra',
            )}
          >
            {showFreeForm
              ? <>{'\u2190'} Suggestions</>
              : <>{'\u270F\uFE0F'} Libre</>}
          </button>
        </div>

        {/* Formulaire libre */}
        {showFreeForm && (
          <div className="mb-3.5 bg-terra-light/50 rounded-2xl p-3.5">
            <input
              type="text"
              placeholder="Nom du repas…"
              value={freeName}
              onChange={(e) => setFreeName(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              enterKeyHint="done"
              className="w-full px-3.5 py-2.5 rounded-xl bg-card text-sm font-semibold text-text1 border-[1.5px] border-border outline-none placeholder:text-muted mb-2.5"
            />
            <button
              onClick={handleFree}
              disabled={!freeName.trim()}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-extrabold transition-all active:scale-[0.97]',
                freeName.trim()
                  ? 'bg-terra text-white shadow-terra-sm'
                  : 'bg-sep text-muted cursor-not-allowed',
              )}
            >
              Ajouter ce repas
            </button>
          </div>
        )}

        {/* Recherche + Onglets (figés) */}
        {!showFreeForm && (
          <>
            <div className="flex items-center gap-2 px-3 py-2.5 mb-2.5 rounded-xl bg-bg border-[1.5px] border-border">
              <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Chercher une recette…"
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="flex-1 bg-transparent outline-none text-[13px] font-semibold text-text1 placeholder:text-muted"
              />
              {search && (
                <button onClick={() => updateSearch('')} className="text-muted flex items-center active:scale-90 transition-transform">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            <div className="flex bg-sep rounded-xl p-0.5 mb-3 gap-0.5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    'flex-1 py-1.5 text-center text-[11px] font-extrabold rounded-[10px] transition-all duration-200',
                    activeTab === t.key
                      ? 'bg-card text-terra shadow-sm'
                      : 'text-muted',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}

      </div>{/* /header figé */}

      {/* ── Liste scrollable ──────────────────────────────────────────────── */}
      {!showFreeForm && (
        <div
          className="flex-1 overflow-y-auto overscroll-contain no-scrollbar pb-safe"
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="space-y-0.5 pb-4">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left active:bg-terra-light/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-bg flex items-center justify-center flex-shrink-0">
                  {recipe.emoji
                    ? <span className="text-lg leading-none">{recipe.emoji}</span>
                    : <MealAvatar name={recipe.name} size="md" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-text1 truncate">{recipe.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted font-semibold">{recipe.time}</span>
                    {recipe.period !== activeTab && (
                      <span className="text-[10px] font-bold text-muted bg-sep px-1.5 py-0.5 rounded-md">
                        {PERIOD_LABEL[recipe.period]}
                      </span>
                    )}
                    {recipe.fav && <span className="text-xs leading-none">{'\u2764\uFE0F'}</span>}
                    {recipe.rapide && <span className="text-xs leading-none">{'\u26A1'}</span>}
                    {(planCounts[recipe.id] ?? 0) > 0 && (
                      <span className="text-[10px] font-extrabold text-terra bg-terra-light px-1.5 py-0.5 rounded-md">
                        {planCounts[recipe.id]}×
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </BottomSheet>
  )
}
