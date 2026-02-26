import { useState, useEffect } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, Recipe } from '@/types'
import { cn, PERIOD_LABEL } from '@/lib/utils'
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
  const [activeTab, setActiveTab] = useState<MealTab>('midi')
  const [freeName, setFreeName] = useState('')
  const [freeEmoji, setFreeEmoji] = useState('🍽️')
  const [showFreeForm, setShowFreeForm] = useState(false)
  const [search, setSearch] = useState('')

  // Reset à chaque ouverture du sheet
  useEffect(() => {
    if (isOpen) {
      setActiveTab(sheetState.addMealPeriod ?? 'midi')
      setSearch('')
      setShowFreeForm(false)
      setFreeName('')
      setFreeEmoji('🍽️')
    }
  }, [isOpen, sheetState.addMealPeriod])

  const context = sheetState.mealContext

  const handleSelect = (recipe: Recipe) => {
    if (!context) return
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
    setMeal(context.dayIdx, context.slotKey, {
      name: freeName.trim(),
      emoji: freeEmoji,
      time: '?',
      fav: false,
    })
    closeSheet()
    setFreeName('')
    setFreeEmoji('🍽️')
    setShowFreeForm(false)
    showToast('Repas ajouté !')
  }

  const filtered = recipes.filter(
    (r) =>
      r.period === activeTab &&
      r.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <BottomSheet name="add-meal">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-extrabold text-text1">Ajouter un repas</h2>
        <button
          onClick={() => setShowFreeForm((v) => !v)}
          className="bg-terra-light text-terra text-xs font-extrabold px-2.5 py-1.5 rounded-[10px] border-2 border-dashed border-terra/40"
        >
          {showFreeForm ? '← Suggestions' : '✏️ Libre'}
        </button>
      </div>

      {/* Formulaire libre */}
      {showFreeForm && (
        <div className="mb-3.5 bg-terra-light rounded-2xl p-3 border-2 border-dashed border-terra">
          <div className="flex gap-2 mb-2">
            <input
              value={freeEmoji}
              onChange={(e) => setFreeEmoji(e.target.value)}
              className="w-12 h-10 rounded-xl bg-white/60 text-center text-xl border-none outline-none"
            />
            <input
              type="text"
              placeholder="Nom du repas…"
              value={freeName}
              onChange={(e) => setFreeName(e.target.value)}
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

      {/* Tabs */}
      {!showFreeForm && (
        <>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 mb-2.5 rounded-xl bg-sep border-[1.5px] border-border">
            <svg className="w-3.5 h-3.5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Chercher une recette…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13px] font-semibold text-text1 placeholder:text-muted"
            />
            {search && <button onClick={() => setSearch('')} className="text-muted text-xs">✕</button>}
          </div>
          <div className="flex bg-sep rounded-xl p-0.5 mb-3.5 gap-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex-1 py-1.5 text-center text-[11px] font-extrabold rounded-[9px] transition-all duration-200',
                  activeTab === t.key
                    ? 'bg-white text-terra shadow-[0_1px_6px_rgba(0,0,0,0.10)]'
                    : 'text-muted',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Suggestions */}
          <div className="space-y-0.5">
            {filtered.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[13px] text-left hover:bg-sep active:bg-sep transition-colors"
              >
                <span className="text-[22px] flex-shrink-0">{recipe.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-text1 truncate">{recipe.name}</p>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-[11px] text-muted font-semibold">{recipe.time}</span>
                    {recipe.fav && <span className="text-[11px] text-[#E91E63]">♥</span>}
                    {recipe.rapide && <span className="text-[11px] text-[#2E7D32] font-bold">⚡ Rapide</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  )
}
