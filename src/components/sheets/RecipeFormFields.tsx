import { useRef } from 'react'
import type { DietaryTag } from '@/types'
import {
  CAT_OPTIONS,
  PERIODS,
  TAG_OPTIONS,
  TIME_OPTIONS,
  type IngredientForm,
  type RecipeFormValues,
  type SetChamp,
} from './recipeFormOptions'
import { PERIOD_LABEL, cn, resizeToBase64 } from '@/lib/utils'
import { devinerCategorie } from '@/lib/categorieIngredient'
import { showToast } from '@/lib/toast'
import Fleuron from '@/components/ui/Fleuron'
import StepsEditor from './StepsEditor'

/**
 * Champs communs aux formulaires de création et de modification d'une recette.
 *
 * Composé comme une fiche de livre de cuisine : intertitres à fleurons, champs
 * réglés d'un simple filet plutôt qu'encadrés, ingrédients à points de
 * conduite. Les libellés et les boutons restent en sans — on les vise au
 * pouce, ils ne se lisent pas.
 *
 * Ce composant ne détient aucun état : les écrans gardent le leur et passent
 * les valeurs avec leur setter, ce qui laisse à chacun ses champs propres
 * (notes et appréciation à la modification).
 */

const LIBELLE = 'font-sans text-[10px] font-extrabold tracking-[0.1em] uppercase text-muted mb-2'
/** Champ réglé : un filet sous le texte, comme une ligne à remplir. */
const REGLE =
  'w-full bg-transparent border-b border-text2/25 focus:border-evening/60 outline-none font-book text-text1 placeholder:text-muted placeholder:font-sans placeholder:text-[14px] placeholder:italic transition-colors'
const PUCE = 'px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition-all'

interface Props {
  valeurs: RecipeFormValues
  /** Modifie un champ. Les écrans restent maîtres de leur état. */
  set: SetChamp
}

