import { useEffect, useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/lib/toast'
import { BASE_PORTIONS } from '@/lib/utils'
import { deletePhoto } from '@/lib/photos'
import RecipeFormFields from './RecipeFormFields'
import {
  creerSetChamp,
  nettoyerIngredients,
  type RecipeFormValues,
} from './recipeFormOptions'

/**
 * Modification d'une recette.
 *
 * Les champs communs viennent de `RecipeFormFields`, partagé avec la création.
 * Restent ici les deux champs propres à la modification : les notes et
 * l'appréciation.
 */

const VIDE: RecipeFormValues = {
  name: '',
  time: '',
  period: 'midi',
  fav: false,
  rapide: false,
  photo: undefined,
  ingredients: [],
  steps: [''],
  tags: [],
  portions: BASE_PORTIONS,
}

export default function EditRecipeSheet() {
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const photos = useAppStore((s) => s.photos)
  const sheetState = useAppStore((s) => s.sheetState)

  const recipe = sheetState.sheet === 'edit-recipe' ? sheetState.recipeContext : undefined

  const [valeurs, setValeurs] = useState<RecipeFormValues>(VIDE)
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)

  const set = creerSetChamp(setValeurs)

  // Pré-remplissage à chaque ouverture
  useEffect(() => {
    if (!recipe) return
    setValeurs({
      name: recipe.name,
      time: recipe.time,
      period: recipe.period,
      fav: recipe.fav,
      rapide: recipe.rapide,
      photo: photos[recipe.id] ?? recipe.photo,
      ingredients: recipe.ingredients ?? [],
      steps: recipe.steps?.length ? recipe.steps : [''],
      tags: recipe.tags ?? [],
      portions: recipe.portions ?? BASE_PORTIONS,
    })
    setNotes(recipe.notes ?? '')
    setRating(recipe.rating)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id])

  const handleSave = () => {
    if (!valeurs.name.trim() || !recipe) return

    // La photo vit hors du document foyer : la retirer du formulaire doit
    // aussi la supprimer de la sous-collection, sinon elle réapparaît au
    // prochain snapshot.
    if (!valeurs.photo && photos[recipe.id]) void deletePhoto(recipe.id)

    const etapes = valeurs.steps.map((s) => s.trim()).filter(Boolean)
    const ingredients = nettoyerIngredients(valeurs.ingredients)

    updateRecipe(recipe.id, {
      name: valeurs.name.trim(),
      emoji: recipe.emoji,
      period: valeurs.period,
      time: valeurs.time.trim() || '? min',
      fav: valeurs.fav,
      rapide: valeurs.rapide,
      photo: valeurs.photo,
      steps: etapes.length ? etapes : undefined,
      ingredients: ingredients.length ? ingredients : undefined,
      tags: valeurs.tags.length ? valeurs.tags : undefined,
      // Ne rien écrire quand la recette suit la base : les recettes livrées
      // n'ont pas ce champ, autant ne pas le leur ajouter en les modifiant.
      portions: valeurs.portions === BASE_PORTIONS ? undefined : valeurs.portions,
      notes: notes.trim() || undefined,
      rating,
    })
    closeSheet()
    showToast(`${valeurs.name.trim()} modifiée !`)
  }

  if (!recipe) return <BottomSheet name="edit-recipe"><div /></BottomSheet>

  return (
    <BottomSheet name="edit-recipe" className="max-h-[92dvh]">
      <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[20px] font-extrabold text-text1 tracking-[-0.02em]">
          Modifier la recette
        </h2>
        <button onClick={closeSheet} aria-label="Fermer" className="w-11 h-11 -mr-2.5 flex items-center justify-center text-muted">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <RecipeFormFields valeurs={valeurs} set={set} />

      {/* Notes */}
      <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted mb-2 mt-7">
        Notes personnelles
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Une astuce, une variante…"
        rows={3}
        className="w-full mb-5 bg-transparent border-b border-sep focus:border-terra outline-none resize-none text-[15px] text-text1 placeholder:text-muted leading-relaxed pb-2 transition-colors"
      />

      {/* Appréciation */}
      <p className="text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted mb-2">Appréciation</p>
      <div className="flex gap-1 mb-5" role="group" aria-label="Note">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(rating === star ? undefined : star)}
            aria-label={`${star} sur 5`}
            aria-pressed={(rating ?? 0) >= star}
            className="w-11 h-11 flex items-center justify-center active:scale-110 transition-transform"
          >
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill={(rating ?? 0) >= star ? 'rgb(var(--c-morning))' : 'none'}
              stroke={(rating ?? 0) >= star ? 'rgb(var(--c-morning))' : 'rgb(var(--c-border))'}
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!valeurs.name.trim()}
        className="btn-primary w-full min-h-[52px] disabled:opacity-40"
      >
        Enregistrer
      </button>
      <div className="pb-2" />
      </div>
    </BottomSheet>
  )
}
