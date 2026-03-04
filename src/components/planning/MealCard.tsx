import type { Meal, Period } from '@/types'
import { cn } from '@/lib/utils'
import { PeriodIcon } from '@/components/ui/FoodIcons'

interface Props {
  meal: Meal
  onPress: () => void
  period?: Period
}

export default function MealCard({ meal, onPress, period }: Props) {
  if (meal.isRestaurant) {
    return (
      <button
        onClick={onPress}
        className={cn(
          'w-full rounded-xl px-3.5 py-3 flex items-center gap-2.5',
          'border-[1.5px] border-amber-200 bg-amber-50',
          'active:scale-[0.98] transition-transform duration-150 text-left',
        )}
      >
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-50">
          <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-amber-800">Restaurant</div>
          <span className="text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg inline-block mt-1.5">
            On mange dehors
          </span>
        </div>
        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full bg-card rounded-xl px-3.5 py-3 flex items-center gap-2.5',
        'shadow-card border-[1.5px] border-border',
        'active:scale-[0.98] transition-transform duration-150 text-left',
      )}
    >
      <div className="w-10 h-10 rounded-[10px] flex-shrink-0 flex items-center justify-center bg-sep">
        {meal.emoji
          ? <span className="text-xl leading-none">{meal.emoji}</span>
          : <PeriodIcon period={period ?? 'midi'} className="w-5 h-5 text-muted" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-text1 truncate">{meal.name}</div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {meal.time && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" style={{ color: '#986C58', background: '#6E433D12' }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {meal.time}
            </span>
          )}
          {meal.fav && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" style={{ color: '#31603D', background: '#31603D14' }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Favori
            </span>
          )}
        </div>
      </div>
      <svg className="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
