import BottomSheet from '@/components/ui/BottomSheet'
import MealAvatar from '@/components/ui/MealAvatar'
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

  const actions = [
    ...(!meal.isRestaurant && recipe
      ? [{
          label: 'Voir la recette',
          emoji: '\u{1F4D6}',
          onClick: handleDetail,
        }]
      : []),
    ...(!meal.isRestaurant
      ? [{
          label: 'Changer de repas',
          emoji: '\u{1F504}',
          onClick: handleChange,
        }]
      : []),
    {
      label: 'Déplacer vers un autre jour',
      emoji: '\u{1F4C5}',
      onClick: handleMove,
    },
  ]

  return (
    <BottomSheet name="meal-actions">
      {/* En-tête repas */}
      <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-sep">
        {meal.emoji ? (
          <span className="text-4xl mb-2">{meal.emoji}</span>
        ) : (
          <div className="mb-2">
            <MealAvatar name={meal.name} size="lg" />
          </div>
        )}
        <p className="text-lg font-black text-text1 truncate max-w-full">{meal.name}</p>
        <p className="text-xs text-muted font-semibold mt-1">{PERIOD_LONG[period]}</p>
      </div>

      {/* Actions */}
      <div className="space-y-2 mb-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-bg rounded-2xl text-sm font-bold text-text1 text-left active:scale-[0.98] transition-transform"
          >
            <span className="text-lg leading-none flex-shrink-0">{action.emoji}</span>
            <span className="flex-1">{action.label}</span>
            <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>

      <button
        onClick={handleRemove}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-danger-light rounded-2xl text-sm font-extrabold text-danger active:scale-[0.97] transition-transform"
      >
        Retirer du planning
      </button>
    </BottomSheet>
  )
}
