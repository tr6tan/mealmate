import type { Recipe } from '@/types'
import { PERIOD_LABEL } from '@/lib/utils'

interface Props {
  recipe: Recipe
  onClick: () => void
}

export default function RecipeCard({ recipe, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-xl shadow-card border-[1.5px] border-border overflow-hidden active:scale-[0.96] transition-transform text-left"
    >
      {/* Photo ou placeholder */}
      {recipe.photo ? (
        <img
          src={recipe.photo}
          alt={recipe.name}
          loading="lazy"
          className="w-full h-[90px] object-cover block bg-sep"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      ) : (
        <div className="w-full h-[90px] bg-gradient-to-br from-terra-light to-sep flex items-center justify-center text-3xl">
          {recipe.emoji}
        </div>
      )}

      <div className="p-2.5 pb-3">
        <p className="text-[9px] font-extrabold tracking-[0.07em] uppercase text-muted mb-1">
          {PERIOD_LABEL[recipe.period]}
        </p>
        <p className="text-xs font-extrabold text-text1 leading-snug mb-1.5">{recipe.name}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted font-semibold">{recipe.time}</span>
          {recipe.fav && <span className="text-[13px] text-[#E91E63]">♥</span>}
        </div>
      </div>
    </button>
  )
}
