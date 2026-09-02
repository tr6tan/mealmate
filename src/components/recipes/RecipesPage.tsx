import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Period, DietaryTag } from '@/types'
import { cn, fuzzyScore } from '@/lib/utils'
import RecipeCard from './RecipeCard'

import { estMaison } from '@/lib/recettesMaison'
import Fleuron from '@/components/ui/Fleuron'

type FilterKey = 'all' | 'maison' | Period | 'fav' | 'rapide' | DietaryTag

const DIETARY_TAGS: DietaryTag[] = ['vegetarien', 'vegan', 'sans-gluten', 'sans-lactose']

type TriKey = 'defaut' | 'nom' | 'temps'

const TRIS: { key: TriKey; label: string }[] = [
  { key: 'defaut', label: 'Par défaut' },
  { key: 'nom', label: 'A → Z' },
  { key: 'temps', label: 'Le plus rapide' },
]

/** Minutes lues dans « 25 min », « 1h30 » : sert au tri par durée. */
function enMinutes(temps: string): number {
  const h = temps.match(/(\d+)\s*h(?:\s*(\d+))?/i)
  if (h) return Number(h[1]) * 60 + Number(h[2] ?? 0)
  const m = temps.match(/(\d+)/)
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',    label: 'Tout' },
  { key: 'maison', label: 'Mes recettes' },
  { key: 'pdej',  label: 'Petit-dej' },
  { key: 'midi',  label: 'Midi' },
  { key: 'soir',  label: 'Soir' },
  { key: 'fav',   label: 'Favoris' },
  { key: 'rapide',label: 'Rapide' },
  { key: 'vegetarien', label: '🌿 Végé' },
  { key: 'vegan',      label: '🌱 Vegan' },
  { key: 'sans-gluten', label: 'Sans gluten' },
  { key: 'sans-lactose', label: 'Sans lactose' },
]

