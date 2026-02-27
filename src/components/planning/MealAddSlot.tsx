import type { Period } from '@/types'

const LABELS: Record<Period, string> = {
  pdej: 'un petit-déjeuner',
  midi: 'un déjeuner',
  soir: 'un dîner',
}

interface Props {
  period: Period
  onClick: () => void
  onRestaurant: () => void
}

export default function MealAddSlot({ period, onClick, onRestaurant }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onClick}
        className="flex-1 bg-card rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 border-2 border-dashed border-border hover:border-terra hover:bg-terra-light active:scale-[0.98] transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-[9px] bg-sep flex items-center justify-center text-muted text-base flex-shrink-0">
          +
        </div>
        <span className="text-xs font-semibold text-muted">Ajouter {LABELS[period]}</span>
      </button>
      <button
        onClick={onRestaurant}
        title="On mange au restaurant"
        className="bg-card rounded-xl px-3 py-2.5 flex flex-col items-center justify-center gap-0.5 border-2 border-dashed border-border hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98] transition-all duration-200 flex-shrink-0"
      >
        <span className="text-lg leading-none">🍽️</span>
        <span className="text-[9px] font-bold text-muted">Resto</span>
      </button>
    </div>
  )
}
