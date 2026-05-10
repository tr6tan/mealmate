import type { Recipe } from '@/types'
import { ingredientEmoji } from '@/lib/utils'
import { getStickerSlug, stickerUrl } from '@/lib/stickers'

interface Props {
  recipe: Recipe
  view?: 'grid' | 'list'
  onClick: () => void
  planCount?: number
}

export default function RecipeCard({ recipe, onClick, planCount = 0 }: Props) {
  const ingredients = recipe.ingredients?.slice(0, 5) ?? []
  const stickerSlug = getStickerSlug(recipe.name)

  return (
    <div
      onClick={onClick}
      className="glass rounded-[32px] p-4 relative overflow-hidden cursor-pointer select-none active:scale-[0.98] transition-transform"
    >
      {/* Watermark : sticker si match, sinon emoji */}
      {stickerSlug ? (
        <img
          src={stickerUrl(stickerSlug)}
          alt=""
          aria-hidden
          className="absolute -bottom-3 -right-3 w-[110px] h-[110px] object-contain pointer-events-none select-none"
          style={{ opacity: 0.18 }}
        />
      ) : recipe.emoji ? (
        <div
          className="absolute bottom-2 right-3 pointer-events-none text-[72px] leading-none"
          style={{ opacity: 0.07 }}
        >
          {recipe.emoji}
        </div>
      ) : null}

      {/* Fav indicator */}
      {recipe.fav && (
        <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/50 backdrop-blur flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-[#0018A8]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
      )}

      <div className={recipe.fav ? 'pr-10' : 'pr-4'}>
        {/* Méta : temps + rapide */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {recipe.time}
          {recipe.rapide && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#F5C06528', color: '#92400E' }}>
              ⚡ Rapide
            </span>
          )}
          {planCount > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,24,168,0.08)', color: '#0018A8' }}
            >
              {planCount}× planifié
            </span>
          )}
        </div>

        <p className="text-base font-semibold text-text1 line-clamp-2 mb-3">{recipe.name}</p>

        {/* Ingredient stickers */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ingredients.map((ing) => (
              <span
                key={ing.name}
                className="text-[18px] leading-none"
                title={ing.name}
              >
                {ingredientEmoji(ing.name)}
              </span>
            ))}
            {(recipe.ingredients?.length ?? 0) > 5 && (
              <span
                className="text-[11px] font-semibold px-2 py-1 rounded-full self-center"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#6B7280' }}
              >
                +{(recipe.ingredients?.length ?? 0) - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
