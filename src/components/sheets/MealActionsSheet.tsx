import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { haptic, scaleQty } from '@/lib/utils'
import type { Period, SlotKey } from '@/types'
import { showToast } from '@/lib/toast'

function periodFromSlot(slotKey: SlotKey): Period {
  if (slotKey.startsWith('pdej')) return 'pdej'
  if (slotKey.startsWith('midi')) return 'midi'
  return 'soir'
}

const TAG_DISPLAY: Record<string, string> = {
  vegetarien: '🌿 Végétarien',
  vegan: '🌱 Vegan',
  'sans-gluten': 'Sans gluten',
  'sans-lactose': 'Sans lactose',
}

const CAT_META: Record<string, { color: string; bg: string }> = {
  legumes:  { color: '#2D7A3D', bg: '#E4F0E6' },
  viandes:  { color: '#C03030', bg: '#FDE8E8' },
  cremerie: { color: '#B8860B', bg: '#FEF3CD' },
  epicerie: { color: '#D07020', bg: '#FFF0E0' },
  maison:   { color: '#6B5B95', bg: '#F0ECF5' },
  surgeles: { color: '#1a7ec8', bg: '#EBF4FF' },
}

export default function MealActionsSheet() {
  const sheetState      = useAppStore((s) => s.sheetState)
  const setMeal         = useAppStore((s) => s.setMeal)
  const openSheet       = useAppStore((s) => s.openSheet)
  const closeSheet      = useAppStore((s) => s.closeSheet)
  const toggleFav       = useAppStore((s) => s.toggleFav)
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const recipes         = useAppStore((s) => s.recipes)
  const personnes       = useAppStore((s) => s.settings.personnes)

  const [portions, setPortions] = useState(personnes)

  const ctx = sheetState.actionContext
  if (!ctx) return <BottomSheet name="meal-actions"><div /></BottomSheet>

  const { dayIdx, slotKey, meal } = ctx
  const period = periodFromSlot(slotKey)
  const recipe = recipes.find((r) => r.name === meal.name)

  const hasIngredients = !!recipe?.ingredients?.length

  const handleRemove = () => {
    haptic([10, 30, 10])
    const snapshot = meal
    setMeal(dayIdx, slotKey, null)
    closeSheet()
    showToast('Repas retiré', {
      action: { label: 'Annuler', onClick: () => setMeal(dayIdx, slotKey, snapshot) },
    })
  }

  const handleChange = () => {
    openSheet({ sheet: 'add-meal', addMealPeriod: period, mealContext: { dayIdx, slotKey } })
  }

  const handleMove = () => {
    openSheet({
      sheet: 'pick-day',
      pickDayContext: {
        recipe: {
          id: recipe?.id ?? '',
          name: meal.name, emoji: meal.emoji, time: meal.time, fav: meal.fav,
          period, rapide: recipe?.rapide ?? false,
        },
        moveFrom: { dayIdx, slotKey },
      },
    })
  }

  const handleAddToCourses = () => {
    if (!recipe?.ingredients?.length) return
    recipe.ingredients.forEach((ing) => {
      addShoppingItem({ name: ing.name, qty: scaleQty(ing.qty, portions, recipe?.portions), category: ing.category, checked: false })
    })
    showToast(`${recipe.ingredients.length} ingrédients ajoutés aux courses !`)
  }

  return (
    <BottomSheet name="meal-actions">

      {/* ── Hero ── */}
      {(meal.isRestaurant === true || meal.name === 'Restaurant') ? (
        /* Hero restaurant — version carte bleue immersive */
        <div
          className="relative -mx-5 -mt-5 mb-5 px-5 pt-8 pb-6 rounded-t-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(155deg, #001080 0%, #0022CC 40%, #2B50F0 60%, #0022CC 78%, #001080 100%)',
            boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.20)',
          }}
        >
          {/* reflet brillant diagonal */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 42%)', borderRadius: 'inherit' }} />
          {/* ligne lumière haute */}
          <div className="absolute top-0 left-6 right-6 h-px pointer-events-none" style={{ background: 'rgba(255,255,255,0.28)' }} />

          <div className="flex items-center gap-4">
            <div
              className="w-[68px] h-[68px] rounded-[20px] flex items-center justify-center text-[36px] leading-none flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.20)' }}
            >
              🍽️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>On mange dehors</p>
              <h2 className="text-[22px] font-black text-white leading-tight truncate">
                {meal.name && meal.name !== 'Restaurant' ? meal.name : 'Restaurant'}
              </h2>
              <div className="mt-2 flex gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.85)' }}
                >
                  🌆 Soirée / Déjeuner
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Hero standard */
        <div className="relative -mx-5 -mt-5 mb-5 px-5 pt-7 pb-5 rounded-t-[28px] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(0,24,168,0.07), rgba(0,24,168,0.03))' }}>

          <div className="flex items-start gap-4">
            <div
              className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center text-[38px] leading-none flex-shrink-0"
              style={{ background: 'rgb(var(--c-terra))', boxShadow: '0 8px 24px rgba(0,24,168,0.35)' }}
            >
              {meal.emoji || '🍽'}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-[20px] font-black text-text1 leading-tight mb-2">{meal.name}</h2>

              <div className="flex flex-wrap gap-1.5">
                {meal.time && meal.time !== '?' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-fill/70 backdrop-blur text-text2">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {meal.time}
                  </span>
                )}
                {recipe?.rapide && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                    ⚡ Rapide
                  </span>
                )}
                {recipe?.tags?.map((t) => (
                  <span key={t} className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-fill/70 backdrop-blur text-text2">
                    {TAG_DISPLAY[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {recipe && (
            <button
              onClick={() => toggleFav(recipe.id)}
              className="absolute top-4 right-5 w-9 h-9 rounded-full bg-fill/60 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={meal.fav ? 'rgb(var(--c-terra))' : 'none'} stroke={meal.fav ? 'rgb(var(--c-terra))' : 'rgb(var(--c-muted))'} strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Ingrédients condensés ── */}
      {hasIngredients && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-text2">
              🧂 {recipe!.ingredients!.length} ingrédients
            </p>
            {/* Portions stepper */}
            <div className="flex items-center gap-1 bg-fill/60 rounded-full px-1">
              <button onClick={() => setPortions(p => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center text-text2 font-black text-base active:scale-90 transition-transform">−</button>
              <span className="text-[13px] font-bold text-text1 min-w-[28px] text-center">{portions}</span>
              <button onClick={() => setPortions(p => Math.min(20, p + 1))}
                className="w-7 h-7 flex items-center justify-center text-text2 font-black text-base active:scale-90 transition-transform">+</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {recipe!.ingredients!.slice(0, 6).map((ing, i) => {
              const cat = CAT_META[ing.category] ?? { color: '#888', bg: '#f0f0f0' }
              return (
                <div key={i} className="rounded-2xl p-2.5 text-center" style={{ background: cat.bg }}>
                  <p className="text-[12px] font-semibold leading-tight mb-0.5 text-text2">{ing.name}</p>
                  <p className="text-[11px] font-bold" style={{ color: cat.color }}>{scaleQty(ing.qty, portions, recipe?.portions) || '—'}</p>
                </div>
              )
            })}
          </div>
          {recipe!.ingredients!.length > 6 && (
            <p className="text-[11px] text-muted text-center mb-2">+ {recipe!.ingredients!.length - 6} autres ingrédients</p>
          )}
          <button
            onClick={handleAddToCourses}
            className="w-full py-2.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            style={{ background: '#E4F0E6', color: '#2A5435' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Ajouter aux courses ({portions} pers.)
          </button>
        </div>
      )}

      {/* ── Bouton voir fiche complète ── */}
      {recipe && (
        <button
          onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
          className="btn-primary w-full mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Voir la fiche recette
        </button>
      )}

      {/* ── Actions secondaires ── */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleChange}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold active:scale-[0.97] transition-transform"
          style={{ background: 'rgba(0,0,0,0.05)', color: '#374151' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          Changer
        </button>
        <button
          onClick={handleMove}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold active:scale-[0.97] transition-transform"
          style={{ background: 'rgba(0,0,0,0.05)', color: '#374151' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Déplacer
        </button>
      </div>

      <button
        onClick={handleRemove}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-bold active:scale-[0.97] transition-transform"
        style={{ background: '#FDE8E8', color: '#C03030' }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        Retirer du planning
      </button>

    </BottomSheet>
  )
}
