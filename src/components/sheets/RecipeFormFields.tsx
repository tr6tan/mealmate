import { useRef } from 'react'
import type { DietaryTag } from '@/types'
import {
  PERIODS,
  TAG_OPTIONS,
  type RecipeFormValues,
  type SetChamp,
} from './recipeFormOptions'
import { PERIOD_LABEL, cn, resizeToBase64 } from '@/lib/utils'
import { DUREE_MAX, DUREE_MIN, dureePrecedente, dureeSuivante, enMinutes, formaterDuree } from '@/lib/duree'
import { devinerPeriode, devinerRegimes } from '@/lib/classerRecette'
import { showToast } from '@/lib/toast'
import StepsEditor from './StepsEditor'
import IngredientsEditor from './IngredientsEditor'

/**
 * Champs communs aux formulaires de création et de modification d'une recette.
 *
 * Champs réglés d'un filet plutôt qu'encadrés : dix champs encadrés empilés
 * font dix rectangles, et on ne voit plus lequel est actif. Le filet ne se
 * remarque qu'au moment où il prend la couleur d'accent.
 *
 * Ce composant ne détient aucun état : les écrans gardent le leur et passent
 * les valeurs avec leur setter, ce qui laisse à chacun ses champs propres
 * (notes et appréciation à la modification).
 */

const LIBELLE = 'text-[11px] font-extrabold tracking-[0.1em] uppercase text-muted mb-2'
/** Champ réglé : un filet sous le texte, qui s'accentue au focus. */
const REGLE =
  'w-full bg-transparent border-b border-sep focus:border-terra outline-none text-text1 placeholder:text-muted transition-colors'
/** Puce de choix : pleine si retenue, fond très léger sinon. */
const PUCE = 'h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors'
const PUCE_OFF = 'bg-black/[0.045] text-text2'

interface Props {
  valeurs: RecipeFormValues
  /** Modifie un champ. Les écrans restent maîtres de leur état. */
  set: SetChamp
}

