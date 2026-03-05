import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'

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
const IcoHeart     = ({ filled }: { filled?: boolean }) => filled
  ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoCalendar  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoCart      = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const IcoPen       = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
const IcoCopy      = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IcoTrash     = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IcoClock     = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoLightning = () => <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>

const PERIOD_META = {
  pdej: { label: 'Petit-dej', cls: 'text-[#B8650A] bg-[#FEF3CD]', circleCls: 'bg-[#FEF3CD]' },
  midi: { label: 'Déjeuner',  cls: 'text-terra bg-terra-light',   circleCls: 'bg-terra-light' },
  soir: { label: 'Dîner',     cls: 'text-text2 bg-sep',            circleCls: 'bg-sep' },
} as const

const CATEGORY_DOT: Record<string, string> = {
  legumes:  '#5A9E68',
  viandes:  '#D43D3D',
  cremerie: '#E8B84B',
  epicerie: '#E89044',
  maison:   '#8E7BB5',
}

export default function RecipeDetailSheet() {
  const sheetState      = useAppStore((s) => s.sheetState)
  const toggleFav       = useAppStore((s) => s.toggleFav)
  const deleteRecipe    = useAppStore((s) => s.deleteRecipe)
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe)
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const openSheet       = useAppStore((s) => s.openSheet)
  const closeSheet      = useAppStore((s) => s.closeSheet)
  const [portions, setPortions] = useState(2)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

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

  const handleDuplicate = () => {
    duplicateRecipe(recipe.id)
    closeSheet()
    showToast(`« ${recipe.name} » dupliquée !`)
  }
  const handleEdit = () => openSheet({ sheet: 'edit-recipe', recipeContext: recipe })
  const handleAddToCourses = () => {
    if (!recipe.ingredients?.length) return
    const factor = portions / 2
    recipe.ingredients.forEach((ing) => {
      addShoppingItem({ name: ing.name, qty: scaleQty(ing.qty, factor), category: ing.category, checked: false })
    })
    showToast(`${recipe.ingredients.length} ingrédient${recipe.ingredients.length > 1 ? 's' : ''} ajouté${recipe.ingredients.length > 1 ? 's' : ''} aux courses !`)
  }

  const hasIngredients = !!recipe.ingredients?.length
  const hasSteps       = !!recipe.steps?.length

  return (
    <BottomSheet name="recipe-detail">

      {/* ── HERO PHOTO ── */}
      {recipe.photo ? (
        <div className="-mx-5 -mt-5 mb-5 h-[240px] overflow-hidden rounded-t-[28px] relative">
          <img src={recipe.photo} alt={recipe.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          {/* Badges haut droite */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
            {recipe.fav && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <IcoHeart filled /> Favori
              </span>
            )}
            {recipe.rapide && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <IcoLightning /> Rapide
              </span>
            )}
          </div>
          {/* Titre + temps en bas */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
            <h2 className="text-[22px] font-extrabold text-white leading-tight mb-2 drop-shadow">
              {recipe.name}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <IcoClock /> {recipe.time}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {PERIOD_META[recipe.period].label}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Pas de photo — en-tête sobre */
        <div className="flex items-center gap-3.5 mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl ${PERIOD_META[recipe.period].circleCls}`}>
            {recipe.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[20px] font-extrabold text-text1 leading-tight mb-2">{recipe.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-terra bg-terra-light px-2.5 py-1 rounded-full">
                <IcoClock /> {recipe.time}
              </span>
              <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full ${PERIOD_META[recipe.period].cls}`}>
                {PERIOD_META[recipe.period].label}
              </span>
              {recipe.fav && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C0304A] bg-[#FDE8F0] px-2.5 py-1 rounded-full">
                  <IcoHeart filled /> Favori
                </span>
              )}
              {recipe.rapide && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#31603D] bg-[#E4F0E6] px-2.5 py-1 rounded-full">
                  <IcoLightning /> Rapide
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA PRINCIPAL ── */}
      <button
        onClick={() => openSheet({ sheet: 'pick-day', pickDayContext: { recipe } })}
        className="w-full py-[15px] mb-2 rounded-2xl bg-terra text-white text-[15px] font-extrabold active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
        style={{ boxShadow: '0 6px 20px rgba(210,61,45,0.28)' }}
      >
        <IcoCalendar />
        Planifier cette recette
      </button>

      {/* ── ACTIONS SECONDAIRES ── */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => toggleFav(recipe.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[12px] font-extrabold transition-all active:scale-[0.95] ${
            recipe.fav ? 'bg-[#FDE8F0] text-[#C0304A]' : 'bg-sep text-text2'
          }`}
        >
          <IcoHeart filled={recipe.fav} />
          Favori
        </button>
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-sep text-text2 text-[12px] font-extrabold active:scale-[0.95] transition-all"
        >
          <IcoPen />
          Modifier
        </button>
        <button
          onClick={handleDuplicate}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-sep text-text2 text-[12px] font-extrabold active:scale-[0.95] transition-all"
        >
          <IcoCopy />
          Dupliquer
        </button>
      </div>

      {/* ── COURSES (séparé, proéminent) ── */}
      {hasIngredients && (
        <button
          onClick={handleAddToCourses}
          className="w-full py-3.5 mb-6 rounded-2xl bg-[#E4F0E6] text-[#2A5435] text-[13px] font-extrabold active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '0 2px 10px rgba(49,96,61,0.13)' }}
        >
          <IcoCart />
          Ajouter aux courses
        </button>
      )}

      {/* ── INGRÉDIENTS ── */}
      {hasIngredients && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted">Ingrédients</p>
            <div className="flex items-center bg-sep rounded-full overflow-hidden">
              <button
                onClick={() => setPortions((p) => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center text-text2 font-extrabold text-base active:bg-border transition-colors"
              >−</button>
              <span className="text-[12px] font-extrabold text-text1 px-1 min-w-[56px] text-center">{portions} pers.</span>
              <button
                onClick={() => setPortions((p) => Math.min(20, p + 1))}
                className="w-8 h-8 flex items-center justify-center text-text2 font-extrabold text-base active:bg-border transition-colors"
              >+</button>
            </div>
          </div>
          <div className="mb-6 rounded-2xl overflow-hidden border-[1.5px] border-border">
            {recipe.ingredients!.map((ing, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i !== recipe.ingredients!.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_DOT[ing.category] ?? '#aaa' }}
                />
                <span className="text-[13px] font-semibold text-text1 flex-1">{ing.name}</span>
                <span className="text-[12px] font-extrabold text-terra bg-terra-light px-2.5 py-0.5 rounded-full shrink-0">
                  {scaleQty(ing.qty, portions / 2) || '—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ÉTAPES ── */}
      {hasSteps && (
        <>
          <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted mb-4">Préparation</p>
          <div className="mb-6">
            {recipe.steps!.map((step, i) => {
              const isLast = i === recipe.steps!.length - 1
              return (
                <div key={i} className="flex gap-4 relative">
                  {!isLast && (
                    <div className="absolute left-[11px] top-[26px] bottom-0 w-[2px] bg-border" />
                  )}
                  <div className="flex-shrink-0 z-10">
                    <span className="w-6 h-6 rounded-full bg-terra text-white text-[11px] font-extrabold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <div className={`flex-1 ${!isLast ? 'pb-5' : ''}`}>
                    <p className="text-[13px] text-text1 font-semibold leading-relaxed pt-0.5">{step}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── SUPPRIMER ── */}
      <button
        onClick={handleDelete}
        className="w-full py-3.5 rounded-2xl border-[1.5px] text-[13px] font-extrabold active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        style={deleteConfirm
          ? { background: '#FDE8F0', borderColor: '#C0304A', color: '#C0304A' }
          : { background: 'transparent', borderColor: '#FBBDCA', color: '#C0304A' }}
      >
        <IcoTrash />
        {deleteConfirm ? 'Confirmer la suppression ?' : 'Supprimer cette recette'}
      </button>
    </BottomSheet>
  )
}
