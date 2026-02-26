import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import { DAY_SHORT, getMondayByOffset, getDayFromMonday, MONTHS, getTodayIndex, cn } from '@/lib/utils'

const SLOTS = ['pdej', 'midi', 'soir'] as const
const DOT_COLOR = { pdej: 'bg-morning', midi: 'bg-terra', soir: 'bg-evening' } as const

interface Props {
  onSelectDay: (idx: number) => void
  selectedIdx: number
}

export default function WeekOverview({ onSelectDay, selectedIdx }: Props) {
  const weekPlan  = useAppStore(selectCurrentWeekPlan)
  const weekOffset = useAppStore((s) => s.weekOffset)
  const monday    = getMondayByOffset(weekOffset)
  const todayIdx  = getTodayIndex(monday)

  return (
    <div className="px-5 pb-4 flex flex-col gap-1.5">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = getDayFromMonday(monday, i)
        const plan = weekPlan[i]
        const isToday = i === todayIdx
        const isSelected = i === selectedIdx

        return (
          <button
            key={i}
            onClick={() => onSelectDay(i)}
            className={cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border-2 text-left transition-all duration-150 active:scale-[0.98]',
              isSelected ? 'bg-terra-light border-terra' : 'bg-card border-transparent',
              isToday && !isSelected && 'border-terra/40',
            )}
          >
            {/* Jour */}
            <div className="flex-shrink-0 w-14">
              <p className={cn('text-[10px] font-black tracking-widest uppercase', isToday || isSelected ? 'text-terra' : 'text-muted')}>
                {DAY_SHORT[i]}
              </p>
              <p className={cn('text-sm font-extrabold', isToday || isSelected ? 'text-terra' : 'text-text1')}>
                {d.getDate()} {MONTHS[d.getMonth()]}
              </p>
            </div>

            {/* Repas */}
            <div className="flex-1 flex flex-col gap-1">
              {SLOTS.map((slot) => {
                const meal = slot === 'pdej' ? plan?.pdej : slot === 'midi' ? plan?.midi : plan?.soir
                return meal ? (
                  <div key={slot} className="flex items-center gap-1.5">
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', DOT_COLOR[slot])} />
                    <span className="text-[12px] font-semibold text-text1 truncate">
                      {meal.emoji} {meal.name}
                    </span>
                  </div>
                ) : (
                  <div key={slot} className="flex items-center gap-1.5">
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-25', DOT_COLOR[slot])} />
                    <span className="text-[11px] text-muted italic">—</span>
                  </div>
                )
              })}
            </div>
          </button>
        )
      })}
    </div>
  )
}
