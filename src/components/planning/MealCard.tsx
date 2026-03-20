import type { Meal, Period } from '@/types'
import { cn } from '@/lib/utils'
import MealAvatar from '@/components/ui/MealAvatar'

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
          'w-full rounded-xl px-3 py-2.5 flex items-center gap-3',
          'bg-terra-light/50',
          'active:scale-[0.98] transition-transform duration-150 text-left',
        )}
      >
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-[10px]">
          <span className="text-lg leading-none">{"\u{1F468}\u200D\u{1F373}"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-terra-dark">{meal.name || 'Restaurant'}</div>
          <span className="text-[11px] font-semibold text-terra/60 mt-0.5 block">
            On mange dehors
          </span>
        </div>
        <svg className="w-4 h-4 text-terra/30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full rounded-xl px-3 py-2.5 flex items-center gap-3',
        'active:scale-[0.98] transition-transform duration-150 text-left',
      )}
    >
      <div className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center">
        {meal.emoji
          ? <span className="text-lg leading-none">{meal.emoji}</span>
          : <MealAvatar name={meal.name} size="md" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-text1 truncate">{meal.name}</div>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {meal.time && (
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {meal.time}
            </span>
          )}
          {meal.fav && (
            <span className="text-[11px] font-semibold text-sage flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Favori
            </span>
          )}
        </div>
      </div>
      <svg className="w-4 h-4 text-muted/40 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
