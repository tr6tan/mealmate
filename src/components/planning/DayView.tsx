import { useState, useEffect } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import type { Period, SlotKey } from '@/types'
import { haptic, getTodayIndex, getMondayByOffset, DAY_SHORT, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
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

const PERIOD_STYLE = {
  pdej: { dot: '#F5C065', bg: '#F5C06518', label: '#9B6A00' },
  midi: { dot: '#D23D2D', bg: '#D23D2D14', label: '#D23D2D' },
  soir: { dot: '#6E433D', bg: '#6E433D14', label: '#6E433D' },
} as const

const PERIODS: PeriodConfig[] = [
  { period: 'pdej', label: 'Petit-déjeuner', slotKey: 'pdej', entreeKey: 'pdej', dessertKey: 'pdej', dotClass: 'bg-morning' },
  { period: 'midi', label: 'Déjeuner',       slotKey: 'midi', entreeKey: 'midi_entree', dessertKey: 'midi_dessert', dotClass: 'bg-terra' },
  { period: 'soir', label: 'Dîner',          slotKey: 'soir', entreeKey: 'soir_entree', dessertKey: 'soir_dessert', dotClass: 'bg-evening' },
]

interface Props { dayIdx: number }

export default function DayView({ dayIdx }: Props) {
  const openSheet  = useAppStore((s) => s.openSheet)
  const setMeal    = useAppStore((s) => s.setMeal)
  const copyDay    = useAppStore((s) => s.copyDay)
  const weekOffset = useAppStore((s) => s.weekOffset)
  const plan       = useAppStore((s) => selectCurrentWeekPlan(s)[dayIdx])
  const [pdejOpen, setPdejOpen] = useState(!!plan?.pdej)
  const [showCopyPicker, setShowCopyPicker] = useState(false)

  // Sync pdejOpen quand on change de jour ou quand un repas pdej est ajouté/retiré
  useEffect(() => {
    setPdejOpen(!!plan?.pdej)
  }, [dayIdx, !!plan?.pdej])

  if (!plan) return null

  const isEmpty =
    !plan.pdej && !plan.midi && !plan.soir &&
    !plan.midi_entree && !plan.midi_dessert && !plan.soir_entree && !plan.soir_dessert

  const todayIdx = getTodayIndex(getMondayByOffset(weekOffset))
  const isToday  = weekOffset === 0 && dayIdx === todayIdx

  return (
    <div className="flex flex-col gap-4">

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-sep flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
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
                className="flex items-center gap-3 mb-3 w-full text-left"
              >
                {/* Pill */}
                <span
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black flex-shrink-0 border"
                  style={{ background: PERIOD_STYLE[period].bg, color: PERIOD_STYLE[period].label, borderColor: PERIOD_STYLE[period].label + '30' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: PERIOD_STYLE[period].dot }} />
                  <span>{label}</span>
                </span>
                {/* Ligne */}
                <span className="flex-1 h-px opacity-15" style={{ background: PERIOD_STYLE[period].label }} />
                {/* Aperçu replié */}
                {mainMeal && !pdejOpen && (
                  <span className="text-[11px] font-semibold truncate max-w-[100px] flex-shrink-0" style={{ color: PERIOD_STYLE[period].label, opacity: 0.7 }}>
                    {mainMeal.name}
                  </span>
                )}
                <span
                  className={`text-xs flex-shrink-0 inline-block transition-transform duration-200 ${pdejOpen ? 'rotate-180' : ''}`}
                  style={{ color: PERIOD_STYLE[period].label, opacity: 0.4 }}
                >
                  ▾
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 mb-3">
                {/* Pill */}
                <span
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black flex-shrink-0 border"
                  style={{ background: PERIOD_STYLE[period].bg, color: PERIOD_STYLE[period].label, borderColor: PERIOD_STYLE[period].label + '30' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: PERIOD_STYLE[period].dot }} />
                  <span>{label}</span>
                </span>
                {/* Ligne */}
                <span className="flex-1 h-px opacity-15" style={{ background: PERIOD_STYLE[period].label }} />
              </div>
            )}

            {/* Contenu du slot (pdej collapsible) */}
            {(period !== 'pdej' || pdejOpen) && (
              <>
                {/* Entrée (hors pdej) */}
                {period !== 'pdej' && (
                  <div className="mb-0.5">
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
                    period={period}
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
                      setMeal(dayIdx, slotKey, { name: 'Restaurant', emoji: '', time: '', fav: false, isRestaurant: true })
                    }}
                  />
                )}

                {/* Dessert (hors pdej) */}
                {period !== 'pdej' && (
                  <div className="mt-0.5">
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

      {/* ── Copier ce jour ─────────────────────────────────────────────────── */}
      {!isEmpty && (
        <div className="mt-2">
          {!showCopyPicker ? (
            <button
              onClick={() => setShowCopyPicker(true)}
              className="w-full py-2.5 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted active:border-terra active:text-terra transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copier vers un autre jour
            </button>
          ) : (
            <div className="bg-card rounded-2xl border-[1.5px] border-border p-3">
              <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Copier vers…</p>
              <div className="flex gap-1.5">
                {DAY_SHORT.map((d, i) => (
                  <button
                    key={i}
                    disabled={i === dayIdx}
                    onClick={() => {
                      copyDay(dayIdx, i)
                      setShowCopyPicker(false)
                      haptic([10])
                      showToast(`Copié vers ${DAY_SHORT[i]}`)
                    }}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-[11px] font-bold transition-all',
                      i === dayIdx
                        ? 'bg-sep text-muted/40'
                        : 'bg-sep text-text1 active:bg-terra active:text-white',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCopyPicker(false)}
                className="w-full mt-2 text-[11px] font-bold text-muted"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
