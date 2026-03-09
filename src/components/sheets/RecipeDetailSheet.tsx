import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

function scaleQty(qty: string, factor: number): string {
  if (!qty || factor === 1) return qty
  const match = qty.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
  if (!match) return qty
  const num = parseFloat(match[1].replace(',', '.'))
  const unit = match[2].trim()
  const scaled = Math.round(num * factor * 10) / 10
  return unit ? `${scaled} ${unit}` : `${scaled}`
}

// ── Icônes SVG ──
const IcoHeart     = ({ filled, className }: { filled?: boolean; className?: string }) => filled
  ? <svg className={className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  : <svg className={className ?? 'w-4 h-4'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IcoCalendar  = () => <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoCart      = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const IcoPen       = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
const IcoCopy      = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IcoTrash     = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IcoClock     = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoLightning = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const IcoUsers     = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

const PERIOD_META = {
  pdej: { label: 'Petit-dej', color: '#B8650A', bg: '#FEF3CD' },
  midi: { label: 'Déjeuner',  color: '#D23D2D', bg: '#FADCD7' },
  soir: { label: 'Dîner',     color: '#6E433D', bg: '#F0E6E4' },
} as const

const CAT_META: Record<string, { color: string; bg: string; label: string }> = {
  legumes:  { color: '#2D7A3D', bg: '#E4F0E6', label: 'Légumes' },
  viandes:  { color: '#C03030', bg: '#FDE8E8', label: 'Viandes' },
  cremerie: { color: '#B8860B', bg: '#FEF3CD', label: 'Crèmerie' },
  epicerie: { color: '#D07020', bg: '#FFF0E0', label: 'Épicerie' },
  maison:   { color: '#6B5B95', bg: '#F0ECF5', label: 'Maison' },
}

const TAG_DISPLAY: Record<string, string> = {
  vegetarien: '🌿 Végétarien',
  vegan: '🌱 Vegan',
  'sans-gluten': 'Sans gluten',
  'sans-lactose': 'Sans lactose',
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
  const [portions, setPortions] = useState(2)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activeSection, setActiveSection] = useState<'ingredients' | 'steps'>('ingredients')

  const recipe = sheetState.recipeContext
  if (!recipe) return <BottomSheet name="recipe-detail"><div /></BottomSheet>

  const meta = PERIOD_META[recipe.period]

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

      {/* ── HERO ── */}
      {recipe.photo ? (
        <div className="-mx-5 -mt-5 mb-0 h-[260px] overflow-hidden rounded-t-[28px] relative">
          <img src={recipe.photo} alt={recipe.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)' }} />

          {/* Badges en haut */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {recipe.rapide && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-white/20 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                <IcoLightning /> Rapide
              </span>
            )}
            {recipe.fav && (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-white/20 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                <IcoHeart filled className="w-3 h-3" /> Favori
              </span>
            )}
          </div>

          {/* Titre + méta en bas */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <h2 className="text-[24px] font-black text-white leading-tight mb-3 drop-shadow-lg">
              {recipe.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <IcoClock /> {recipe.time}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {meta.label}
              </span>
              {hasIngredients && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  🧂 {recipe.ingredients!.length} ing.
                </span>
              )}
              {hasSteps && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  📋 {recipe.steps!.length} étapes
                </span>
              )}
              {recipe.tags?.map((t) => (
                <span key={t} className="inline-flex items-center text-[11px] font-bold text-white bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  {TAG_DISPLAY[t] ?? t}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Pas de photo — header card amélioré */
        <div className="relative -mx-5 -mt-5 mb-0 px-5 pt-8 pb-5 rounded-t-[28px]" style={{ background: `linear-gradient(135deg, ${meta.bg}, ${meta.bg}80)` }}>
          <div className="flex items-start gap-4">
            <div className="w-[72px] h-[72px] rounded-[20px] bg-white/70 backdrop-blur flex items-center justify-center text-[36px] flex-shrink-0 shadow-sm border border-white/40">
              {recipe.emoji}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-[22px] font-black text-text1 leading-tight mb-2.5">{recipe.name}</h2>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: meta.color, background: 'rgba(255,255,255,0.6)' }}>
                  <IcoClock /> {recipe.time}
                </span>
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: meta.color, background: 'rgba(255,255,255,0.6)' }}>
                  {meta.label}
                </span>
                {recipe.fav && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C0304A] bg-white/60 px-2.5 py-1 rounded-full">
                    <IcoHeart filled className="w-3 h-3" />
                  </span>
                )}
                {recipe.rapide && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B8650A] bg-white/60 px-2.5 py-1 rounded-full">
                    <IcoLightning />
                  </span>
                )}
                {recipe.tags?.map((t) => (
                  <span key={t} className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: meta.color, background: 'rgba(255,255,255,0.6)' }}>
                    {TAG_DISPLAY[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIONS RAPIDES — grille d'icônes ── */}
      <div className="flex items-center justify-around py-4 -mx-1">
        <ActionButton
          icon={<IcoHeart filled={recipe.fav} className="w-5 h-5" />}
          label="Favori"
          active={recipe.fav}
          activeColor="#C0304A"
          activeBg="#FDE8F0"
          onClick={() => toggleFav(recipe.id)}
        />
        <ActionButton
          icon={<IcoPen />}
          label="Modifier"
          onClick={handleEdit}
        />
        <ActionButton
          icon={<IcoCopy />}
          label="Dupliquer"
          onClick={handleDuplicate}
        />
        {hasIngredients && (
          <ActionButton
            icon={<IcoCart />}
            label="Courses"
            active
            activeColor="#2A5435"
            activeBg="#E4F0E6"
            onClick={handleAddToCourses}
          />
        )}
      </div>

      {/* ── CTA PRINCIPAL ── */}
      <button
        onClick={() => openSheet({ sheet: 'pick-day', pickDayContext: { recipe } })}
        className="group w-full py-[15px] mb-5 rounded-2xl text-white text-[15px] font-extrabold active:scale-[0.97] transition-all flex items-center justify-center gap-2.5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #D23D2D 0%, #A32E20 100%)', boxShadow: '0 6px 24px -4px rgba(210,61,45,0.4)' }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
        <IcoCalendar />
        <span className="relative">Planifier cette recette</span>
      </button>

      {/* ── TABS Ingrédients / Étapes ── */}
      {(hasIngredients || hasSteps) && (
        <>
          <div className="flex bg-sep/60 rounded-xl p-1 mb-4">
            {hasIngredients && (
              <button
                onClick={() => setActiveSection('ingredients')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[13px] font-extrabold transition-all',
                  activeSection === 'ingredients'
                    ? 'bg-card text-text1 shadow-sm'
                    : 'text-muted',
                )}
              >
                🧂 Ingrédients{recipe.ingredients ? ` (${recipe.ingredients.length})` : ''}
              </button>
            )}
            {hasSteps && (
              <button
                onClick={() => setActiveSection('steps')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-[13px] font-extrabold transition-all',
                  activeSection === 'steps'
                    ? 'bg-card text-text1 shadow-sm'
                    : 'text-muted',
                )}
              >
                📋 Étapes{recipe.steps ? ` (${recipe.steps.length})` : ''}
              </button>
            )}
          </div>

          {/* ── INGRÉDIENTS ── */}
          {activeSection === 'ingredients' && hasIngredients && (
            <div className="mb-5">
              {/* Sélecteur de portions */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-muted">
                  <IcoUsers />
                  <span>Portions</span>
                </div>
                <div className="flex items-center bg-sep rounded-full overflow-hidden">
                  <button
                    onClick={() => setPortions((p) => Math.max(1, p - 1))}
                    className="w-9 h-9 flex items-center justify-center text-text2 font-extrabold text-base active:bg-border transition-colors"
                  >−</button>
                  <span className="text-[13px] font-extrabold text-text1 px-1 min-w-[48px] text-center tabular-nums">{portions}</span>
                  <button
                    onClick={() => setPortions((p) => Math.min(20, p + 1))}
                    className="w-9 h-9 flex items-center justify-center text-text2 font-extrabold text-base active:bg-border transition-colors"
                  >+</button>
                </div>
              </div>

              {/* Liste d'ingrédients — cards */}
              <div className="space-y-2">
                {recipe.ingredients!.map((ing, i) => {
                  const cat = CAT_META[ing.category] ?? { color: '#888', bg: '#f0f0f0', label: '' }
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-card rounded-xl px-3.5 py-3 border-[1.5px] border-border"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-text1 leading-snug">{ing.name}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: cat.color }}>{cat.label}</p>
                      </div>
                      <span
                        className="text-[12px] font-extrabold px-3 py-1 rounded-full shrink-0"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {scaleQty(ing.qty, portions / 2) || '—'}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Bouton ajouter aux courses */}
              <button
                onClick={handleAddToCourses}
                className="w-full mt-3 py-3 rounded-xl text-[13px] font-extrabold active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                style={{ background: '#E4F0E6', color: '#2A5435' }}
              >
                <IcoCart />
                Ajouter tout aux courses ({portions} pers.)
              </button>
            </div>
          )}

          {/* ── ÉTAPES ── */}
          {activeSection === 'steps' && hasSteps && (
            <div className="mb-5">
              <div className="space-y-0">
                {recipe.steps!.map((step, i) => {
                  const isLast = i === recipe.steps!.length - 1
                  return (
                    <div key={i} className="flex gap-3.5 relative">
                      {!isLast && (
                        <div className="absolute left-[15px] top-[36px] bottom-0 w-[2px] bg-border" />
                      )}
                      <div className="flex-shrink-0 z-10">
                        <div
                          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[12px] font-black text-white"
                          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` }}
                        >
                          {i + 1}
                        </div>
                      </div>
                      <div className={cn('flex-1 pb-1', !isLast && 'pb-5')}>
                        <div className="bg-card rounded-xl px-3.5 py-3 border-[1.5px] border-border">
                          <p className="text-[13px] text-text1 font-semibold leading-relaxed">{step}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── NOTES & RATING ── */}
      <div className="mb-5">
        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-bold text-muted">Note :</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateRecipe(recipe.id, { rating: recipe.rating === star ? undefined : star })}
                className="active:scale-110 transition-transform"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={(recipe.rating ?? 0) >= star ? '#F5C065' : 'none'} stroke={(recipe.rating ?? 0) >= star ? '#F5C065' : '#ccc'} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div className="bg-card rounded-xl px-3.5 py-3 border-[1.5px] border-border">
            <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-1.5">Notes</p>
            <p className="text-[13px] text-text1 font-semibold leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
          </div>
        )}
      </div>

      {/* ── SUPPRIMER ── */}
      <button
        onClick={handleDelete}
        className={cn(
          'w-full py-3.5 rounded-2xl text-[13px] font-extrabold active:scale-[0.97] transition-all flex items-center justify-center gap-2 border-[1.5px]',
          deleteConfirm
            ? 'bg-terra text-white border-terra'
            : 'bg-transparent text-[#C0304A] border-[#FBBDCA]',
        )}
      >
        <IcoTrash />
        {deleteConfirm ? 'Confirmer la suppression ?' : 'Supprimer cette recette'}
      </button>
    </BottomSheet>
  )
}

/* ── Action Button composant utilitaire ── */
function ActionButton({ icon, label, active, activeColor, activeBg, onClick }: {
  icon: React.ReactNode
  label: string
  active?: boolean
  activeColor?: string
  activeBg?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
    >
      <div
        className={cn(
          'w-11 h-11 rounded-[14px] flex items-center justify-center transition-colors',
          active ? '' : 'bg-sep text-muted',
        )}
        style={active ? { background: activeBg, color: activeColor } : undefined}
      >
        {icon}
      </div>
      <span className="text-[10px] font-bold text-muted">{label}</span>
    </button>
  )
}
