import { useEffect, useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/lib/toast'
import { BASE_PORTIONS } from '@/lib/utils'
import { getStickerSlug } from '@/lib/stickers'
import RecipeFormFields from './RecipeFormFields'
import { creerSetChamp,
  nettoyerIngredients, type RecipeFormValues } from './recipeFormOptions'

/**
 * Création d'une recette.
 *
 * L'écran offrait trois chemins concurrents — texte libre, formulaire
 * détaillé, import par URL — présentés en onglets. Trois façons de faire la
 * même chose, dont il fallait deviner laquelle convenait, et trois fois plus
 * de code à maintenir. Il n'en reste qu'un : on remplit la fiche.
 *
 * Le nom d'amorce et le créneau de retour viennent du sélecteur de la semaine,
 * pour créer une recette sans quitter la planification.
 */

const VIDE: RecipeFormValues = {
  name: '',
  time: '30 min',
  timeCustom: false,
  period: 'midi',
  fav: false,
  rapide: false,
  photo: undefined,
  ingredients: [{ name: '', qty: '', category: 'epicerie' }],
  steps: [''],
  tags: [],
  portions: BASE_PORTIONS,
}

export default function NewRecipeSheet() {
  const addRecipe   = useAppStore((s) => s.addRecipe)
  const closeSheet  = useAppStore((s) => s.closeSheet)
  const setMeal     = useAppStore((s) => s.setMeal)
  const sheetState  = useAppStore((s) => s.sheetState)

  const isOpen = sheetState.sheet === 'new-recipe'
  const venue  = sheetState.newRecipeContext

  const [valeurs, setValeurs] = useState<RecipeFormValues>(VIDE)

  const set = creerSetChamp(setValeurs)

  /*
   * Remise à zéro à chaque ouverture, et reprise du nom cherché en vain dans
   * le sélecteur : on continue la saisie là où elle s'est arrêtée plutôt que
   * de repartir d'une page blanche.
   */
  useEffect(() => {
    if (!isOpen) return
    setValeurs({ ...VIDE, name: venue?.nomInitial ?? '' })
  }, [isOpen, venue?.nomInitial])

  const enregistrer = () => {
    const nom = valeurs.name.trim()
    if (!nom) return

    const ingredients = nettoyerIngredients(valeurs.ingredients)
    const etapes = valeurs.steps.map((s) => s.trim()).filter(Boolean)

    addRecipe({
      name: nom,
      // Un sticker existe pour la plupart des plats ; l'emoji ne sert que de
      // repli quand aucun ne correspond.
      emoji: getStickerSlug(nom) ? '' : '🍽',
      period: valeurs.period,
      time: valeurs.time.trim() || '? min',
      fav: valeurs.fav,
      rapide: valeurs.rapide,
      photo: valeurs.photo,
      ingredients: ingredients.length ? ingredients : undefined,
      steps: etapes.length ? etapes : undefined,
      tags: valeurs.tags.length ? valeurs.tags : undefined,
      // Ne rien écrire quand la recette suit la base : les recettes livrées
      // n'ont pas ce champ, autant ne pas le leur ajouter.
      portions: valeurs.portions === BASE_PORTIONS ? undefined : valeurs.portions,
    })

    /*
     * Création lancée depuis la planification : la recette se pose dans le
     * créneau d'où l'on vient. `addRecipe` ne rend pas la recette créée, mais
     * un repas planifié n'en retient que le nom, l'emoji, la durée et le
     * favori.
     */
    const planifier = venue?.planifier
    if (planifier) {
      setMeal(planifier.dayIdx, planifier.slotKey, {
        name: nom,
        emoji: '',
        time: valeurs.time.trim() || '? min',
        fav: valeurs.fav,
      })
    }

    closeSheet()
    showToast(planifier ? `${nom} ajoutée et planifiée !` : `${nom} ajoutée !`)
  }

  const prete = valeurs.name.trim().length > 0

  return (
    <BottomSheet name="new-recipe" className="max-h-[94dvh]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[20px] font-extrabold text-text1 tracking-[-0.02em]">
            Nouvelle recette
          </h2>
          <button
            onClick={closeSheet}
            aria-label="Fermer"
            className="w-11 h-11 -mr-2.5 flex items-center justify-center text-muted"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <p className="text-[13px] text-muted mb-5">
          {venue?.planifier ? 'Elle sera aussitôt mise au menu.' : 'Le nom suffit pour commencer.'}
        </p>

        <RecipeFormFields valeurs={valeurs} set={set} />

        <button
          onClick={enregistrer}
          disabled={!prete}
          className="btn-primary w-full min-h-[52px] mt-7 disabled:opacity-40"
        >
          Ajouter la recette
        </button>
        {!prete && (
          <p className="text-[13px] text-muted text-center mt-2.5">
            Il manque le nom du plat.
          </p>
        )}
        <div className="pb-2" />
      </div>
    </BottomSheet>
  )
}
