import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'
import MealAvatar from '@/components/ui/MealAvatar'
import FoodSticker from '@/components/ui/FoodSticker'
import { ingredientEmoji } from '@/lib/utils'

function scaleQty(qty: string, factor: number): string {
  if (!qty || factor === 1) return qty
  const match = qty.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
  if (!match) return qty
  const num = parseFloat(match[1].replace(',', '.'))
  const unit = match[2].trim()
  const scaled = Math.round(num * factor * 10) / 10
  return unit ? `${scaled} ${unit}` : `${scaled}`
}

// ── Icônes SVG ──────────────────────────────────────────────────────────────
const IcoBack  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcoHeart = ({ filled }: { filled?: boolean }) =>
  filled
    ? <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoClock  = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoCookHat = () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><path d="M8 11V9"/><path d="M16 11V9"/><path d="M12 11V9"/><path d="M2 19h20"/><path d="M6.73 7a8 8 0 0 1 10.54 0"/><path d="M12 2a4 4 0 0 0-4 4"/><path d="M16 6a4 4 0 0 0-4-4"/><path d="M4 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9H4v2z"/></svg>
const IcoCalendar = () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoCart  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const IcoPen   = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
const IcoTrash = () => <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>

// ── Icônes de catégorie (dans les cercles bleus) ─────────────────────────────
const CAT_ICONS: Record<string, JSX.Element> = {
  legumes:  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  viandes:  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 11.5a3 3 0 0 1-4.24 0L7 7.76a6 6 0 0 1 8.49-8.49l3.74 3.74a3 3 0 0 1 0 4.24z"/><path d="M9.5 14.5 3 21"/><path d="M14.5 9.5 8 16"/></svg>,
  cremerie: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c-4.97 0-9-2.69-9-6 0-1.72 1.14-3.27 3-4.35V9a3 3 0 0 1 6 0v2.65c1.86 1.08 3 2.63 3 4.35 0 3.31-4.03 6-9 6z"/></svg>,
  epicerie: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  surgeles: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="m17 7-5-5-5 5"/><path d="m17 17-5 5-5-5"/><line x1="2" y1="12" x2="22" y2="12"/><path d="m7 7-5 5 5 5"/><path d="m17 7 5 5-5 5"/></svg>,
  maison:   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
}

