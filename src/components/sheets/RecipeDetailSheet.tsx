import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'

export default function RecipeDetailSheet() {
  const sheetState  = useAppStore((s) => s.sheetState)
  const toggleFav   = useAppStore((s) => s.toggleFav)
  const deleteRecipe = useAppStore((s) => s.deleteRecipe)
  const openSheet   = useAppStore((s) => s.openSheet)
  const closeSheet  = useAppStore((s) => s.closeSheet)

  const recipe = sheetState.recipeContext
  if (!recipe) return <BottomSheet name="recipe-detail"><div /></BottomSheet>

  const handleDelete = () => {
    if (!window.confirm(`Supprimer « ${recipe.name} » ?`)) return
    deleteRecipe(recipe.id)
    closeSheet()
    showToast('Recette supprimée')
  }

  return (
    <BottomSheet name="recipe-detail" className="max-h-[88dvh]">
      {/* Photo hero */}
      {recipe.photo && (
        <div className="-mx-5 -mt-5 mb-4 h-[180px] overflow-hidden rounded-t-[28px] relative">
          <img
            src={recipe.photo}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-4 flex gap-1.5">
            {recipe.fav && <span className="text-[11px] font-bold text-white bg-[#E91E63]/80 px-2 py-0.5 rounded-lg">♥ Favori</span>}
            {recipe.rapide && <span className="text-[11px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-lg">⚡ Rapide</span>}
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        {!recipe.photo && <span className="text-[42px] leading-none">{recipe.emoji}</span>}
        <div className="flex-1">
          <h2 className="text-[18px] font-extrabold text-text1 mb-1.5 leading-tight">{recipe.name}</h2>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#E65100] bg-[#FFF3E0] px-2 py-0.5 rounded-lg">⏱ {recipe.time}</span>
            {!recipe.photo && recipe.fav && (
              <span className="text-[11px] font-bold text-[#E91E63] bg-[#FFF0F0] px-2 py-0.5 rounded-lg">♥ Favori</span>
            )}
            {!recipe.photo && recipe.rapide && (
              <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">⚡ Rapide</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions principale */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => toggleFav(recipe.id)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-[0.97] ${
            recipe.fav ? 'bg-[#FDE8F0] text-[#C0304A]' : 'bg-[#FFF0F0] text-[#E91E63]'
          }`}
        >
          {recipe.fav ? '♥ Retirer des favoris' : '♡ Ajouter aux favoris'}
        </button>
        <button
          onClick={() => openSheet({ sheet: 'pick-day', pickDayContext: { recipe } })}
          className="flex-1 py-2.5 rounded-xl bg-terra-light text-terra text-xs font-extrabold active:scale-[0.97] transition-all"
        >
          + Ajouter au planning
        </button>
      </div>

      {/* Ingrédients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <>
          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Ingrédients</p>
          <div className="space-y-1.5 mb-5">
            {recipe.ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] bg-card border-[1.5px] border-border"
              >
                <span className="flex-1 text-[13px] font-bold text-text1">{ing.name}</span>
                <span className="text-[11px] font-bold text-muted bg-sep px-2 py-0.5 rounded-[7px]">{ing.qty}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Étapes */}
      {recipe.steps && recipe.steps.length > 0 && (
        <>
          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-3">Préparation</p>
          <div className="space-y-3 mb-5">
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

      {/* Supprimer */}
      <button
        onClick={handleDelete}
        className="w-full mt-2 py-3 rounded-2xl bg-[#FDE8F0] text-[#C0304A] text-xs font-extrabold active:scale-[0.97] transition-transform"
      >
        🗑 Supprimer cette recette
      </button>
    </BottomSheet>
  )
}