export default function RecipesPage() {
  const recipes   = useAppStore((s) => s.recipes)
  const weekPlans = useAppStore((s) => s.weekPlans)
  const openSheet = useAppStore((s) => s.openSheet)
  const diet      = useAppStore((s) => s.settings.diet ?? 'all')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [favFirst, setFavFirst] = useState(false)
  const [tri, setTri] = useState<TriKey>('defaut')

  // Compte de planification par recipe.id (toutes semaines confondues)
  const planCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const weekPlan of Object.values(weekPlans)) {
      for (let day = 0; day < 7; day++) {
        const plan = weekPlan[day]
        if (!plan) continue
        const slots = [plan.pdej, plan.midi, plan.midi_entree, plan.midi_dessert, plan.soir, plan.soir_entree, plan.soir_dessert]
        slots.forEach((meal) => {
          if (!meal) return
          const r = recipes.find((rc) => rc.name === meal.name)
          if (r) counts[r.id] = (counts[r.id] ?? 0) + 1
        })
      }
    }
    return counts
  }, [weekPlans, recipes])

  // Recettes retenues par le régime global (réglages) : c'est l'univers commun
  // à la liste ET aux compteurs des chips, sinon l'en-tête affiche « 7 recettes »
  // pendant que le chip « Tout » en annonce 100.
  const inDiet = useMemo(() => recipes.filter((r) => {
    if (!r || typeof r.name !== 'string') return false
    if (diet === 'vegan' && !r.tags?.includes('vegan')) return false
    if (diet === 'vege'  && !r.tags?.some(t => t === 'vegetarien' || t === 'vegan')) return false
    return true
  }), [recipes, diet])

  const filtered = useMemo(() => {
    let list = inDiet.filter((r) => {
      const matchFilter =
        filter === 'all' ||
        (filter === 'maison' && estMaison(r)) ||
        filter === r.period ||
        (filter === 'fav' && r.fav) ||
        (filter === 'rapide' && r.rapide) ||
        (DIETARY_TAGS.includes(filter as DietaryTag) && r.tags?.includes(filter as DietaryTag))
      const matchSearch = search ? fuzzyScore(search, r.name) >= 15 : true
      return matchFilter && matchSearch
    })
    if (tri === 'nom') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    } else if (tri === 'temps') {
      list = [...list].sort((a, b) => enMinutes(a.time) - enMinutes(b.time))
    } else {
      /*
       * `addRecipe` place une nouvelle recette en tête, mais la synchro la
       * renvoie en fin de carnet : `mergeRecipes` recompose « recettes livrées
       * puis recettes du foyer ». Une seconde après l'avoir créée, la recette
       * passait donc de la 1re à la 101e place, hors de portée sans défiler.
       */
      list = [...list.filter(estMaison), ...list.filter((r) => !estMaison(r))]
    }
    if (favFirst) list = [...list.filter((r) => r.fav), ...list.filter((r) => !r.fav)]
    return list
  }, [inDiet, filter, search, favFirst, tri])

  /*
   * Sections du sommaire.
   *
   * Un sommaire de livre annonce ses parties. Dans l'ordre par défaut on
   * groupe donc « Mes recettes » puis les trois moments du repas ; dès qu'un
   * autre tri est demandé (A → Z, le plus rapide) le regroupement disparaîtrait
   * de son sens, et la liste redevient plate.
   */
  const sections = useMemo<{ titre: string | null; recettes: typeof filtered }[]>(() => {
    if (tri !== 'defaut') return [{ titre: null, recettes: filtered }]

    const maison = filtered.filter(estMaison)
    const livrees = filtered.filter((r) => !estMaison(r))
    const parPeriode = (p: Period) => livrees.filter((r) => r.period === p)

    return [
      { titre: 'Mes recettes', recettes: maison },
      { titre: 'Petits-déjeuners', recettes: parPeriode('pdej') },
      { titre: 'Déjeuners', recettes: parPeriode('midi') },
      { titre: 'Dîners', recettes: parPeriode('soir') },
    ].filter((sec) => sec.recettes.length > 0)
  }, [filtered, tri])

  const counts = useMemo<Record<string, number>>(() => ({
    all: inDiet.length,
    maison: inDiet.filter(estMaison).length,
    pdej: inDiet.filter((r) => r.period === 'pdej').length,
    midi: inDiet.filter((r) => r.period === 'midi').length,
    soir: inDiet.filter((r) => r.period === 'soir').length,
    fav: inDiet.filter((r) => r.fav).length,
    rapide: inDiet.filter((r) => r.rapide).length,
    vegetarien: inDiet.filter((r) => r.tags?.includes('vegetarien')).length,
    vegan: inDiet.filter((r) => r.tags?.includes('vegan')).length,
    'sans-gluten': inDiet.filter((r) => r.tags?.includes('sans-gluten')).length,
    'sans-lactose': inDiet.filter((r) => r.tags?.includes('sans-lactose')).length,
  }), [inDiet])

  return (
    <div className="papier flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="flex-shrink-0 pt-safe" />
      <div className="px-5 pt-4 pb-nav-safe">

        {/* Titre de partie : la page de sommaire d'un livre s'annonce. */}
        <div className="text-center mb-5">
          <h1 className="font-book capitales text-[13px] text-text2">Sommaire</h1>
          <div className="filet-double w-[38%] mx-auto mt-2.5" aria-hidden />
          <p className="font-book italic text-[14px] text-muted mt-3.5">
            {filtered.length} recette{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 ml-auto">
            <label className="sr-only" htmlFor="tri-recettes">Trier les recettes</label>
            <select
              id="tri-recettes"
              value={tri}
              onChange={(e) => setTri(e.target.value as TriKey)}
              className="text-[12px] font-semibold text-text2 bg-fill/60 border border-border rounded-full pl-3 pr-7 min-h-[44px] outline-none appearance-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23646C88' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {TRIS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          <button
            onClick={() => setFavFirst((v) => !v)}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90',
              favFirst ? 'text-white' : 'glass text-muted',
            )}
            style={favFirst ? { background: '#31603D' } : {}}
            aria-label="Favoris en premier"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>

        {/* New recipe CTA */}
        <button
          onClick={() => openSheet({ sheet: 'new-recipe' })}
          className="btn-primary w-full mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle recette
        </button>

        {/* Search */}
        <div className="flex items-center gap-2.5 glass rounded-2xl px-3.5 py-2.5 mb-4">
          <svg className="w-4 h-4 text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Chercher une recette…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="on"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck={true}
            enterKeyHint="search"
            className="flex-1 min-h-[40px] bg-transparent border-none outline-none text-sm font-semibold text-text1 placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted" aria-label="Effacer">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/*
          Fondu à droite : la rangée défile horizontalement et le dernier
          filtre était coupé net, sans rien qui indique qu'il y en a d'autres.
          Le dégradé est décoratif et ne bloque pas le geste.
        */}
        <div className="relative -mr-5">
          <div
            className="absolute right-0 top-0 bottom-5 w-10 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to left, rgb(var(--c-bg)), transparent)' }}
            aria-hidden
          />
          <div className="flex gap-2 pb-5 pr-5 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'flex-shrink-0 px-4 py-2.5 min-h-[40px] rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1',
                filter === f.key ? 'text-white' : 'glass text-text2',
              )}
              style={filter === f.key ? { background: 'rgb(var(--c-terra))' } : {}}
            >
              {f.label}
              {/* Pas d'opacité sur le compteur : elle le ramenait à 2.2:1 sur
                  le fond de la puce. La hiérarchie passe par la taille. */}
              {(counts[f.key] ?? 0) > 0 && (
                <span className={cn('text-[10px] font-bold', filter === f.key ? 'text-white/80' : 'text-muted')}>
                  {counts[f.key]}
                </span>
              )}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe list */}
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center pt-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--c-terra) / 0.07)' }}>
              <svg className="w-9 h-9" style={{ color: 'rgb(var(--c-terra) / 0.38)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v4M8 11v6M12 3v10M12 17v4M16 3v4M16 11v6" /></svg>
            </div>
            <div>
              <p className="text-base font-extrabold text-text1 mb-1">Aucune recette</p>
              <p className="text-[13px] text-muted font-semibold">Ajoute ta première recette pour commencer.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center pt-6">
            <svg className="w-10 h-10 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p className="text-sm font-extrabold text-text1">Aucune recette trouvée</p>
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition-transform"
              style={{ background: 'rgb(var(--c-terra) / 0.07)', color: 'rgb(var(--c-terra))' }}
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <div>
            {sections.map((sec, i) => (
              <section key={sec.titre ?? 'tout'}>
                {sec.titre ? (
                  <Fleuron label={sec.titre} />
                ) : (
                  i > 0 && <Fleuron />
                )}
                {sec.recettes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    planCount={planCounts[recipe.id] ?? 0}
                    onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
                  />
                ))}
              </section>
            ))}
            {/* Cul-de-lampe : le sommaire se termine sur un ornement, pas sur
                une ligne coupée par le bord de l'écran. */}
            <Fleuron />
          </div>
        )}
      </div>
    </div>
  )
}