export default function RecipeDetailSheet() {
  const sheetState      = useAppStore((s) => s.sheetState)
  const toggleFav       = useAppStore((s) => s.toggleFav)
  const updateRecipe    = useAppStore((s) => s.updateRecipe)
  const deleteRecipe    = useAppStore((s) => s.deleteRecipe)
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe)
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const openSheet       = useAppStore((s) => s.openSheet)
  const closeSheet      = useAppStore((s) => s.closeSheet)
  const [portions, setPortions]     = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [localNotes, setLocalNotes] = useState('')

  const recipe = sheetState.recipeContext
  if (!recipe) return <BottomSheet name="recipe-detail"><div /></BottomSheet>

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteRecipe(recipe.id)
      closeSheet()
      showToast('Recette supprimée')
    } else {
      setDeleteConfirm(true)
      setTimeout(() => setDeleteConfirm(false), 3000)
    }
  }

  const handleAddToCourses = () => {
    if (!recipe.ingredients?.length) return
    recipe.ingredients.forEach((ing) => {
      addShoppingItem({ name: ing.name, qty: scaleQty(ing.qty, portions), category: ing.category, checked: false })
    })
    showToast(`${recipe.ingredients.length} ingrédient${recipe.ingredients.length > 1 ? 's' : ''} ajouté${recipe.ingredients.length > 1 ? 's' : ''} aux courses !`)
  }

  const hasIngredients = !!recipe.ingredients?.length
  const hasSteps       = !!recipe.steps?.length

  return (
    <BottomSheet name="recipe-detail">

      {/* ── TOP BAR : Retour + Favori ── */}
      <div className="flex items-center justify-between -mx-5 px-4 pt-0 pb-4 sticky top-0 z-10 bg-card">
        <button
          onClick={closeSheet}
          className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <IcoBack />
        </button>
        <button
          onClick={() => toggleFav(recipe.id)}
          className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center active:scale-90 transition-transform"
          style={recipe.fav ? { background: '#FDE8F0', color: '#C0304A' } : {}}
        >
          <IcoHeart filled={recipe.fav} />
        </button>
      </div>

      {/* ── PHOTO ── */}
      <div className="flex justify-center mb-5">
        {recipe.photo ? (
          <div className="w-full max-w-[280px] h-[190px] rounded-[24px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <img src={recipe.photo} alt={recipe.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="w-full max-w-[280px] h-[160px] rounded-[24px] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #EEF0FF 0%, #DDE2FF 60%, #C7CFFF 100%)' }}
          >
            {/* Watermark décoratif */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 scale-[2] pointer-events-none">
              <FoodSticker name={recipe.name} size={160} shadow={false} />
            </div>
            <FoodSticker
              name={recipe.name}
              size={110}
              fallback={
                recipe.emoji
                  ? <span className="text-[80px] leading-none">{recipe.emoji}</span>
                  : <MealAvatar name={recipe.name} size="xl" />
              }
            />
          </div>
        )}
      </div>

      {/* ── TITRE + MÉTA ── */}
      <div className="mb-5">
        <h2 className="text-[26px] font-bold text-neutral-900 leading-tight tracking-[-0.03em] mb-1.5">
          {recipe.name}
        </h2>
        {recipe.notes && (
          <p className="text-[14px] text-neutral-400 leading-relaxed mb-3">{recipe.notes}</p>
        )}
        <div className="flex items-center gap-1.5 text-[13px] text-neutral-400 mb-3">
          <IcoClock />
          <span>{recipe.time}</span>
          {recipe.rapide && <span className="ml-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⚡ Rapide</span>}
        </div>
        {/* Stars */}
        <div className="flex gap-0.5 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => updateRecipe(recipe.id, { rating: recipe.rating === star ? undefined : star })}
              className="active:scale-110 transition-transform"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"
                fill={(recipe.rating ?? 0) >= star ? '#001DC1' : 'none'}
                stroke={(recipe.rating ?? 0) >= star ? '#001DC1' : '#D1D5DB'}
                strokeWidth="1.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          ))}
        </div>

        {/* Aperçu ingrédients */}
        {hasIngredients && (
          <div className="flex gap-1.5 flex-wrap">
            {recipe.ingredients!.slice(0, 6).map((ing, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center"
                title={ing.name}
              >
                <FoodSticker
                  name={ing.name}
                  size={20}
                  shadow={false}
                  fallback={<span className="text-[14px] leading-none">{ingredientEmoji(ing.name)}</span>}
                />
              </div>
            ))}
            {recipe.ingredients!.length > 6 && (
              <div className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[11px] font-bold text-[#001DC1]">
                +{recipe.ingredients!.length - 6}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CTA : Démarrer la cuisine ── */}
      <button
        onClick={() => openSheet({ sheet: 'cook-mode', recipeContext: recipe })}
        className="w-full py-4 rounded-2xl text-white text-[15px] font-semibold tracking-[-0.01em] active:scale-[0.97] transition-all flex items-center justify-center gap-2.5 mb-6"
        style={{ background: '#001DC1', boxShadow: '0 4px 20px rgba(0,29,193,0.28)' }}
      >
        <IcoCookHat />
        Démarrer la cuisine
      </button>

      {/* ── INGRÉDIENTS ── */}
      {hasIngredients && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[17px] font-bold text-neutral-900 tracking-[-0.02em]">Ingrédients</h3>
            {/* Portions ×1 ×2 ×4 */}
            <div className="flex gap-1.5">
              {([1, 2, 4] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPortions(p)}
                  className="w-9 h-9 rounded-full text-[13px] font-bold transition-all active:scale-90"
                  style={
                    portions === p
                      ? { background: '#001DC1', color: 'white' }
                      : { background: '#F3F4F6', color: '#6B7280' }
                  }
                >
                  ×{p}
                </button>
              ))}
            </div>
          </div>

          {/* Grille 2 colonnes */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {recipe.ingredients!.map((ing, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-2xl px-3 py-3"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-[#EEF0FF]">
                  <FoodSticker
                    name={ing.name}
                    size={28}
                    shadow={false}
                    fallback={
                      <span className="text-[20px] leading-none">{ingredientEmoji(ing.name)}</span>
                    }
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 leading-snug truncate">{ing.name}</p>
                  <p className="text-[11px] text-neutral-400 leading-none mt-0.5">
                    {scaleQty(ing.qty, portions) || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Ajouter aux courses */}
          <button
            onClick={handleAddToCourses}
            className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #001DC1, #2B50F0)', boxShadow: '0 4px 16px rgba(0,29,193,0.22)' }}
          >
            <IcoCart />
            Ajouter à la liste de courses
          </button>
        </div>
      )}

      {/* ── ÉTAPES ── */}
      {hasSteps && (
        <div className="mb-6">
          <h3 className="text-[17px] font-bold text-neutral-900 tracking-[-0.02em] mb-4">Étapes</h3>
          <div className="space-y-3">
            {recipe.steps!.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 bg-white rounded-2xl px-4 py-3.5"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <div className="w-6 h-6 rounded-full bg-[#001DC1] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-white">{i + 1}</span>
                </div>
                <p className="text-[13px] text-neutral-700 font-medium leading-relaxed flex-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── NOTES PERSONNELLES ── */}
      <div className="mb-6">
        <h3 className="text-[17px] font-bold text-neutral-900 tracking-[-0.02em] mb-3">Notes personnelles</h3>
        <textarea
          value={localNotes || recipe.notes || ''}
          onChange={(e) => {
            setLocalNotes(e.target.value)
            updateRecipe(recipe.id, { notes: e.target.value })
          }}
          placeholder="Ajoutez vos remarques, astuces ou modifications..."
          rows={4}
          className="w-full bg-white rounded-2xl px-4 py-3.5 text-[13px] font-medium text-neutral-700 placeholder:text-neutral-300 outline-none resize-none leading-relaxed"
          style={{
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            WebkitUserSelect: 'text',
            userSelect: 'text',
          }}
        />
      </div>

      {/* ── ACTIONS SECONDAIRES ── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => openSheet({ sheet: 'edit-recipe', recipeContext: recipe })}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-semibold text-neutral-500 bg-neutral-100 active:scale-95 transition-transform"
        >
          <IcoPen /> Modifier
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform"
          style={deleteConfirm
            ? { background: '#FDE8F0', color: '#C0304A' }
            : { background: '#F3F4F6', color: '#9CA3AF' }
          }
        >
          <IcoTrash /> {deleteConfirm ? 'Confirmer ?' : 'Supprimer'}
        </button>
      </div>

      <div className="h-2" />
    </BottomSheet>
  )
}

