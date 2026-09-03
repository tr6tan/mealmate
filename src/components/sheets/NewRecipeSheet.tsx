import { useEffect, useRef, useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/lib/toast'
import { BASE_PORTIONS } from '@/lib/utils'
import { getStickerSlug } from '@/lib/stickers'
import RecipeFormFields from './RecipeFormFields'
import {
  creerSetChamp,
  nettoyerIngredients,
  type RecipeFormValues,
} from './recipeFormOptions'
import { ErreurImport, lirePhoto, messageDErreur, versFormulaire } from '@/lib/importPhoto'

/**
 * Création d'une recette.
 *
 * L'écran offrait trois chemins concurrents, texte libre, formulaire
 * détaillé, import par URL, présentés en onglets. Trois façons de faire la
 * même chose, dont il fallait deviner laquelle convenait, et trois fois plus
 * de code à maintenir. Il n'en reste qu'un : on remplit la fiche.
 *
 * Le nom d'amorce et le créneau de retour viennent du sélecteur de la semaine,
 * pour créer une recette sans quitter la planification.
 */

const VIDE: RecipeFormValues = {
  name: '',
  time: '30 min',
  period: 'midi',
  fav: false,
  rapide: false,
  photo: undefined,
  // Pas de ligne vide au départ : la barre d'ajout tient ce rôle, et une
  // ligne sans nom n'invitait qu'à se demander quoi en faire.
  ingredients: [],
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
  const [lecture, setLecture] = useState<'repos' | 'encours'>('repos')
  const [venuDePhoto, setVenuDePhoto] = useState(false)
  const [echecLecture, setEchecLecture] = useState<string | null>(null)
  const champPhoto = useRef<HTMLInputElement>(null)

  const set = creerSetChamp(setValeurs)

  /*
   * Remise à zéro à chaque ouverture, et reprise du nom cherché en vain dans
   * le sélecteur : on continue la saisie là où elle s'est arrêtée plutôt que
   * de repartir d'une page blanche.
   */
  useEffect(() => {
    if (!isOpen) return
    setValeurs({ ...VIDE, name: venue?.nomInitial ?? '' })
    setVenuDePhoto(false)
    setEchecLecture(null)
  }, [isOpen, venue?.nomInitial])

  /**
   * Lit une recette photographiée et remplit le formulaire.
   *
   * Rien n'est enregistré : la personne relit avant de valider. Une quantité
   * mal lue se corrige alors en un geste, au lieu de partir dans la liste de
   * courses sans que personne l'ait vue.
   */
  const importerPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0]
    // Le champ est vidé tout de suite : sans cela, reprendre la même photo
    // après un échec ne déclenche aucun événement.
    e.target.value = ''
    if (!fichier) return

    setLecture('encours')
    setEchecLecture(null)
    try {
      setValeurs(versFormulaire(await lirePhoto(fichier)))
      setVenuDePhoto(true)
    } catch (err) {
      /*
       * L'échec s'affiche dans la feuille et non dans un toast : il porte
       * parfois le message du fournisseur, qu'il faut pouvoir lire en entier
       * et recopier. Un toast de trois secondes ne s'y prête pas.
       */
      setEchecLecture(err instanceof ErreurImport ? err.message : messageDErreur('fournisseur'))
    } finally {
      setLecture('repos')
    }
  }

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

        {/* Importer une photo.
            Placé avant les champs : quand on a la page sous les yeux, on ne
            veut pas la retaper, et l'action doit se voir sans défiler. */}
        <button
          type="button"
          onClick={() => champPhoto.current?.click()}
          disabled={lecture === 'encours'}
          className="w-full h-12 mb-5 rounded-2xl bg-black/[0.045] flex items-center justify-center gap-2 text-[14px] font-semibold text-text1 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {lecture === 'encours' ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-text2/30 border-t-terra animate-spin"
                aria-hidden
              />
              Lecture de la photo…
            </>
          ) : (
            <>
              <svg className="w-[17px] h-[17px] text-text2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Importer depuis une photo
            </>
          )}
        </button>
        <input
          ref={champPhoto}
          type="file"
          accept="image/*"
          /*
           * Pas de `capture` : sur iOS il ouvre l'appareil photo directement
           * et supprime l'accès à la photothèque. Or la moitié des recettes
           * qu'on veut importer sont des captures d'écran déja enregistrées.
           * Sans cet attribut, iOS propose les deux.
           */
          className="hidden"
          onChange={importerPhoto}
        />

        {echecLecture && (
          <div className="-mt-3 mb-5 p-3 rounded-2xl bg-danger-light" role="alert">
            <p className="text-[13px] font-semibold text-danger whitespace-pre-line leading-snug">
              {echecLecture}
            </p>
          </div>
        )}

        {venuDePhoto && (
          <p className="-mt-3 mb-5 text-[13px] text-sage font-semibold">
            Lu depuis une photo. Relis avant d’enregistrer.
          </p>
        )}

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
