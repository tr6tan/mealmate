import { useState, useRef, useEffect } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, ShoppingCategory, Ingredient } from '@/types'
import { PERIOD_LABEL, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

const PERIODS: Period[] = ['pdej', 'midi', 'soir']
const TIME_OPTIONS = ['5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '1h', '1h30']
const CAT_OPTIONS: { id: ShoppingCategory; label: string }[] = [
  { id: 'legumes',  label: 'Lég.' },
  { id: 'viandes',  label: 'Vde.' },
  { id: 'cremerie', label: 'Crem.' },
  { id: 'epicerie', label: 'Épic.' },
  { id: 'maison',   label: 'Mais.' },
]

function resizeToBase64(file: File, maxW = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EditRecipeSheet() {
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const closeSheet   = useAppStore((s) => s.closeSheet)
  const sheetState   = useAppStore((s) => s.sheetState)

  const recipe = sheetState.sheet === 'edit-recipe' ? sheetState.recipeContext : undefined

  const [name,        setName]        = useState('')
  const [time,        setTime]        = useState('')
  const [timeCustom,  setTimeCustom]  = useState(false)
  const [period,      setPeriod]      = useState<Period>('midi')
  const [fav,         setFav]         = useState(false)
  const [rapide,      setRapide]      = useState(false)
  const [steps,       setSteps]       = useState<string[]>([''])
  const [photo,       setPhoto]       = useState<string | undefined>(undefined)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pré-remplir les champs à chaque ouverture
  useEffect(() => {
    if (recipe) {
      setName(recipe.name)
      setTime(recipe.time)
      setTimeCustom(!TIME_OPTIONS.includes(recipe.time))
      setPeriod(recipe.period)
      setFav(recipe.fav)
      setRapide(recipe.rapide)
      setSteps(recipe.steps?.length ? recipe.steps : [''])
      setPhoto(recipe.photo)
      setIngredients(recipe.ingredients ?? [])
    }
  }, [recipe?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const b64 = await resizeToBase64(file)
      setPhoto(b64)
    } catch {
      showToast('Erreur lors du chargement de la photo')
    }
  }

  const updateStep = (idx: number, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? value : s)))
  const addStep    = () => setSteps((prev) => [...prev, ''])
  const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx))

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { name: '', qty: '', category: 'epicerie' }])
  const updateIngredient = (idx: number, patch: Partial<Ingredient>) =>
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, ...patch } : ing))
  const removeIngredient = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx))

  const handleSave = () => {
    if (!name.trim() || !recipe) return
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean)
    const cleanIngredients = ingredients.filter((i) => i.name.trim())
    updateRecipe(recipe.id, {
      name: name.trim(),
      emoji: recipe.emoji,
      period,
      time: time.trim() || '? min',
      fav,
      rapide,
      steps:       cleanSteps.length       ? cleanSteps       : undefined,
      ingredients: cleanIngredients.length ? cleanIngredients : undefined,
      photo,
    })
    closeSheet()
    showToast(`${name.trim()} modifiée !`)
  }

  if (!recipe) return <BottomSheet name="edit-recipe"><div /></BottomSheet>

  return (
    <BottomSheet name="edit-recipe" className="max-h-[92dvh]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-extrabold text-text1">Modifier la recette</h2>
        <button onClick={closeSheet} className="text-muted flex items-center"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>

      <div className="space-y-2.5 mb-4">
        {/* Nom */}
        <input
          type="text"
          placeholder="Nom de la recette…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 300)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="next"
          className="w-full px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
        />
      </div>

      {/* Temps */}
      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Temps</p>
      {!timeCustom ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                time === t
                  ? 'bg-terra border-terra text-white'
                  : 'bg-card border-border text-muted',
              )}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => { setTimeCustom(true); setTime('') }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-dashed border-border text-muted"
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
            onChange={(e) => setTime(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            className="flex-1 px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
          />
          <button
            onClick={() => setTimeCustom(false)}
            className="px-3 py-3 rounded-2xl bg-sep text-muted text-xs font-bold"
          >
            ← Retour
          </button>
        </div>
      )}

      {/* Photo */}
      <div className="mb-4">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Photo</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-[100px] rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform overflow-hidden"
        >
          {photo ? (
            <img src={photo} alt="aperçu" className="w-full h-full object-cover" />
          ) : (
            <>          
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span className="text-[11px] font-bold text-muted">Ajouter une photo</span>
            </>
          )}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => setPhoto(undefined)}
            className="mt-1.5 text-[11px] font-bold text-muted/70 underline"
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
      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Période</p>
      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200',
              period === p
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="flex gap-5 mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer">
          <input
            type="checkbox"
            checked={fav}
            onChange={(e) => setFav(e.target.checked)}
            className="w-4 h-4 accent-terra"
          />
          Favori
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer">
          <input
            type="checkbox"
            checked={rapide}
            onChange={(e) => setRapide(e.target.checked)}
            className="w-4 h-4 accent-terra"
          />
          Rapide
        </label>
      </div>

      {/* Ingrédients */}
      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Ingrédients</p>
      <div className="space-y-2 mb-3">
        {ingredients.map((ing, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              placeholder="Ingrédient…"
              value={ing.name}
              onChange={(e) => updateIngredient(idx, { name: e.target.value })}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              enterKeyHint="next"
              className="flex-1 px-3 py-2.5 bg-card border-[1.5px] border-border rounded-xl text-sm text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
            />
            <input
              placeholder="Qté"
              value={ing.qty}
              onChange={(e) => updateIngredient(idx, { qty: e.target.value })}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="next"
              className="w-16 px-2 py-2.5 bg-card border-[1.5px] border-border rounded-xl text-sm text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors text-center"
            />
            <select
              value={ing.category}
              onChange={(e) => updateIngredient(idx, { category: e.target.value as ShoppingCategory })}
              className="w-10 py-2.5 bg-card border-[1.5px] border-border rounded-xl text-sm outline-none focus:border-terra transition-colors text-center cursor-pointer"
            >
              {CAT_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button
              onClick={() => removeIngredient(idx)}
              className="text-muted active:text-red-400 text-lg leading-none transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addIngredient}
        className="w-full py-2 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted active:border-terra active:text-terra transition-colors mb-4"
      >
        + Ajouter un ingrédient
      </button>

      {/* Étapes */}
      <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Étapes</p>
      <div className="space-y-2 mb-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-3 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-terra text-white text-[10px] font-extrabold">
              {idx + 1}
            </span>
            <textarea
              rows={2}
              placeholder={`Étape ${idx + 1}…`}
              value={step}
              onChange={(e) => updateStep(idx, e.target.value)}
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck={false}
              enterKeyHint="next"
              className="flex-1 px-3 py-2.5 bg-card border-[1.5px] border-border rounded-2xl text-sm text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors resize-none leading-snug"
            />
            {steps.length > 1 && (
              <button
                onClick={() => removeStep(idx)}
                className="mt-2 text-muted active:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addStep}
        className="w-full py-2 border-2 border-dashed border-border rounded-2xl text-xs font-bold text-muted active:border-terra active:text-terra transition-colors mb-5"
      >
        + Ajouter une étape
      </button>

      <button
        onClick={handleSave}
        className="w-full py-3.5 bg-terra text-white rounded-2xl text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
      >
        Enregistrer les modifications
      </button>
    </BottomSheet>
  )
}
