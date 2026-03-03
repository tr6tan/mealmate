import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { PERIOD_LONG, haptic } from '@/lib/utils'
import type { Period, SlotKey } from '@/types'
import { showToast } from '@/components/ui/Toast'

function periodFromSlot(slotKey: SlotKey): Period {
  if (slotKey.startsWith('pdej')) return 'pdej'
  if (slotKey.startsWith('midi')) return 'midi'
  return 'soir'
}

export default function MealActionsSheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const setMeal = useAppStore((s) => s.setMeal)
  const openSheet = useAppStore((s) => s.openSheet)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const recipes = useAppStore((s) => s.recipes)

  const ctx = sheetState.actionContext
  if (!ctx) return <BottomSheet name="meal-actions"><div /></BottomSheet>

  const { dayIdx, slotKey, meal } = ctx
  const period = periodFromSlot(slotKey)
  const recipe = recipes.find((r) => r.name === meal.name)

  const handleRemove = () => {
    haptic([10, 30, 10])
    const snapshot = meal
    setMeal(dayIdx, slotKey, null)
    closeSheet()
    showToast('Repas retiré', {
      action: {
        label: 'Annuler',
        onClick: () => setMeal(dayIdx, slotKey, snapshot),
      },
    })
  }

  const handleChange = () => {
    openSheet({
      sheet: 'add-meal',
      addMealPeriod: period,
      mealContext: { dayIdx, slotKey },
    })
  }

  const handleDetail = () => {
    if (recipe) openSheet({ sheet: 'recipe-detail', recipeContext: recipe })
  }

  const handleMove = () => {
    openSheet({
      sheet: 'pick-day',
      pickDayContext: {
        recipe: {
          id: '',
          name: meal.name,
          emoji: meal.emoji,
          time: meal.time,
          fav: meal.fav,
          period,
          rapide: false,
        },
        moveFrom: { dayIdx, slotKey },
      },
    })
  }

  return (
    <BottomSheet name="meal-actions">
      {/* En-tête repas */}
      <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-sep">
        <div className="w-10 h-10 rounded-xl bg-sep flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v4M8 11v6M12 3v10M12 17v4M16 3v4M16 11v6" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold text-text1 truncate">{meal.name}</p>
          <p className="text-xs text-muted font-semibold mt-0.5">{PERIOD_LONG[period]}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 mb-3">
        {!meal.isRestaurant && recipe && (
          <button
            onClick={handleDetail}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-sep rounded-2xl text-sm font-bold text-text1 text-left"
          >
            <svg className="w-5 h-5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span className="flex-1">Voir la recette</span>
            <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
        {!meal.isRestaurant && (
          <button
            onClick={handleChange}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-sep rounded-2xl text-sm font-bold text-text1 text-left"
          >
            <svg className="w-5 h-5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            <span className="flex-1">Changer de repas</span>
            <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
        <button
          onClick={handleMove}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-sep rounded-2xl text-sm font-bold text-text1 text-left"
        >
          <svg className="w-5 h-5 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span className="flex-1">Déplacer vers un autre jour</span>
          <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <button
        onClick={handleRemove}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-[#FDE8F0] rounded-2xl text-sm font-extrabold text-[#C0304A]"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        Retirer du planning
      </button>
    </BottomSheet>
  )
}
