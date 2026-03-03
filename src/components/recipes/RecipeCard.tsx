import { cn } from '@/lib/utils'
import type { Recipe } from '@/types'

const PERIOD_COLOR: Record<string, string> = {
  pdej: 'text-[#c07820] bg-[#ffc48f20]',
  midi: 'text-[#990000] bg-[#99000015]',
  soir: 'text-[#4a7480] bg-[#9bb5bd20]',
}
const PERIOD_LABEL: Record<string, string> = { pdej: 'Petit-dej', midi: 'Midi', soir: 'Soir' }
const PERIOD_GRADIENT: Record<string, string> = {
  pdej: 'from-[#ffc48f20] to-[#ffc48f40]',
  midi: 'from-[#99000010] to-[#99000020]',
  soir: 'from-[#9bb5bd15] to-[#9bb5bd30]',
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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: '#990000', background: '#99000012' }}>
                📅 {planCount}×
              </span>
            )}
          </div>
        </div>
        {/* Fav */}
          {recipe.fav && <span className="flex-shrink-0" style={{ color: '#99a680' }}>♥</span>}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden active:scale-[0.96] transition-transform text-left flex flex-col"
    >
      {/* Visuel */}
      <div className={`relative w-full h-[72px] bg-gradient-to-br ${PERIOD_GRADIENT[recipe.period] ?? 'from-terra-light to-sep'} flex-shrink-0`}>
        {recipe.photo ? (
          <img
            src={recipe.photo}
            alt={recipe.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-4xl">{recipe.emoji}</span>
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