export default function RecipeFormFields({ valeurs, set }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { name, time, period, fav, rapide, photo, ingredients, steps, tags, portions } = valeurs
  const minutes = enMinutes(time) || 30

  /*
   * Moment du repas et régimes se devinent tant que la personne n'y a pas
   * touché. Le drapeau retient ce choix : sans lui, taper un ingrédient de
   * plus effaçait la correction qu'on venait de faire.
   */
  const periodeProposee = devinerPeriode(name)
  const regimesProposes = devinerRegimes(ingredients, name)
  const periodeAffichee = valeurs.periodChoisie ? period : periodeProposee
  const tagsAffiches = valeurs.tagsChoisis ? tags : regimesProposes

  const toggleTag = (tag: DietaryTag) => {
    const base = tagsAffiches
    set('tags', base.includes(tag) ? base.filter((t) => t !== tag) : [...base, tag])
    set('tagsChoisis', true)
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set('photo', await resizeToBase64(file))
    } catch {
      showToast('Erreur lors du chargement de la photo')
    }
  }

  return (
    <>
      {/* ── Le plat ─────────────────────────────────────────────────────── */}
      <input
        type="text"
        placeholder="Nom de la recette…"
        value={name}
        onChange={(e) => set('name', e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        enterKeyHint="next"
        className={cn(REGLE, 'text-[22px] font-bold tracking-[-0.02em] pb-2.5 mb-6')}
      />

      {/* ── Temps ─────────────────────────────────────────────────────────
          Un incrément plutôt qu'une grille de huit puces suivie d'un mode
          texte libre : trois rangées de boutons pour une valeur qui tient sur
          une ligne, et un onglet « Autre… » à trouver pour saisir 25 min. Les
          pas suivent l'usage, de 5 en 5 sous la demi-heure puis de 15 en 15,
          parce que personne n'annonce une recette en 1h05. */}
      <p className={LIBELLE}>Temps de préparation</p>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => set('time', formaterDuree(dureePrecedente(minutes)))}
          aria-label="Moins de temps"
          disabled={minutes <= DUREE_MIN}
          className="w-11 h-11 rounded-full bg-black/[0.045] text-text1 text-lg font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          −
        </button>
        <span className="flex-1 text-center text-[17px] font-bold text-text1 tabular-nums" aria-live="polite">
          {formaterDuree(minutes)}
        </span>
        <button
          type="button"
          onClick={() => set('time', formaterDuree(dureeSuivante(minutes)))}
          aria-label="Plus de temps"
          disabled={minutes >= DUREE_MAX}
          className="w-11 h-11 rounded-full bg-black/[0.045] text-text1 text-lg font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* ── Portions ────────────────────────────────────────────────────────
          Sans ce champ, l'app supposait toute recette écrite pour deux : une
          recette saisie pour quatre voyait ses quantités doublées dès qu'on
          cuisinait pour quatre. */}
      <p className={LIBELLE}>Quantités écrites pour</p>
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => set('portions', (p) => Math.max(1, p - 1))}
          aria-label="Un convive de moins"
          disabled={portions <= 1}
          className="w-11 h-11 rounded-full bg-black/[0.045] text-text1 text-lg font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          −
        </button>
        <span className="text-[15px] font-semibold text-text1 min-w-[112px] text-center tabular-nums">
          {portions} {portions > 1 ? 'personnes' : 'personne'}
        </span>
        <button
          type="button"
          onClick={() => set('portions', (p) => Math.min(24, p + 1))}
          aria-label="Un convive de plus"
          disabled={portions >= 24}
          className="w-11 h-11 rounded-full bg-black/[0.045] text-text1 text-lg font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* ── Photo ───────────────────────────────────────────────────────────
          Encadrée d'un filet : la planche gravée qu'on retrouve sur la fiche. */}
      <p className={LIBELLE}>Photo</p>
      <div className="mb-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-[104px] rounded-2xl bg-black/[0.045] flex flex-col items-center justify-center gap-1.5 active:scale-[0.99] transition-transform overflow-hidden"
        >
          {photo ? (
            <img src={photo} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <>
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              <span className="text-[13px] font-semibold text-text2">Ajouter une photo</span>
            </>
          )}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => set('photo', undefined)}
            className="mt-1 text-[13px] font-semibold text-muted min-h-[44px]"
          >
            Retirer la photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* ── Moment et options ───────────────────────────────────────────── */}
      <p className={LIBELLE}>
        Moment du repas
        {!valeurs.periodChoisie && name.trim() && (
          <span className="ml-1.5 normal-case tracking-normal font-semibold text-sage">proposé</span>
        )}
      </p>
      <div className="flex gap-2 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { set('period', p); set('periodChoisie', true) }}
            aria-pressed={periodeAffichee === p}
            className={cn(PUCE, 'flex-1', periodeAffichee === p ? 'bg-terra text-white' : PUCE_OFF)}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="flex gap-5 mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={fav} onChange={(e) => set('fav', e.target.checked)} className="w-4 h-4 accent-terra" />
          Favori
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={rapide} onChange={(e) => set('rapide', e.target.checked)} className="w-4 h-4 accent-terra" />
          Rapide
        </label>
      </div>

      <p className={LIBELLE}>
        Régime
        {!valeurs.tagsChoisis && regimesProposes.length > 0 && (
          <span className="ml-1.5 normal-case tracking-normal font-semibold text-sage">proposé</span>
        )}
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {TAG_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleTag(t.id)}
            aria-pressed={tagsAffiches.includes(t.id)}
            className={cn(PUCE, tagsAffiches.includes(t.id) ? 'bg-sage text-white' : PUCE_OFF)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Ingrédients ─────────────────────────────────────────────────── */}
      <p className={cn(LIBELLE, 'mt-7')}>Ingrédients</p>
      <IngredientsEditor
        ingredients={ingredients}
        onChange={(liste) => set('ingredients', liste)}
      />

      {/* ── Préparation ─────────────────────────────────────────────────── */}
      <p className={cn(LIBELLE, 'mt-7')}>Préparation</p>
      <StepsEditor steps={steps} onChange={(s) => set('steps', s)} />
    </>
  )
}
