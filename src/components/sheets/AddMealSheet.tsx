import { useState, useEffect, useMemo } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, Recipe } from '@/types'
import { cn, PERIOD_LABEL, haptic } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

type MealTab = Period

const TABS: { key: MealTab; label: string }[] = [
  { key: 'pdej', label: 'Petit-dej' },
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

  // Reset à chaque ouverture du sheet
  useEffect(() => {
    if (isOpen) {
      setActiveTab(sheetState.addMealPeriod ?? 'midi')
      setSearch('')
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
      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const periodA = a.period === activeTab ? 1 : 0
        const periodB = b.period === activeTab ? 1 : 0
        const sA = periodA * 10 + (planCounts[a.id] ?? 0) * 2 + (a.fav ? 1 : 0)
        const sB = periodB * 10 + (planCounts[b.id] ?? 0) * 2 + (b.fav ? 1 : 0)
        return sB - sA
      })
  , [recipes, activeTab, search, planCounts])

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
            className="bg-terra-light text-terra text-xs font-extrabold px-2.5 py-1.5 rounded-[10px] border-2 border-dashed border-terra/40 flex items-center gap-1"
          >
            {showFreeForm
              ? <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg> Suggestions</>
              : <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Libre</>}
          </button>
        </div>

        {/* Formulaire libre */}
        {showFreeForm && (
          <div className="mb-3.5 bg-terra-light rounded-2xl p-3 border-2 border-dashed border-terra">
            <div className="flex gap-2 mb-2">
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
                className="flex-1 px-3 py-2 rounded-xl bg-white/60 text-sm font-semibold text-text1 border-none outline-none placeholder:text-muted"
              />
            </div>
            <button
              onClick={handleFree}
              className="w-full py-2.5 bg-terra text-white rounded-xl text-sm font-extrabold"
            >
              Ajouter ce repas
            </button>
          </div>
        )}

        {/* Recherche + Onglets (figés) */}
        {!showFreeForm && (
          <>
            <div className="flex items-center gap-2 px-3 py-2.5 mb-2.5 rounded-xl bg-sep border-[1.5px] border-border">
              <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Chercher une recette…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="flex-1 bg-transparent outline-none text-[13px] font-semibold text-text1 placeholder:text-muted"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted flex items-center">
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
                    'flex-1 py-1.5 text-center text-[11px] font-extrabold rounded-2xl transition-all duration-200',
                    activeTab === t.key
                      ? 'bg-white text-terra shadow-[0_1px_6px_rgba(0,0,0,0.10)]'
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
        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
          <div className="space-y-0.5 pb-4">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[13px] text-left hover:bg-sep active:bg-sep transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-sep flex items-center justify-center flex-shrink-0">
                  {recipe.emoji
                    ? <span className="text-xl leading-none">{recipe.emoji}</span>
                    : <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v4M8 11v6M12 3v10M12 17v4M16 3v4M16 11v6" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-text1 truncate">{recipe.name}</p>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-muted font-semibold">{recipe.time}</span>
                    {recipe.period !== activeTab && (
                      <span className="text-[10px] font-bold text-muted bg-sep px-1.5 py-0.5 rounded-[6px]">
                        {PERIOD_LABEL[recipe.period]}
                      </span>
                    )}
                    {recipe.fav && <svg className="w-3 h-3" style={{ color: '#E91E63' }} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                    {recipe.rapide && <span className="text-[11px] text-[#2E7D32] font-bold flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Rapide</span>}
                    {(planCounts[recipe.id] ?? 0) > 0 && (
                      <span className="text-[10px] font-extrabold text-terra bg-terra-light px-1.5 py-0.5 rounded-[6px]">
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
