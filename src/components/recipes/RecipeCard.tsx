import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'
import { PeriodIcon } from '@/components/ui/FoodIcons'

const PERIOD_COLOR: Record<string, string> = {
  pdej: 'text-[#B07A10] bg-[#F5C06520]',
  midi: 'text-[#D23D2D] bg-[#D23D2D15]',
  soir: 'text-[#5A3832] bg-[#6E433D20]',
}
const PERIOD_ICON_COLOR: Record<string, string> = {
  pdej: '#B07A10',
  midi: '#D23D2D',
  soir: '#6E433D',
}
const PERIOD_LABEL: Record<string, string> = { pdej: 'Petit-dej', midi: 'Midi', soir: 'Soir' }
const PERIOD_GRADIENT: Record<string, string> = {
  pdej: 'from-[#F5C06520] to-[#F5C06540]',
  midi: 'from-[#D23D2D10] to-[#D23D2D20]',
  soir: 'from-[#6E433D15] to-[#6E433D30]',
}

interface Props {
  recipe: Recipe
  view: 'grid' | 'list'
  onClick: () => void
  planCount?: number
}

export default function RecipeCard({ recipe, view, onClick, planCount = 0 }: Props) {
  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full bg-card rounded-2xl border-[1.5px] border-border flex items-center gap-3 px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
      >
        {/* Icône */}
        <div className="w-11 h-11 rounded-xl flex-shrink-0 bg-gradient-to-br from-terra-light to-sep flex items-center justify-center">
          {recipe.emoji
            ? <span className="text-2xl leading-none">{recipe.emoji}</span>
            : <PeriodIcon period={recipe.period} className="w-6 h-6 opacity-50" style={{ color: PERIOD_ICON_COLOR[recipe.period] }} />}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn('text-[9px] font-extrabold tracking-[0.07em] uppercase px-1.5 py-0.5 rounded-md', PERIOD_COLOR[recipe.period])}>
              {PERIOD_LABEL[recipe.period]}
            </span>
            {recipe.rapide && <svg className="w-3 h-3 text-[#B07A10]" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
          </div>
          <p className="text-[13px] font-extrabold text-text1 truncate">{recipe.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-muted font-semibold">{recipe.time}</p>
            {planCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: '#D23D2D', background: '#D23D2D12' }}>
                {planCount}×
              </span>
            )}
          </div>
        </div>
        {/* Fav */}
          {recipe.fav && <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#31603D' }} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden active:scale-[0.96] transition-transform text-left flex flex-col"
    >
      {/* Icône + infos */}
      <div className={`w-full bg-gradient-to-br ${PERIOD_GRADIENT[recipe.period] ?? 'from-terra-light to-sep'} px-2.5 pt-2.5 pb-2 flex flex-col flex-1`}>
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-3xl leading-none">
            {recipe.emoji || <PeriodIcon period={recipe.period} className="w-8 h-8 opacity-30" style={{ color: PERIOD_ICON_COLOR[recipe.period] }} />}
          </span>
          <div className="flex gap-0.5">
            {recipe.fav && (
              <svg className="w-3 h-3" style={{ color: '#31603D' }} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            )}
            {recipe.rapide && (
              <svg className="w-3 h-3 text-[#B07A10]" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            )}
          </div>
        </div>
        <p className="text-[11px] font-extrabold text-text1 leading-snug line-clamp-2 mb-auto">{recipe.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className={cn('text-[8px] font-extrabold tracking-wide uppercase px-1 py-0.5 rounded', PERIOD_COLOR[recipe.period])}>
            {PERIOD_LABEL[recipe.period]}
          </span>
          <div className="flex items-center gap-1">
            <p className="text-[10px] text-muted font-semibold">{recipe.time}</p>
            {planCount > 0 && (
              <span className="text-[9px] font-bold text-terra">{planCount}×</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
