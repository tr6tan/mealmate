import { useRef } from 'react'
import type { DietaryTag, Ingredient } from '@/types'
import {
  CAT_OPTIONS,
  PERIODS,
  TAG_OPTIONS,
  TIME_OPTIONS,
  type RecipeFormValues,
} from './recipeFormOptions'
import { PERIOD_LABEL, cn, resizeToBase64 } from '@/lib/utils'
import { showToast } from '@/lib/toast'

/**
 * Champs communs aux formulaires de création et de modification d'une recette.
 *
 * Les deux écrans portaient chacun leur copie : mêmes quatre listes d'options,
 * dix des mêmes états, et le même millier de lignes de champs en double. Toute
 * correction était à faire deux fois, et une seule des deux l'était parfois.
 *
 * Ce composant ne détient aucun état : les écrans gardent le leur et passent
 * les valeurs avec leur setter, ce qui laisse à chacun ses champs propres
 * (notes et appréciation à la modification, import à la création).
 */

const LIBELLE = 'text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2'
const CHAMP =
  'w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors'
const PUCE = 'px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold border-2 transition-all'

interface Props {
  valeurs: RecipeFormValues
  /** Modifie un champ. Les écrans restent maîtres de leur état. */
  set: <K extends keyof RecipeFormValues>(clef: K, valeur: RecipeFormValues[K]) => void
}

export default function RecipeFormFields({ valeurs, set }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { name, time, timeCustom, period, fav, rapide, photo, ingredients, steps, tags } = valeurs

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

  const majIngredient = (idx: number, patch: Partial<Ingredient>) =>
    set('ingredients', ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)))

  const majEtape = (idx: number, valeur: string) =>
    set('steps', steps.map((s, i) => (i === idx ? valeur : s)))

  return (
    <>
      {/* Nom */}
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
        className={cn(CHAMP, 'mb-4')}
      />

      {/* Temps */}
      <p className={LIBELLE}>Temps</p>
      {!timeCustom ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => set('time', t)}
              aria-pressed={time === t}
              className={cn(PUCE, time === t ? 'bg-terra border-terra text-white' : 'bg-card border-border text-text2')}
            >
              {t}
            </button>
          ))}
          <button
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
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Ex : 25 min"
            value={time}
            onChange={(e) => set('time', e.target.value)}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            className={cn(CHAMP, 'flex-1')}
          />
          <button
            onClick={() => set('timeCustom', false)}
            className="px-3 min-h-[44px] rounded-2xl bg-bg border border-border text-text2 text-xs font-bold"
          >
            Retour
          </button>
        </div>
      )}

      {/* Photo */}
      <p className={LIBELLE}>Photo</p>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-[100px] rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform overflow-hidden"
        >
          {photo ? (
            <img src={photo} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <>
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              <span className="text-[11px] font-bold text-text2">Ajouter une photo</span>
            </>
          )}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => set('photo', undefined)}
            className="mt-1.5 text-[11px] font-bold text-muted underline min-h-[44px]"
          >
            Supprimer la photo
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

      {/* Période */}
      <p className={LIBELLE}>Période</p>
      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => set('period', p)}
            aria-pressed={period === p}
            className={cn(PUCE, 'flex-1', period === p ? 'bg-terra border-terra text-white' : 'bg-card border-border text-text2')}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Options */}
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

      {/* Régime */}
      <p className={LIBELLE}>Régime</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {TAG_OPTIONS.map((t) => (
          <button
            key={t.id}
            onClick={() => toggleTag(t.id)}
            aria-pressed={tags.includes(t.id)}
            className={cn(PUCE, tags.includes(t.id) ? 'bg-sage border-sage text-white' : 'bg-card border-border text-text2')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ingrédients */}
      <p className={LIBELLE}>Ingrédients</p>
      <div className="flex flex-col gap-2 mb-4">
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-card border border-border">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ingrédient"
                value={ing.name}
                onChange={(e) => majIngredient(idx, { name: e.target.value })}
                className={cn(CHAMP, 'flex-1 py-2')}
              />
              <input
                type="text"
                placeholder="Qté"
                value={ing.qty}
                onChange={(e) => majIngredient(idx, { qty: e.target.value })}
                className={cn(CHAMP, 'w-[84px] py-2 text-center')}
              />
              <button
                onClick={() => set('ingredients', ingredients.filter((_, i) => i !== idx))}
                aria-label={`Retirer ${ing.name || 'cet ingrédient'}`}
                className="w-11 flex items-center justify-center text-muted"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="flex gap-1.5">
              {CAT_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => majIngredient(idx, { category: c.id })}
                  aria-pressed={ing.category === c.id}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all',
                    ing.category === c.id ? 'bg-terra border-terra text-white' : 'bg-bg border-border text-text2',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => set('ingredients', [...ingredients, { name: '', qty: '', category: 'epicerie' }])}
          className="w-full py-3 min-h-[44px] rounded-2xl border-2 border-dashed border-border text-text2 text-xs font-bold active:scale-[0.98] transition-transform"
        >
          + Ajouter un ingrédient
        </button>
      </div>

      {/* Étapes */}
      <p className={LIBELLE}>Étapes</p>
      <div className="flex flex-col gap-2 mb-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <span className="w-7 h-9 flex items-center justify-center text-[13px] font-bold text-muted tabular-nums flex-shrink-0">
              {idx + 1}
            </span>
            <textarea
              placeholder="Décrire l'étape…"
              value={step}
              onChange={(e) => majEtape(idx, e.target.value)}
              rows={2}
              className={cn(CHAMP, 'flex-1 py-2 resize-none leading-snug')}
            />
            {steps.length > 1 && (
              <button
                onClick={() => set('steps', steps.filter((_, i) => i !== idx))}
                aria-label={`Retirer l'étape ${idx + 1}`}
                className="w-11 h-9 flex items-center justify-center text-muted flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => set('steps', [...steps, ''])}
          className="w-full py-3 min-h-[44px] rounded-2xl border-2 border-dashed border-border text-text2 text-xs font-bold active:scale-[0.98] transition-transform"
        >
          + Ajouter une étape
        </button>
      </div>
    </>
  )
}
