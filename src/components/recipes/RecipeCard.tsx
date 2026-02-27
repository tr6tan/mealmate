import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'

const PERIOD_COLOR: Record<string, string> = {
  pdej: 'text-morning bg-[#FFF8EE]',
  midi: 'text-terra bg-terra-light',
  soir: 'text-evening bg-[#F4F0FA]',
}
const PERIOD_LABEL: Record<string, string> = { pdej: 'Petit-dej', midi: 'Midi', soir: 'Soir' }

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
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-terra-light to-sep flex items-center justify-center text-2xl">
          {recipe.photo
            ? <img src={recipe.photo} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
            : <span>{recipe.emoji}</span>
          }
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn('text-[9px] font-extrabold tracking-[0.07em] uppercase px-1.5 py-0.5 rounded-md', PERIOD_COLOR[recipe.period])}>
              {PERIOD_LABEL[recipe.period]}
            </span>
            {recipe.rapide && <span className="text-[10px]">&#x26A1;</span>}
          </div>
          <p className="text-[13px] font-extrabold text-text1 truncate">{recipe.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-muted font-semibold">{recipe.time}</p>
            {planCount > 0 && (
              <span className="text-[10px] font-bold text-terra bg-terra-light px-1.5 py-0.5 rounded-md">
                📅 {planCount}×
              </span>
            )}
          </div>
        </div>
        {/* Fav */}
        {recipe.fav && <span className="text-[#E91E63] text-base flex-shrink-0">♥</span>}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden active:scale-[0.96] transition-transform text-left flex flex-col"
    >
      {/* Visuel */}
      <div className="relative w-full h-[72px] bg-gradient-to-br from-terra-light to-sep flex-shrink-0">
        {recipe.photo ? (
          <img
            src={recipe.photo}
            alt={recipe.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-3xl">{recipe.emoji}</span>
        )}
        {/* Badges overlay */}
        <div className="absolute top-1 left-1 flex gap-0.5">
          {recipe.fav && (
            <span className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center text-[9px] shadow-sm">♥</span>
          )}
          {recipe.rapide && (
            <span className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center text-[9px] shadow-sm">⚡</span>
          )}
        </div>
        {/* Period badge */}
        <span className={cn(
          'absolute bottom-1 right-1 text-[8px] font-extrabold tracking-wide uppercase px-1 py-0.5 rounded bg-white/90',
          PERIOD_COLOR[recipe.period],
        )}>
          {PERIOD_LABEL[recipe.period]}
        </span>
      </div>

      {/* Infos */}
      <div className="px-2 pt-1.5 pb-2 flex-1 flex flex-col">
        <p className="text-[11px] font-extrabold text-text1 leading-snug mb-auto line-clamp-2">{recipe.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-muted font-semibold">{recipe.time}</p>
          {planCount > 0 && (
            <span className="text-[9px] font-bold text-terra">📅{planCount}×</span>
          )}
        </div>
      </div>
    </button>
  )
}
