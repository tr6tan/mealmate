import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/lib/toast'
import FoodSticker from '@/components/ui/FoodSticker'
import { scaleQty } from '@/lib/utils'

/**
 * Fiche de recette.
 *
 * Mise en page empruntée aux livres de cuisine plutôt qu'aux formulaires :
 * photo pleine largeur, titre posé dessus, ingrédients en colonnes alignées
 * séparées par des filets, étapes numérotées en gros chiffres clairs. Les
 * cartes blanches empilées d'une version à l'autre écrasaient la hiérarchie :
 * un ingrédient, une étape et un bouton avaient tous le même poids visuel.
 */

const IcoBack = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
)
const IcoHeart = ({ filled }: { filled?: boolean }) =>
  filled ? (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  ) : (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
  )
const IcoCookHat = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 19v-3M10 19v-3M14 19v-3M18 19v-3M8 11V9M16 11V9M12 11V9M2 19h20" /><path d="M6.73 7a8 8 0 0 1 10.54 0M12 2a4 4 0 0 0-4 4M16 6a4 4 0 0 0-4-4" /><path d="M4 11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9H4v2z" /></svg>
)
const IcoCart = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
)
const IcoPen = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
)
const IcoCopy = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
)
const IcoTrash = () => (
  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
)

/** Teinte de fond quand la recette n'a pas de photo, selon le moment du repas. */
const TEINTE = {
  pdej: 'rgb(var(--c-morning) / 0.22)',
  midi: 'rgb(var(--c-terra) / 0.12)',
  soir: 'rgb(var(--c-evening) / 0.18)',
} as const

const TAGS: Record<string, string> = {
  vegetarien: 'Végétarien',
  vegan: 'Vegan',
  'sans-gluten': 'Sans gluten',
  'sans-lactose': 'Sans lactose',
}

