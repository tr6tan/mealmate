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
        <span className="text-[42px] leading-none flex-shrink-0">{meal.emoji}</span>
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
            <span className="text-xl">📖</span>
            <span className="flex-1">Voir la recette</span>
            <span className="text-muted">›</span>
          </button>
        )}
        {!meal.isRestaurant && (
          <button
            onClick={handleChange}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-sep rounded-2xl text-sm font-bold text-text1 text-left"
          >
            <span className="text-xl">🔄</span>
            <span className="flex-1">Changer de repas</span>
            <span className="text-muted">›</span>
          </button>
        )}
        <button
          onClick={handleMove}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-sep rounded-2xl text-sm font-bold text-text1 text-left"
        >
          <span className="text-xl">📅</span>
          <span className="flex-1">Déplacer vers un autre jour</span>
          <span className="text-muted">›</span>
        </button>
      </div>

      <button
        onClick={handleRemove}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-[#FDE8F0] rounded-2xl text-sm font-extrabold text-[#C0304A]"
      >
        <span>🗑️</span>
        Retirer du planning
      </button>
    </BottomSheet>
  )
}
