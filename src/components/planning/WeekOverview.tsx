import { useMemo } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import { DAY_SHORT, getMondayByOffset, getDayFromMonday, MONTHS, getTodayIndex, cn } from '@/lib/utils'
import MealAvatar from '@/components/ui/MealAvatar'

const ROWS = ['midi', 'soir'] as const
const ROW_LABEL = { midi: 'Déj', soir: 'Dîner' } as const
const ROW_DOT   = { midi: 'bg-terra', soir: 'bg-evening' } as const

interface Props {
  onSelectDay: (idx: number) => void
  selectedIdx: number
}

export default function WeekOverview({ onSelectDay, selectedIdx }: Props) {
  const weekPlan   = useAppStore(selectCurrentWeekPlan)
  const weekOffset = useAppStore((s) => s.weekOffset)
  const monday     = getMondayByOffset(weekOffset)
  const todayIdx   = getTodayIndex(monday)

  const counts = useMemo(() => {
    let total = 0
    for (let i = 0; i < 7; i++) {
      const day = weekPlan[i]
      if (!day) continue
      if (day.midi) total++
      if (day.soir) total++
    }
    return total
  }, [weekPlan])

  const pct = Math.round((counts / 14) * 100)

  return (
    <div className="px-5 pb-4 flex flex-col gap-3">

      {/* ── Résumé compact ── */}
      <div className="bg-card rounded-2xl px-4 py-3 border-[1.5px] border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-extrabold text-text1">{counts} / 14 repas</span>
          <span className="text-[12px] font-bold text-terra">{pct}%</span>
        </div>
        <div className="bg-border/30 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terra to-[#F4A67A] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Grille calendrier ── */}
      <div className="bg-card rounded-2xl border-[1.5px] border-border overflow-hidden">

        {/* En-tête jours */}
        <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-sep">
          <div /> {/* cellule vide coin haut-gauche */}
          {Array.from({ length: 7 }).map((_, i) => {
            const d = getDayFromMonday(monday, i)
            const isToday = i === todayIdx
            return (
              <button
                key={i}
                onClick={() => onSelectDay(i)}
                className={cn(
                  'flex flex-col items-center py-2 transition-colors',
                  isToday && 'bg-terra/10',
                )}
              >
                <span className={cn(
                  'text-[9px] font-black tracking-wider uppercase leading-none',
                  isToday ? 'text-terra' : 'text-muted',
                )}>
                  {DAY_SHORT[i]}
                </span>
                <span className={cn(
                  'text-[13px] font-black leading-tight mt-0.5',
                  isToday ? 'text-terra' : 'text-text1',
                )}>
                  {d.getDate()}
                </span>
              </button>
            )
          })}
        </div>

        {/* Lignes Déj / Dîner */}
        {ROWS.map((row) => (
          <div
            key={row}
            className={cn(
              'grid grid-cols-[40px_repeat(7,1fr)]',
              row === 'midi' && 'border-b border-sep',
            )}
          >
            {/* Label ligne */}
            <div className="flex items-center justify-center">
              <span className={cn(
                'text-[9px] font-black tracking-wider uppercase text-muted leading-none',
              )}>
                {ROW_LABEL[row]}
              </span>
            </div>

            {/* Cellules repas */}
            {Array.from({ length: 7 }).map((_, i) => {
              const plan = weekPlan[i]
              const meal = row === 'midi' ? plan?.midi : plan?.soir
              const isToday = i === todayIdx

              return (
                <button
                  key={i}
                  onClick={() => onSelectDay(i)}
                  className={cn(
                    'flex items-center justify-center py-3 transition-colors active:bg-terra-light/40',
                    isToday && 'bg-terra/5',
                  )}
                >
                  {meal ? (
                    meal.isRestaurant ? (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[13px] leading-none"
                        style={{ background: 'linear-gradient(135deg, #001080 0%, #2B50F0 100%)' }}
                        title={meal.name}
                      >
                        🍴
                      </div>
                    ) : meal.emoji ? (
                      <span className="text-[18px] leading-none" title={meal.name}>{meal.emoji}</span>
                    ) : (
                      <MealAvatar name={meal.name} size="sm" />
                    )
                  ) : (
                    <span className={cn('w-2 h-2 rounded-full', isToday ? 'bg-terra/20' : 'bg-border')} />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Liste détaillée par jour ── */}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const d = getDayFromMonday(monday, i)
          const plan = weekPlan[i]
          const isToday = i === todayIdx
          const hasMidi = !!plan?.midi
          const hasSoir = !!plan?.soir
          const hasAny = hasMidi || hasSoir

          return (
            <button
              key={i}
              onClick={() => onSelectDay(i)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all active:scale-[0.98]',
                isToday ? 'bg-terra/8 border border-terra/25' : 'bg-card/60',
              )}
            >
              {/* Jour */}
              <div className="flex-shrink-0 w-11">
                <p className={cn('text-[9px] font-black tracking-widest uppercase', isToday ? 'text-terra' : 'text-muted')}>
                  {DAY_SHORT[i]}
                </p>
                <p className={cn('text-[12px] font-extrabold leading-tight', isToday ? 'text-terra' : 'text-text1')}>
                  {d.getDate()} {MONTHS[d.getMonth()]}
                </p>
              </div>

              {/* Repas */}
              {hasAny ? (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {hasMidi && (
                    <span className={cn(
                      'flex items-center gap-1 text-[11px] font-semibold truncate',
                      plan!.midi!.isRestaurant ? 'text-[#2B50F0] font-black' : 'text-text1',
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        plan!.midi!.isRestaurant ? 'bg-[#0022CC]' : 'bg-terra',
                      )} />
                      {plan!.midi!.name}
                    </span>
                  )}
                  {hasMidi && hasSoir && <span className="text-sep font-bold">·</span>}
                  {hasSoir && (
                    <span className={cn(
                      'flex items-center gap-1 text-[11px] font-semibold truncate',
                      plan!.soir!.isRestaurant ? 'text-[#2B50F0] font-black' : 'text-text1',
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        plan!.soir!.isRestaurant ? 'bg-[#0022CC]' : 'bg-evening',
                      )} />
                      {plan!.soir!.name}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-muted italic">Aucun repas</span>
              )}

              <span className="text-muted text-sm">›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
