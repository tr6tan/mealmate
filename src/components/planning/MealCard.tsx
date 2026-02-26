import type { Meal } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  meal: Meal
  onPress: () => void
}

export default function MealCard({ meal, onPress }: Props) {
  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full bg-card rounded-xl px-3.5 py-3 flex items-center gap-2.5',
        'shadow-card border-[1.5px] border-border',
        'active:scale-[0.98] transition-transform duration-150 text-left',
      )}
    >
      {meal.photo
        ? (
          <div className="w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0">
            <img src={meal.photo} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <span className="text-[28px] flex-shrink-0 leading-none">{meal.emoji}</span>
        )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-text1 truncate">{meal.name}</div>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded-lg">
            {meal.time}
          </span>
          {meal.fav && (
            <span className="text-[11px] font-bold text-[#E91E63] bg-[#FFF0F0] px-2 py-0.5 rounded-lg">
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