export default function RecipeDetailSheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const toggleFav = useAppStore((s) => s.toggleFav)
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const deleteRecipe = useAppStore((s) => s.deleteRecipe)
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe)
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const openSheet = useAppStore((s) => s.openSheet)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const photos = useAppStore((s) => s.photos)
  const personnes = useAppStore((s) => s.settings.personnes)

  const [portions, setPortions] = useState(personnes)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [localNotes, setLocalNotes] = useState('')
  // Cf. RecipeCard : une URL distante morte affichait une image cassée.
  const [photoCassee, setPhotoCassee] = useState(false)

  const recipe = sheetState.recipeContext
  if (!recipe) return <BottomSheet name="recipe-detail"><div /></BottomSheet>

  const photo = photoCassee ? undefined : (photos[recipe.id] ?? recipe.photo)
  const ingredients = recipe.ingredients ?? []
  const steps = recipe.steps ?? []

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
    if (!ingredients.length) return
    ingredients.forEach((ing) => {
      addShoppingItem({
        name: ing.name,
        qty: scaleQty(ing.qty, portions),
        category: ing.category,
        checked: false,
      })
    })
    showToast(`${ingredients.length} ingrédients ajoutés`)
  }

  return (
    <BottomSheet name="recipe-detail" className="!px-0 !pt-0">
      {/* ── Photo pleine largeur, titre posé dessus ─────────────────────── */}
      <header className="relative">
        <div className="relative h-[240px] overflow-hidden rounded-t-[28px]">
          {photo ? (
            <img
              src={photo}
              alt=""
              onError={() => setPhotoCassee(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: TEINTE[recipe.period] ?? TEINTE.midi }}
            >
              <FoodSticker
                name={recipe.name}
                size={130}
                fallback={<span className="text-[90px] leading-none">{recipe.emoji}</span>}
              />
            </div>
          )}

          {/* Voile sombre : le titre doit rester lisible sur n'importe quelle photo */}
          <div
            className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 8%, rgba(0,0,0,0.55) 40%, transparent)' }}
          />

          <div className="absolute inset-x-0 bottom-0 p-5">
            <h2 className="text-white text-[30px] font-bold leading-[1.08] tracking-[-0.03em] drop-shadow-sm">
              {recipe.name}
            </h2>
            <p className="mt-2 text-white/85 text-[11px] font-bold tracking-[0.1em] uppercase">
              {recipe.time}
              {recipe.rapide && ' · Rapide'}
              {ingredients.length > 0 && ` · ${ingredients.length} ingrédients`}
            </p>
          </div>
        </div>

        {/* Commandes en surimpression, sur pastille sombre pour rester visibles */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <button
            onClick={closeSheet}
            aria-label="Fermer"
            className="w-10 h-10 rounded-full bg-black/35 backdrop-blur text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <IcoBack />
          </button>
          <button
            onClick={() => toggleFav(recipe.id)}
            aria-label={recipe.fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={recipe.fav}
            className="w-10 h-10 rounded-full bg-black/35 backdrop-blur flex items-center justify-center active:scale-90 transition-transform"
            style={{ color: recipe.fav ? '#FF6B8A' : '#fff' }}
          >
            <IcoHeart filled={recipe.fav} />
          </button>
        </div>
      </header>

      <div className="px-5">
        {/* ── Régime + appréciation ─────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 py-4 border-b border-sep">
          <div className="flex flex-wrap gap-1.5">
            {(recipe.tags ?? []).map((t) => (
              <span key={t} className="text-[11px] font-semibold text-text2 bg-fill/60 border border-border rounded-full px-2.5 py-1">
                {TAGS[t] ?? t}
              </span>
            ))}
          </div>
          <div className="flex gap-0.5 flex-shrink-0" role="group" aria-label="Note">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateRecipe(recipe.id, { rating: recipe.rating === star ? undefined : star })}
                aria-label={`${star} sur 5`}
                aria-pressed={(recipe.rating ?? 0) >= star}
                className="p-0.5 active:scale-110 transition-transform"
              >
                <svg
                  className="w-[18px] h-[18px]"
                  viewBox="0 0 24 24"
                  fill={(recipe.rating ?? 0) >= star ? 'rgb(var(--c-morning))' : 'none'}
                  stroke={(recipe.rating ?? 0) >= star ? 'rgb(var(--c-morning))' : 'rgb(var(--c-border))'}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* ── Ingrédients ───────────────────────────────────────────────── */}
        {ingredients.length > 0 && (
          <section className="pt-6">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-[19px] font-bold text-text1 tracking-[-0.02em]">Ingrédients</h3>
              <div className="flex items-center gap-1 bg-fill/60 border border-border rounded-full p-0.5">
                {([2, 4, 6] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPortions(p)}
                    aria-label={`${p} personnes`}
                    aria-pressed={portions === p}
                    className={`w-8 h-8 rounded-full text-[12px] font-bold transition-colors ${
                      portions === p ? 'bg-terra text-white' : 'text-text2'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[12px] text-muted mb-3">pour {portions} personnes</p>

            {/*
              Liste en colonnes alignées, séparées par des filets : l'œil suit
              une ligne du nom vers la quantité, comme dans un livre de
              cuisine. Une carte par ingrédient hachait cette lecture.
            */}
            <ul className="mb-5">
              {ingredients.map((ing, i) => (
                <li
                  key={`${ing.name}-${i}`}
                  className="flex items-center gap-3 py-2.5 border-b border-sep/70 last:border-0"
                >
                  <FoodSticker name={ing.name} size={26} shadow={false} fallback={null} />
                  <span className="flex-1 text-[15px] text-text1 leading-snug">{ing.name}</span>
                  <span className="text-[14px] font-semibold text-muted tabular-nums flex-shrink-0">
                    {scaleQty(ing.qty, portions)}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleAddToCourses}
              className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-2xl border border-border bg-fill/50 text-[14px] font-semibold text-text1 active:scale-[0.98] transition-transform"
            >
              <IcoCart />
              Ajouter à la liste de courses
            </button>
          </section>
        )}

        {/* ── Étapes ────────────────────────────────────────────────────── */}
        {steps.length > 0 && (
          <section className="pt-7">
            <h3 className="text-[19px] font-bold text-text1 tracking-[-0.02em] mb-4">Préparation</h3>
            <ol className="flex flex-col gap-5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  {/* Le numéro sert de repère visuel, pas de pastille colorée */}
                  <span
                    className="text-[30px] font-bold leading-none tabular-nums flex-shrink-0 w-8 text-right"
                    style={{ color: 'rgb(var(--c-terra) / 0.28)' }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <p className="text-[15px] text-text1 leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <section className="pt-7">
          <h3 className="text-[19px] font-bold text-text1 tracking-[-0.02em] mb-2">Notes</h3>
          <textarea
            value={localNotes || recipe.notes || ''}
            onChange={(e) => {
              setLocalNotes(e.target.value)
              updateRecipe(recipe.id, { notes: e.target.value || undefined })
            }}
            placeholder="Une astuce, une variante, ce qui a marché…"
            rows={3}
            className="w-full bg-transparent border-b border-sep focus:border-terra outline-none resize-none text-[15px] text-text1 placeholder:text-muted leading-relaxed pb-2 transition-colors"
          />
        </section>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-7 pb-2">
          <button
            onClick={() => openSheet({ sheet: 'cook-mode', recipeContext: recipe })}
            className="btn-primary flex-1 min-h-[52px]"
          >
            <IcoCookHat />
            Cuisiner
          </button>
          <button
            onClick={() => openSheet({ sheet: 'edit-recipe', recipeContext: recipe })}
            aria-label="Modifier la recette"
            className="w-12 h-12 rounded-2xl border border-border bg-fill/50 text-text2 flex items-center justify-center active:scale-95 transition-transform"
          >
            <IcoPen />
          </button>
          {/*
            Partir d'une recette existante est le geste le plus fréquent après
            la création. L'action vivait dans le store, testée, mais plus aucun
            bouton n'y menait.
          */}
          <button
            onClick={() => {
              duplicateRecipe(recipe.id)
              closeSheet()
              showToast(`${recipe.name} dupliquée`)
            }}
            aria-label="Dupliquer la recette"
            className="w-12 h-12 rounded-2xl border border-border bg-fill/50 text-text2 flex items-center justify-center active:scale-95 transition-transform"
          >
            <IcoCopy />
          </button>
          <button
            onClick={handleDelete}
            aria-label={deleteConfirm ? 'Confirmer la suppression' : 'Supprimer la recette'}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center active:scale-95 transition-all"
            style={
              deleteConfirm
                ? { background: 'rgb(var(--c-danger))', borderColor: 'rgb(var(--c-danger))', color: '#fff' }
                : { borderColor: 'rgb(var(--c-border))', color: 'rgb(var(--c-muted))' }
            }
          >
            <IcoTrash />
          </button>
        </div>
        {deleteConfirm && (
          <p className="text-[12px] text-danger font-semibold text-right pb-2" role="status">
            Appuyez à nouveau pour supprimer
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
