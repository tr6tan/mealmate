import { useMemo, useRef, useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, ShoppingCategory, Ingredient, DietaryTag } from '@/types'
import { PERIOD_LABEL, cn, resizeToBase64 } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { parseRecipe } from '@/lib/parseRecipe'
import {
  guessPeriod,
  parseMealIngredients,
  parseSteps,
  type MealDBMeal,
} from '@/lib/mealdb'

const PERIODS: Period[] = ['pdej', 'midi', 'soir']
const TIME_OPTIONS = ['5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '1h', '1h30']
const CAT_OPTIONS: { id: ShoppingCategory; label: string }[] = [
  { id: 'legumes',  label: 'Lég.' },
  { id: 'viandes',  label: 'Vde.' },
  { id: 'cremerie', label: 'Crèm.' },
  { id: 'epicerie', label: 'Épic.' },
  { id: 'maison',   label: 'Mais.' },
]
const TAG_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: 'vegetarien',   label: '🌿 Végé' },
  { id: 'vegan',        label: '🌱 Vegan' },
  { id: 'sans-gluten',  label: 'Sans gluten' },
  { id: 'sans-lactose', label: 'Sans lactose' },
]

// ── Composant ────────────────────────────────────────────────────────────────
export default function NewRecipeSheet() {
  const addRecipe  = useAppStore((s) => s.addRecipe)
  const closeSheet = useAppStore((s) => s.closeSheet)

  // Mode
  // « Écrire » d'abord : sept sections à remplir avant le premier ingrédient
  // décourageaient la création. Le formulaire détaillé reste à un geste.
  const [mode, setMode] = useState<'write' | 'create' | 'import'>('write')
  const [freeText, setFreeText] = useState('')

  // Import
  const [importQuery,   setImportQuery]   = useState('')
  const [importResults, setImportResults] = useState<MealDBMeal[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importNoResult, setImportNoResult] = useState(false)

  // Create
  const [name,       setName]       = useState('')
  const [time,       setTime]       = useState('')
  const [timeCustom, setTimeCustom] = useState(false)
  const [period,     setPeriod]     = useState<Period>('midi')
  const [fav,        setFav]        = useState(false)
  const [rapide,     setRapide]     = useState(false)
  const [steps,      setSteps]      = useState<string[]>([''])
  const [photo,      setPhoto]      = useState<string | undefined>(undefined)
  const [photoUrl,   setPhotoUrl]   = useState<string | undefined>(undefined)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [tags,        setTags]        = useState<DietaryTag[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Relu à chaque frappe : la personne voit ce qui est compris avant d'enregistrer.
  const draft = useMemo(() => parseRecipe(freeText), [freeText])

  /** Reporte le texte lu dans les champs détaillés. */
  const appliquerDraft = () => {
    setName(draft.name)
    setTime(draft.time)
    setTimeCustom(!TIME_OPTIONS.includes(draft.time))
    setPeriod(draft.period)
    setRapide(draft.rapide)
    setIngredients(draft.ingredients)
    setSteps(draft.steps.length ? draft.steps : [''])
    setTags(draft.tags)
  }

  const enregistrerDepuisTexte = () => {
    if (!draft.name.trim()) return
    addRecipe({
      name: draft.name.trim(),
      emoji: '',
      period: draft.period,
      time: draft.time,
      fav: false,
      rapide: draft.rapide,
      ingredients: draft.ingredients.length ? draft.ingredients : undefined,
      steps: draft.steps.length ? draft.steps : undefined,
      tags: draft.tags.length ? draft.tags : undefined,
      photo: photo ?? photoUrl,
    })
    showToast(`${draft.name.trim()} ajoutée !`)
    setFreeText('')
    setPhoto(undefined)
    setPhotoUrl(undefined)
    closeSheet()
  }

  const toggleTag = (tag: DietaryTag) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])

  // ── Import handlers ─────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!importQuery.trim()) return
    setImportLoading(true)
    setImportNoResult(false)
    setImportResults([])
    try {
      const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(importQuery.trim())}`)
      const data = await res.json()
      const meals = (data.meals ?? []) as MealDBMeal[]
      setImportResults(meals)
      if (meals.length === 0) setImportNoResult(true)
    } catch {
      setImportNoResult(true)
    } finally {
      setImportLoading(false)
    }
  }

  const handleSelectMeal = (meal: MealDBMeal) => {
    setName(meal.strMeal)
    setPeriod(guessPeriod(meal.strCategory))
    setTime('30 min')
    setIngredients(parseMealIngredients(meal))
    const parsedSteps = parseSteps(meal.strInstructions)
    setSteps(parsedSteps.length ? parsedSteps : [''])
    setPhotoUrl(meal.strMealThumb)
    setPhoto(undefined)
    setMode('create')
    setImportQuery('')
    setImportResults([])
    setImportNoResult(false)
    showToast(`${meal.strMeal} importée !`)
  }

  // ── Create handlers ─────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const b64 = await resizeToBase64(file)
      setPhoto(b64)
      setPhotoUrl(undefined)
    } catch {
      showToast('Erreur lors du chargement de la photo')
    }
  }

  const updateStep    = (idx: number, value: string) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? value : s)))
  const addStep       = () => setSteps((prev) => [...prev, ''])
  const removeStep    = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx))

  const addIngredient    = () =>
    setIngredients((prev) => [...prev, { name: '', qty: '', category: 'epicerie' }])
  const updateIngredient = (idx: number, patch: Partial<Ingredient>) =>
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)))
  const removeIngredient = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx))

  const handleSave = () => {
    if (!name.trim()) return
    const cleanSteps       = steps.map((s) => s.trim()).filter(Boolean)
    const cleanIngredients = ingredients.filter((i) => i.name.trim())
    addRecipe({
      name: name.trim(),
      emoji: '',
      period,
      time: time.trim() || '? min',
      fav,
      rapide,
      steps:       cleanSteps.length       ? cleanSteps       : undefined,
      ingredients: cleanIngredients.length  ? cleanIngredients : undefined,
      photo: photo ?? photoUrl,
      tags: tags.length ? tags : undefined,
    })
    // Reset
    setName(''); setTime(''); setTimeCustom(false)
    setPeriod('midi'); setFav(false); setRapide(false)
    setSteps(['']); setPhoto(undefined); setPhotoUrl(undefined); setIngredients([]); setTags([])
    setMode('create'); setImportQuery(''); setImportResults([]); setImportNoResult(false)
    closeSheet()
    showToast(`${name.trim()} ajoutée !`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <BottomSheet name="new-recipe">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-extrabold text-text1">Nouvelle recette</h2>
        <button onClick={closeSheet} aria-label="Fermer" className="text-muted p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Onglets Écrire / Détaillé / Importer */}
      <div className="flex gap-2 mb-5 p-1 bg-bg rounded-2xl">
        <button
          onClick={() => setMode('write')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200',
            mode === 'write' ? 'bg-card text-text1 shadow-card' : 'text-muted',
          )}
        >
          Écrire
        </button>
        <button
          onClick={() => setMode('create')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200',
            mode === 'create' ? 'bg-card text-text1 shadow-card' : 'text-muted',
          )}
        >
          Détaillé
        </button>
        <button
          onClick={() => setMode('import')}
          className={cn(
            'flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200',
            mode === 'import' ? 'bg-card text-text1 shadow-card' : 'text-muted',
          )}
        >
          Importer
        </button>
      </div>

      {/* ══════ MODE ÉCRIRE ═════════════════════════════════════════════════ */}
      {mode === 'write' && (
        <div>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={'Tarte aux poireaux\n40 min\n\n3 poireaux\n1 pâte brisée\n20 cl de crème\n2 œufs\n\nÉmincer les poireaux et les faire fondre.\nBattre les œufs avec la crème.\nEnfourner 30 min à 180°.'}
            rows={11}
            autoFocus
            className="w-full bg-bg border border-border rounded-2xl px-4 py-3.5 text-[15px] text-text1 placeholder:text-muted outline-none focus:border-terra resize-none leading-relaxed transition-colors"
          />
          <p className="text-[12px] text-muted mt-2 leading-snug">
            Le titre sur la première ligne, puis les ingrédients, puis les étapes.
            Une ligne par élément.
          </p>

          {/* Aperçu : rien n'est enregistré sans que la lecture soit montrée */}
          {freeText.trim() && (
            <div className="mt-5 rounded-2xl border border-border bg-bg p-4">
              <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-3">
                Ce qui sera enregistré
              </p>

              <p className="text-[17px] font-bold text-text1 leading-tight">
                {draft.name || <span className="text-muted">Sans titre</span>}
              </p>
              <p className="text-[12px] text-muted mt-0.5">
                {draft.time}
                {draft.rapide && ' · Rapide'}
                {' · '}
                {draft.period === 'pdej' ? 'Petit-déj' : draft.period === 'soir' ? 'Soir' : 'Midi'}
              </p>

              {draft.ingredients.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-text2 mb-1">
                    {draft.ingredients.length} ingrédient{draft.ingredients.length > 1 ? 's' : ''}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {draft.ingredients.map((ing, i) => (
                      <li key={i} className="flex justify-between gap-3 text-[13px]">
                        <span className="text-text1">{ing.name}</span>
                        <span className="text-muted tabular-nums flex-shrink-0">{ing.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.steps.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold text-text2 mb-1">
                    {draft.steps.length} étape{draft.steps.length > 1 ? 's' : ''}
                  </p>
                  <ol className="flex flex-col gap-0.5">
                    {draft.steps.map((st, i) => (
                      <li key={i} className="text-[13px] text-text1 flex gap-2">
                        <span className="text-muted tabular-nums">{i + 1}.</span>
                        <span className="line-clamp-1">{st}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                onClick={() => { appliquerDraft(); setMode('create') }}
                className="mt-4 text-[12px] font-bold text-accent underline underline-offset-2"
              >
                Ajuster en détail
              </button>
            </div>
          )}

          <button
            onClick={enregistrerDepuisTexte}
            disabled={!draft.name.trim()}
            className="btn-primary w-full mt-5 min-h-[52px] disabled:opacity-40"
          >
            Ajouter la recette
          </button>
        </div>
      )}

      {/* ══════ MODE IMPORT ══════════════════════════════════════════════════ */}
      {mode === 'import' && (
        <div>
          <p className="text-[12px] font-semibold text-muted mb-3 leading-snug">
            Cherche une recette pour l'importer avec photo et ingrédients automatiquement.
            La base est anglophone — essaie "pasta carbonara", "chicken curry"…
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Pasta carbonara, chicken curry…"
              value={importQuery}
              onChange={(e) => setImportQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              className="flex-1 px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={importLoading || !importQuery.trim()}
              className="px-4 py-3 bg-terra text-white rounded-2xl text-sm font-extrabold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center min-w-[48px]"
              aria-label="Rechercher"
            >
              {importLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )}
            </button>
          </div>

          {importLoading && (
            <p className="text-center py-8 text-muted text-sm font-semibold">Recherche en cours…</p>
          )}

          {importNoResult && !importLoading && (
            <div className="text-center py-6">
              <p className="text-sm font-extrabold text-text1 mb-1">Aucun résultat</p>
              <p className="text-xs text-muted font-semibold">Essaie un autre mot en anglais</p>
            </div>
          )}

          {importResults.length > 0 && !importLoading && (
            <div className="space-y-2">
              {importResults.slice(0, 8).map((meal) => (
                <button
                  key={meal.idMeal}
                  onClick={() => handleSelectMeal(meal)}
                  className="w-full flex items-center gap-3 bg-card border-[1.5px] border-border rounded-2xl p-2.5 text-left active:scale-[0.98] transition-transform active:border-terra"
                >
                  <img
                    src={`${meal.strMealThumb}/preview`}
                    alt={meal.strMeal}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-bg"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-text1 truncate">{meal.strMeal}</p>
                    <p className="text-[11px] text-muted font-semibold mt-0.5">
                      {meal.strCategory} · {meal.strArea}
                    </p>
                  </div>
                  <span className="text-terra font-bold text-lg flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ MODE CREATE ══════════════════════════════════════════════════ */}
      {mode === 'create' && (
        <>
          {/* Bannière recette importée */}
          {(photoUrl ?? photo) && (
            <div className="w-full h-28 rounded-2xl overflow-hidden mb-4 relative">
              <img
                src={photoUrl ?? photo}
                alt="aperçu"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end gap-2 p-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-lg"
                >
                  Changer
                </button>
                <button
                  onClick={() => { setPhoto(undefined); setPhotoUrl(undefined) }}
                  className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-lg"
                >
                  Supprimer
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5 mb-4">
            {/* Nom */}
            <div className="flex gap-2">
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
                className="flex-1 px-3.5 py-3 bg-card border-[1.5px] border-border rounded-2xl text-sm font-semibold text-text1 outline-none placeholder:text-muted focus:border-terra transition-colors"
              />
            </div>
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
                    time === t ? 'bg-terra border-terra text-white' : 'bg-card border-border text-muted',
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
                className="px-3 py-3 rounded-2xl bg-bg text-muted text-xs font-bold"
              >
                ← Retour
              </button>
            </div>
          )}

          {/* Photo (si pas encore de photo) */}
          {!photo && !photoUrl && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-2xl border-2 border-dashed border-border bg-card flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span className="text-[11px] font-bold text-muted">Ajouter une photo</span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* Période */}
          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Période</p>
          <div className="flex gap-2 mb-4">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200',
                  period === p ? 'bg-terra border-terra text-white' : 'bg-card border-border text-muted',
                )}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="flex gap-5 mb-5">
            <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer">
              <input type="checkbox" checked={fav} onChange={(e) => setFav(e.target.checked)} className="w-4 h-4 accent-terra" />
              Favori
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-text1 cursor-pointer">
              <input type="checkbox" checked={rapide} onChange={(e) => setRapide(e.target.checked)} className="w-4 h-4 accent-terra" />
              Rapide
            </label>
          </div>

          {/* Tags diététiques */}
          <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">Régime</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {TAG_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTag(t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                  tags.includes(t.id) ? 'bg-sage border-sage text-white' : 'bg-card border-border text-muted',
                )}
              >
                {t.label}
              </button>
            ))}
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
            disabled={!name.trim()}
            className="w-full py-3.5 bg-terra text-white rounded-2xl text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            Ajouter la recette
          </button>
        </>
      )}
    </BottomSheet>
  )
}
