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
        className="flex-1 bg-card rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 border-2 border-dashed border-border active:border-terra active:bg-terra-light active:scale-[0.98] transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-[9px] bg-sep flex items-center justify-center text-muted text-base flex-shrink-0">
          +
        </div>
        <span className="text-xs font-semibold text-muted">Ajouter {LABELS[period]}</span>
      </button>
      <button
        onClick={onRestaurant}
        title="On mange au restaurant"
        aria-label="Ajouter un restaurant"
        className="bg-card rounded-xl px-3 py-2.5 flex flex-col items-center justify-center gap-0.5 border-2 border-dashed border-border active:border-amber-400 active:bg-amber-50 active:scale-[0.98] transition-all duration-200 flex-shrink-0"
      >
        <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
        <span className="text-[9px] font-bold text-muted">Resto</span>
      </button>
    </div>
  )
}
