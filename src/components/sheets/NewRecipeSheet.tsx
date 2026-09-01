import { useEffect, useMemo, useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import { BASE_PORTIONS, cn } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import RecipeFormFields from './RecipeFormFields'
import { TIME_OPTIONS, type RecipeFormValues } from './recipeFormOptions'
import { parseRecipe } from '@/lib/parseRecipe'
import {
  guessPeriod,
  parseMealIngredients,
  parseSteps,
  type MealDBMeal,
} from '@/lib/mealdb'


// ── Composant ────────────────────────────────────────────────────────────────
export default function NewRecipeSheet() {
  const addRecipe  = useAppStore((s) => s.addRecipe)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const setMeal    = useAppStore((s) => s.setMeal)
  const sheetState = useAppStore((s) => s.sheetState)

  const isOpen  = sheetState.sheet === 'new-recipe'
  // Création lancée depuis la planification : nom d'amorce et créneau de retour.
  const venue   = sheetState.newRecipeContext

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
  const [valeurs, setValeurs] = useState<RecipeFormValues>({
    name: '', time: '', timeCustom: false, period: 'midi',
    fav: false, rapide: false, photo: undefined,
    ingredients: [], steps: [''], tags: [], portions: BASE_PORTIONS,
  })
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined)

  const set = <K extends keyof RecipeFormValues>(clef: K, valeur: RecipeFormValues[K]) =>
    setValeurs((v) => ({ ...v, [clef]: valeur }))

  // Relu à chaque frappe : la personne voit ce qui est compris avant d'enregistrer.
  const draft = useMemo(() => parseRecipe(freeText), [freeText])

  // Le nom cherché en vain dans le sélecteur devient la première ligne : on
  // reprend la saisie là où elle s'est arrêtée plutôt que sur une page blanche.
  useEffect(() => {
    if (!isOpen) return
    setMode('write')
    if (venue?.nomInitial) setFreeText(`${venue.nomInitial}\n`)
  }, [isOpen, venue?.nomInitial])

  /**
   * Pose la recette tout juste créée dans le créneau d'où l'on vient.
   * `addRecipe` ne rend pas la recette créée, mais un repas planifié n'en
   * retient que le nom, l'emoji, la durée et le favori.
   */
  const planifierSiDemande = (nom: string, time: string, fav: boolean) => {
    if (!venue?.planifier) return false
    setMeal(venue.planifier.dayIdx, venue.planifier.slotKey, { name: nom, emoji: '', time, fav })
    return true
  }

  /** Reporte le texte lu dans les champs détaillés. */
  const appliquerDraft = () => {
    setValeurs((v) => ({
      ...v,
      name: draft.name,
      time: draft.time,
      timeCustom: !TIME_OPTIONS.includes(draft.time),
      period: draft.period,
      rapide: draft.rapide,
      ingredients: draft.ingredients,
      steps: draft.steps.length ? draft.steps : [''],
      tags: draft.tags,
      portions: draft.portions ?? BASE_PORTIONS,
    }))
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
      portions: draft.portions,
      photo: valeurs.photo ?? photoUrl,
    })
    const planifiee = planifierSiDemande(draft.name.trim(), draft.time, false)
    showToast(planifiee ? `${draft.name.trim()} ajoutée et planifiée !` : `${draft.name.trim()} ajoutée !`)
    setFreeText('')
    set('photo', undefined)
    setPhotoUrl(undefined)
    closeSheet()
  }

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
    setValeurs((v) => ({
      ...v,
      name: meal.strMeal,
      period: guessPeriod(meal.strCategory),
      time: '30 min',
      ingredients: parseMealIngredients(meal),
      steps: parseSteps(meal.strInstructions).length
        ? parseSteps(meal.strInstructions)
        : [''],
      photo: undefined,
    }))
    setPhotoUrl(meal.strMealThumb)
    setMode('create')
    setImportQuery('')
    setImportResults([])
    setImportNoResult(false)
    showToast(`${meal.strMeal} importée !`)
  }

  const handleSave = () => {
    if (!valeurs.name.trim()) return
    const etapes = valeurs.steps.map((s) => s.trim()).filter(Boolean)
    const ingredients = valeurs.ingredients.filter((i) => i.name.trim())
    addRecipe({
      name: valeurs.name.trim(),
      emoji: '',
      period: valeurs.period,
      time: valeurs.time.trim() || '? min',
      fav: valeurs.fav,
      rapide: valeurs.rapide,
      steps: etapes.length ? etapes : undefined,
      ingredients: ingredients.length ? ingredients : undefined,
      photo: valeurs.photo ?? photoUrl,
      tags: valeurs.tags.length ? valeurs.tags : undefined,
      portions: valeurs.portions === BASE_PORTIONS ? undefined : valeurs.portions,
    })
    const planifiee = planifierSiDemande(
      valeurs.name.trim(),
      valeurs.time.trim() || '? min',
      valeurs.fav,
    )
    showToast(planifiee ? `${valeurs.name.trim()} ajoutée et planifiée !` : `${valeurs.name.trim()} ajoutée !`)
    setValeurs({
      name: '', time: '', timeCustom: false, period: 'midi',
      fav: false, rapide: false, photo: undefined,
      ingredients: [], steps: [''], tags: [], portions: BASE_PORTIONS,
    })
    setPhotoUrl(undefined)
    setFreeText('')
    setMode('write')
    setImportQuery(''); setImportResults([]); setImportNoResult(false)
    closeSheet()
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
                {draft.portions ? ` · pour ${draft.portions}` : ''}
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
          {/* Photo issue d'un import : elle vient d'une URL, pas du formulaire */}
          {photoUrl && !valeurs.photo && (
            <div className="w-full h-28 rounded-2xl overflow-hidden mb-4 relative">
              <img src={photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
                <button
                  onClick={() => setPhotoUrl(undefined)}
                  className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-lg min-h-[32px]"
                >
                  Retirer la photo importée
                </button>
              </div>
            </div>
          )}

          <RecipeFormFields valeurs={valeurs} set={set} />

          <button
            onClick={handleSave}
            disabled={!valeurs.name.trim()}
            className="btn-primary w-full min-h-[52px] disabled:opacity-40"
          >
            Ajouter la recette
          </button>
        </>
      )}
    </BottomSheet>
  )
}
