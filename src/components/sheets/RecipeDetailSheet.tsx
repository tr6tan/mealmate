import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'

export default function RecipeDetailSheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const toggleFav = useAppStore((s) => s.toggleFav)
  const openSheet = useAppStore((s) => s.openSheet)

  const recipe = sheetState.recipeContext
  if (!recipe) return <BottomSheet name="recipe-detail"><div /></BottomSheet>

  return (
    <BottomSheet name="recipe-detail" className="max-h-[88dvh]">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <span className="text-[42px] leading-none">{recipe.emoji}</span>
        <div className="flex-1">
          <h2 className="text-[17px] font-extrabold text-text1 mb-1.5">{recipe.name}</h2>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded-lg">
              ⏱ {recipe.time}
            </span>
            {recipe.fav && (
              <span className="text-[11px] font-bold text-[#E91E63] bg-[#FFF0F0] px-2 py-0.5 rounded-lg">
                ❤️ Favori
              </span>
            )}
            {recipe.rapide && (
              <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">
                ⚡ Rapide
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => toggleFav(recipe.id)}
          className="flex-1 py-2 rounded-xl bg-[#FFF0F0] text-[#E91E63] text-xs font-extrabold"
        >
          {recipe.fav ? '♥ Retirer des favoris' : '♡ Ajouter aux favoris'}
        </button>
        <button
          onClick={() => openSheet({ sheet: 'pick-day', pickDayContext: { recipe } })}
          className="flex-1 py-2 rounded-xl bg-terra-light text-terra text-xs font-extrabold"
        >
          + Ajouter au planning
        </button>
      </div>

      {/* Ingrédients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <>
          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">
            Ingrédients
          </p>
          <div className="space-y-1.5 mb-5">
            {recipe.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] bg-card border-[1.5px] border-border"
              >
                <span className="flex-1 text-[13px] font-bold text-text1">{ing.name}</span>
                <span className="text-[11px] font-bold text-muted bg-sep px-2 py-0.5 rounded-[7px]">
                  {ing.qty}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Étapes */}
      {recipe.steps && recipe.steps.length > 0 && (
        <>
          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">
            Préparation
          </p>
          <div className="space-y-3">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="min-w-6 h-6 rounded-full bg-terra text-white flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[13px] text-text1 font-semibold leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </BottomSheet>
  )
}