export default function RecipeFormFields({ valeurs, set }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { name, time, timeCustom, period, fav, rapide, photo, ingredients, steps, tags, portions } =
    valeurs

  const toggleTag = (tag: DietaryTag) =>
    set('tags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set('photo', await resizeToBase64(file))
    } catch {
      showToast('Erreur lors du chargement de la photo')
    }
  }

  const majIngredient = (idx: number, patch: Partial<IngredientForm>) =>
    set('ingredients', ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)))

  /**
   * Le nom donne le rayon : on le propose au fur et à mesure de la frappe,
   * tant que la personne n'a pas choisi elle-même. Viser cinq boutons sous
   * chaque ingrédient pour dire qu'une tomate est un légume était du travail
   * que le nom faisait déjà.
   */
  const majNomIngredient = (idx: number, nom: string) =>
    set('ingredients', ingredients.map((ing, i) => (
      i === idx
        ? { ...ing, name: nom, category: ing.categorieChoisie ? ing.category : devinerCategorie(nom) }
        : ing
    )))

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
        className={cn(REGLE, 'text-[24px] font-semibold text-center pb-2.5 mb-5')}
      />

      {/* ── Temps ───────────────────────────────────────────────────────── */}
      <p className={LIBELLE}>Temps</p>
      {!timeCustom ? (
        <div className="flex flex-wrap gap-2 mb-5">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('time', t)}
              aria-pressed={time === t}
              className={cn(PUCE, time === t ? 'bg-terra border-terra text-white' : 'bg-card border-border text-text2')}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              set('timeCustom', true)
              set('time', '')
            }}
            className={cn(PUCE, 'border-dashed border-border text-text2')}
          >
            Autre…
          </button>
        </div>
      ) : (
        <div className="flex gap-2 mb-5 items-end">
          <input
            type="text"
            placeholder="Ex : 25 min"
            value={time}
            onChange={(e) => set('time', e.target.value)}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            className={cn(REGLE, 'flex-1 text-[17px] pb-2')}
          />
          <button
            type="button"
            onClick={() => set('timeCustom', false)}
            className="px-3 min-h-[44px] rounded-xl border border-border text-text2 text-xs font-bold"
          >
            Retour
          </button>
        </div>
      )}

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
          className="w-11 h-11 rounded-xl border border-border text-text1 text-lg font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
        >
          −
        </button>
        <span className="font-book text-[17px] text-text1 min-w-[112px] text-center">
          <span className="elzevir font-semibold">{portions}</span>{' '}
          <span className="italic">{portions > 1 ? 'personnes' : 'personne'}</span>
        </span>
        <button
          type="button"
          onClick={() => set('portions', (p) => Math.min(24, p + 1))}
          aria-label="Un convive de plus"
          disabled={portions >= 24}
          className="w-11 h-11 rounded-xl border border-border text-text1 text-lg font-bold flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
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
          className="w-full h-[104px] rounded-xl border border-dashed border-text2/35 flex flex-col items-center justify-center gap-1.5 active:scale-[0.99] transition-transform overflow-hidden"
        >
          {photo ? (
            <img src={photo} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <>
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              <span className="font-book italic text-[15px] text-text2">Ajouter une photo</span>
            </>
          )}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => set('photo', undefined)}
            className="mt-1 font-book italic text-[14px] text-muted underline min-h-[44px]"
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
      <p className={LIBELLE}>Moment du repas</p>
      <div className="flex gap-2 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => set('period', p)}
            aria-pressed={period === p}
            className={cn(PUCE, 'flex-1', period === p ? 'bg-terra border-terra text-white' : 'bg-card border-border text-text2')}
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

      <p className={LIBELLE}>Régime</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {TAG_OPTIONS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleTag(t.id)}
            aria-pressed={tags.includes(t.id)}
            className={cn(PUCE, tags.includes(t.id) ? 'bg-sage border-sage text-white' : 'bg-card border-border text-text2')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Ingrédients ─────────────────────────────────────────────────────
          Nom à gauche, quantité à droite, points de conduite entre les deux :
          la ligne se lit déjà comme celle de la fiche pendant qu'on la tape.
          Le rayon est deviné d'après le nom et se replie tant qu'il convient. */}
      <Fleuron label="Ingrédients" />
      <ul>
        {ingredients.map((ing, idx) => (
          <li key={idx} className="pb-2.5">
            <div className="flex items-end gap-2">
              <input
                type="text"
                placeholder="Ingrédient"
                value={ing.name}
                onChange={(e) => majNomIngredient(idx, e.target.value)}
                aria-label={`Ingrédient ${idx + 1}`}
                className={cn(REGLE, 'flex-1 min-w-0 text-[17px] pb-1.5')}
              />
              <input
                type="text"
                placeholder="Qté"
                value={ing.qty}
                onChange={(e) => majIngredient(idx, { qty: e.target.value })}
                aria-label={`Quantité de l'ingrédient ${idx + 1}`}
                className={cn(REGLE, 'w-[76px] flex-shrink-0 text-[16px] text-right pb-1.5 elzevir')}
              />
              <button
                type="button"
                onClick={() => set('ingredients', ingredients.filter((_, i) => i !== idx))}
                aria-label={`Retirer ${ing.name || 'cet ingrédient'}`}
                className="w-9 h-11 flex items-center justify-center text-text2 flex-shrink-0 active:scale-90 transition-transform"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex gap-1 mt-1 pr-9">
              {CAT_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => majIngredient(idx, { category: c.id, categorieChoisie: true })}
                  aria-pressed={ing.category === c.id}
                  className={cn(
                    'flex-1 py-1 rounded-md text-[10px] font-bold border transition-all',
                    ing.category === c.id
                      ? 'bg-sage/15 border-sage/50 text-sage'
                      : 'bg-transparent border-transparent text-muted',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => set('ingredients', [...ingredients, { name: '', qty: '', category: 'epicerie' }])}
        className="w-full mt-1 mb-2 py-3 min-h-[48px] rounded-xl border border-dashed border-text2/35 font-book italic text-[15.5px] text-text2 active:scale-[0.99] transition-transform"
      >
        Ajouter un ingrédient
      </button>

      {/* ── Préparation ─────────────────────────────────────────────────── */}
      <Fleuron label="Préparation" />
      <StepsEditor steps={steps} onChange={(s) => set('steps', s)} />
    </>
  )
}
