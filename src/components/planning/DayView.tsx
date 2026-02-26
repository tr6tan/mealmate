import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import type { Period, SlotKey } from '@/types'
import MealCard from './MealCard'
import MealAddSlot from './MealAddSlot'
import OptionalSlot from './OptionalSlot'

interface PeriodConfig {
  period: Period
  label: string
  slotKey: SlotKey
  entreeKey: SlotKey
  dessertKey: SlotKey
  dotClass: string
}

const PERIODS: PeriodConfig[] = [
  { period: 'pdej', label: 'Petit-déjeuner', slotKey: 'pdej', entreeKey: 'pdej', dessertKey: 'pdej', dotClass: 'bg-morning' },
  { period: 'midi', label: 'Déjeuner',       slotKey: 'midi', entreeKey: 'midi_entree', dessertKey: 'midi_dessert', dotClass: 'bg-terra' },
  { period: 'soir', label: 'Dîner',          slotKey: 'soir', entreeKey: 'soir_entree', dessertKey: 'soir_dessert', dotClass: 'bg-evening' },
]

interface Props {
  dayIdx: number
}

export default function DayView({ dayIdx }: Props) {
  const openSheet = useAppStore((s) => s.openSheet)
  const weekOffset = useAppStore((s) => s.weekOffset)
  const plan = useAppStore((s) => selectCurrentWeekPlan(s)[dayIdx])

  if (!plan) return null

  const isEmpty = !plan.pdej && !plan.midi && !plan.soir &&
    !plan.midi_entree && !plan.midi_dessert && !plan.soir_entree && !plan.soir_dessert

  return (
    <div className="flex flex-col gap-4">
      {isEmpty && weekOffset !== 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">🗓️</span>
          <p className="text-sm font-bold text-text1">Rien de planifié</p>
          <p className="text-xs text-muted">Appuie sur un slot pour ajouter un repas</p>
        </div>
      )}
      {PERIODS.map(({ period, label, slotKey, entreeKey, dessertKey, dotClass }) => {
        const mainMeal = slotKey === 'pdej' ? plan.pdej : slotKey === 'midi' ? plan.midi : plan.soir
        const entreeMeal = entreeKey === 'midi_entree' ? plan.midi_entree : entreeKey === 'soir_entree' ? plan.soir_entree : null
        const dessertMeal = dessertKey === 'midi_dessert' ? plan.midi_dessert : dessertKey === 'soir_dessert' ? plan.soir_dessert : null

        return (
          <div key={period}>
            {/* En-tête période */}
            <div className="flex items-center gap-2 mb-2.5 text-sm font-extrabold text-text1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
              {label}
            </div>

            {/* Slot principal */}
            {mainMeal ? (
              <MealCard
                meal={mainMeal}
                onPress={() =>
                  openSheet({
                    sheet: 'meal-actions',
                    actionContext: { dayIdx, slotKey, meal: mainMeal },
                  })
                }
              />
            ) : (
              <MealAddSlot
                period={period}
                onClick={() =>
                  openSheet({
                    sheet: 'add-meal',
                    addMealPeriod: period,
                    mealContext: { dayIdx, slotKey },
                  })
                }
              />
            )}

            {/* Slots optionnels (entrée/dessert) hors pdej */}
            {period !== 'pdej' && (
              <div className="mt-1.5 space-y-1">
                <OptionalSlot
                  label="Entrée"
                  meal={entreeMeal ?? null}
                  onPress={() =>
                    entreeMeal
                      ? openSheet({ sheet: 'meal-actions', actionContext: { dayIdx, slotKey: entreeKey, meal: entreeMeal } })
                      : openSheet({ sheet: 'add-meal', addMealPeriod: period, mealContext: { dayIdx, slotKey: entreeKey } })
                  }
                />
                <OptionalSlot
                  label="Dessert"
                  meal={dessertMeal ?? null}
                  onPress={() =>
                    dessertMeal
                      ? openSheet({ sheet: 'meal-actions', actionContext: { dayIdx, slotKey: dessertKey, meal: dessertMeal } })
                      : openSheet({ sheet: 'add-meal', addMealPeriod: period, mealContext: { dayIdx, slotKey: dessertKey } })
                  }
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
