import { useState } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import type { Period, SlotKey } from '@/types'
import { haptic, getTodayIndex, getMondayByOffset } from '@/lib/utils'
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

interface Props { dayIdx: number }

export default function DayView({ dayIdx }: Props) {
  const openSheet  = useAppStore((s) => s.openSheet)
  const setMeal    = useAppStore((s) => s.setMeal)
  const weekOffset = useAppStore((s) => s.weekOffset)
  const plan       = useAppStore((s) => selectCurrentWeekPlan(s)[dayIdx])
  const [pdejOpen, setPdejOpen] = useState(!!plan?.pdej)

  if (!plan) return null

  const isEmpty =
    !plan.pdej && !plan.midi && !plan.soir &&
    !plan.midi_entree && !plan.midi_dessert && !plan.soir_entree && !plan.soir_dessert

  const todayIdx = getTodayIndex(getMondayByOffset(weekOffset))
  const isToday  = weekOffset === 0 && dayIdx === todayIdx

  return (
    <div className="flex flex-col gap-4">

      {/* ── Banner "Ce soir" (aujourd'hui seulement) ──────────────────────── */}
      {isToday && plan.soir && (
        <button
          className="flex items-center gap-3 bg-[#F4F0FA] border-[1.5px] border-evening/30 rounded-2xl px-3.5 py-2.5 text-left active:scale-[0.98] transition-transform"
          onClick={() =>
            openSheet({ sheet: 'meal-actions', actionContext: { dayIdx, slotKey: 'soir', meal: plan.soir! } })
          }
        >
          <span className="text-2xl leading-none flex-shrink-0">{plan.soir.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-extrabold text-evening uppercase tracking-wide mb-0.5">Ce soir</p>
            <p className="text-[13px] font-extrabold text-text1 truncate">{plan.soir.name}</p>
          </div>
          {plan.soir.time && (
            <span className="text-[11px] font-bold text-muted bg-white/70 px-2 py-0.5 rounded-lg flex-shrink-0">
              {plan.soir.time}
            </span>
          )}
        </button>
      )}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {isEmpty && weekOffset !== 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">🗓️</span>
          <p className="text-sm font-bold text-text1">Rien de planifié</p>
          <p className="text-xs text-muted">Appuie sur un slot pour ajouter un repas</p>
        </div>
      )}

      {/* ── Périodes ───────────────────────────────────────────────────────── */}
      {PERIODS.map(({ period, label, slotKey, entreeKey, dessertKey, dotClass }) => {
        const mainMeal    = slotKey    === 'pdej' ? plan.pdej    : slotKey    === 'midi' ? plan.midi    : plan.soir
        const entreeMeal  = entreeKey  === 'midi_entree'  ? plan.midi_entree  : entreeKey  === 'soir_entree'  ? plan.soir_entree  : null
        const dessertMeal = dessertKey === 'midi_dessert' ? plan.midi_dessert : dessertKey === 'soir_dessert' ? plan.soir_dessert : null

        return (
          <div key={period}>
            {/* En-tête période */}
            {period === 'pdej' ? (
              <button
                onClick={() => setPdejOpen((o) => !o)}
                className="flex items-center gap-2 mb-2.5 w-full text-left"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                <span className="text-sm font-extrabold text-text1 flex-1">{label}</span>
                {mainMeal && !pdejOpen && (
                  <span className="text-xs text-muted font-semibold truncate max-w-[110px]">
                    {mainMeal.emoji} {mainMeal.name}
                  </span>
                )}
                <span
                  className={`text-muted text-sm ml-1 inline-block transition-transform duration-200 ${pdejOpen ? 'rotate-180' : ''}`}
                >
                  ▾
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 mb-2.5 text-sm font-extrabold text-text1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                {label}
              </div>
            )}

            {/* Contenu du slot (pdej collapsible) */}
            {(period !== 'pdej' || pdejOpen) && (
              <>
                {/* Entrée (hors pdej) */}
                {period !== 'pdej' && (
                  <div className="mb-1.5">
                    <OptionalSlot
                      label="Entrée"
                      meal={entreeMeal ?? null}
                      onPress={() =>
                        entreeMeal
                          ? openSheet({ sheet: 'meal-actions', actionContext: { dayIdx, slotKey: entreeKey, meal: entreeMeal } })
                          : openSheet({ sheet: 'add-meal', addMealPeriod: period, mealContext: { dayIdx, slotKey: entreeKey } })
                      }
                    />
                  </div>
                )}

                {/* Slot principal */}
                {mainMeal ? (
                  <MealCard
                    meal={mainMeal}
                    onPress={() =>
                      openSheet({ sheet: 'meal-actions', actionContext: { dayIdx, slotKey, meal: mainMeal } })
                    }
                  />
                ) : (
                  <MealAddSlot
                    period={period}
                    onClick={() =>
                      openSheet({ sheet: 'add-meal', addMealPeriod: period, mealContext: { dayIdx, slotKey } })
                    }
                    onRestaurant={() => {
                      haptic([10, 50])
                      setMeal(dayIdx, slotKey, { name: 'Restaurant', emoji: '🍽️', time: '', fav: false, isRestaurant: true })
                    }}
                  />
                )}

                {/* Dessert (hors pdej) */}
                {period !== 'pdej' && (
                  <div className="mt-1.5">
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
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
