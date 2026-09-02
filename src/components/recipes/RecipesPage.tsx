import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { DietaryTag, Period, Recipe } from '@/types'
import { cn, fuzzyScore } from '@/lib/utils'
import { estMaison } from '@/lib/recettesMaison'
import { LETTRES, comparerNoms, initiale } from '@/lib/initiale'
import RecipeCard from './RecipeCard'
import TrancheAlphabet from './TrancheAlphabet'

/**
 * La liste des recettes.
 *
 * L'écran a porté jusqu'à quatre rangs de commandes, titre, bouton pleine
 * largeur, recherche, trois onglets de classement, six filtres, soit 308px
 * avant la première recette, la moitié d'un écran de téléphone. Il en reste
 * deux : la recherche, et une rangée de filtres.
 *
 * Ce qui a disparu et pourquoi :
 *
 *, les onglets de classement. L'ordre alphabétique est le seul qui se
 *    combine avec l'index de lettres, et c'est l'index qui remplace le tri.
 *    « Par moment » et « Les miennes » n'étaient pas des ordres mais des
 *    filtres : ils ont rejoint la rangée de filtres, où ils étaient chez eux ;
 *, le bouton bleu pleine largeur. Créer une recette se fait une fois par
 *    semaine, chercher une recette dix fois par jour : l'action passe en tête
 *    de titre, où elle reste atteignable au pouce sans occuper un rang ;
 *, les cartes de verre autour de chaque ligne, remplacées par un filet.
 */

type FiltreKey = 'maison' | 'fav' | 'rapide' | Period | DietaryTag

const FILTRES: { key: FiltreKey; label: string }[] = [
  { key: 'maison',       label: 'Mes recettes' },
  { key: 'fav',          label: 'Favoris' },
  { key: 'rapide',       label: 'Rapide' },
  { key: 'pdej',         label: 'Petit-déj' },
  { key: 'midi',         label: 'Déjeuner' },
  { key: 'soir',         label: 'Dîner' },
  { key: 'vegetarien',   label: 'Végé' },
  { key: 'vegan',        label: 'Vegan' },
  { key: 'sans-gluten',  label: 'Sans gluten' },
  { key: 'sans-lactose', label: 'Sans lactose' },
]

const PERIODES: Period[] = ['pdej', 'midi', 'soir']

function correspond(r: Recipe, f: FiltreKey): boolean {
  if (f === 'maison') return estMaison(r)
  if (f === 'fav') return r.fav
  if (f === 'rapide') return r.rapide
  if (PERIODES.includes(f as Period)) return r.period === f
  return r.tags?.includes(f as DietaryTag) ?? false
}

interface Section {
  lettre: string
  recettes: Recipe[]
}

export default function RecipesPage() {
  const recipes   = useAppStore((s) => s.recipes)
  const weekPlans = useAppStore((s) => s.weekPlans)
  const openSheet = useAppStore((s) => s.openSheet)
  const diet      = useAppStore((s) => s.settings.diet ?? 'all')

  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<FiltreKey | null>(null)
  const [lettreCourante, setLettreCourante] = useState<string | null>(null)

  const defilement = useRef<HTMLDivElement>(null)
  const ancres = useRef(new Map<string, HTMLElement>())

  // Compte de planification par recipe.id (toutes semaines confondues)
  const planCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const weekPlan of Object.values(weekPlans)) {
      for (let day = 0; day < 7; day++) {
        const plan = weekPlan[day]
        if (!plan) continue
        ;[plan.pdej, plan.midi, plan.midi_entree, plan.midi_dessert,
          plan.soir, plan.soir_entree, plan.soir_dessert].forEach((meal) => {
          if (!meal) return
          const r = recipes.find((rc) => rc.name === meal.name)
          if (r) counts[r.id] = (counts[r.id] ?? 0) + 1
        })
      }
    }
    return counts
  }, [weekPlans, recipes])

  /** Recettes retenues par le régime global des réglages. */
  const admises = useMemo(() => recipes.filter((r) => {
    if (!r || typeof r.name !== 'string') return false
    if (diet === 'vegan' && !r.tags?.includes('vegan')) return false
    if (diet === 'vege'  && !r.tags?.some((t) => t === 'vegetarien' || t === 'vegan')) return false
    return true
  }), [recipes, diet])

  const retenues = useMemo(() => admises.filter((r) => {
    if (filtre && !correspond(r, filtre)) return false
    if (search && fuzzyScore(search, r.name) < 15) return false
    return true
  }), [admises, filtre, search])

  /** Compte par filtre, pour ne proposer que ce qui donne un résultat. */
  const compteurs = useMemo(() => {
    const c: Partial<Record<FiltreKey, number>> = {}
    for (const f of FILTRES) c[f.key] = admises.filter((r) => correspond(r, f.key)).length
    return c
  }, [admises])

  /*
   * Une recherche répond à la frappe, pas à l'alphabet : on rend alors une
   * seule liste par pertinence. Découper trois résultats sous trois lettres
   * serait du décor.
   */
  const enRecherche = search.trim().length > 0

  const sections = useMemo<Section[]>(() => {
    if (enRecherche) return []
    const parLettre = new Map<string, Recipe[]>()
    for (const r of retenues) {
      const l = initiale(r.name)
      const liste = parLettre.get(l)
      if (liste) liste.push(r)
      else parLettre.set(l, [r])
    }
    return LETTRES
      .filter((l) => parLettre.has(l))
      .map((l) => ({
        lettre: l,
        recettes: (parLettre.get(l) ?? []).sort((a, b) => comparerNoms(a.name, b.name)),
      }))
  }, [retenues, enRecherche])

  const resultats = useMemo(
    () => enRecherche
      ? [...retenues].sort((a, b) => fuzzyScore(search, b.name) - fuzzyScore(search, a.name))
      : [],
    [enRecherche, retenues, search],
  )

  const lettresPresentes = useMemo(
    () => new Set(sections.map((s) => s.lettre)),
    [sections],
  )

  const avecIndex = !enRecherche && lettresPresentes.size > 2

  /**
   * Position d'une section dans le conteneur qui défile.
   *
   * Mesurée sur les rectangles et non sur `offsetTop` : celui-ci se compte
   * depuis le premier ancêtre positionné, qui n'est pas le conteneur, si bien
   * que la lettre marquée dérivait de deux sections, on touchait S, l'index
   * marquait Q.
   */
  const ecartDansLaBoite = (el: HTMLElement, boite: HTMLElement) =>
    el.getBoundingClientRect().top - boite.getBoundingClientRect().top

  /**
   * Ouvre à une lettre.
   *
   * Le saut se recale sur plusieurs images. Les lignes portent
   * `content-visibility: auto`, donc celles qui sont hors écran ne sont pas
   * disposées et leur hauteur n'est qu'estimée : viser S atterrissait deux
   * sections plus haut, sur Q, et l'écart grandissait avec la distance. Une
   * fois le contenu réellement disposé, on corrige, jusqu'à six fois, pour
   * ne jamais boucler.
   *
   * Le défilement est instantané et non animé : c'est un index, on veut la
   * page, pas le voyage.
   */
  const ouvrirA = useCallback((lettre: string) => {
    const boite = defilement.current
    if (!boite) return
    setLettreCourante(lettre)

    let essais = 0
    const caler = () => {
      const cible = ancres.current.get(lettre)
      if (!cible) return
      const ecart = ecartDansLaBoite(cible, boite) - 8
      if (Math.abs(ecart) < 2 || essais >= 6) return
      boite.scrollTop += ecart
      essais += 1
      requestAnimationFrame(caler)
    }
    caler()
  }, [])

  /*
   * Lettre en cours de lecture, pour la marquer sur l'index. Relevée sur un
   * `requestAnimationFrame` : un calcul par événement de défilement saccadait
   * la liste sur les appareils lents.
   */
  useEffect(() => {
    const boite = defilement.current
    if (!boite || !avecIndex) return
    let enAttente = false

    const relever = () => {
      enAttente = false

      /*
       * En butée basse, la dernière section ne peut pas atteindre le haut de
       * l'écran : c'est pourtant elle qu'on regarde. Sans ce cas, toucher la
       * dernière lettre marquait l'avant-dernière.
       */
      if (boite.scrollTop + boite.clientHeight >= boite.scrollHeight - 4) {
        const derniere = sections[sections.length - 1]
        if (derniere) {
          setLettreCourante(derniere.lettre)
          return
        }
      }

      let vue: string | null = null
      /*
       * Parcours dans l'ordre de `sections`, et non dans celui de la Map
       * d'ancres : React supprime et réinscrit les refs à chaque changement
       * de filtre, si bien que l'ordre d'insertion cessait d'être
       * alphabétique et que le `break` sortait trop tôt.
       */
      for (const sec of sections) {
        const el = ancres.current.get(sec.lettre)
        if (!el) continue
        if (ecartDansLaBoite(el, boite) <= 44) vue = sec.lettre
        else break
      }
      setLettreCourante(vue)
    }

    const surDefilement = () => {
      if (enAttente) return
      enAttente = true
      requestAnimationFrame(relever)
    }

    boite.addEventListener('scroll', surDefilement, { passive: true })
    relever()
    return () => boite.removeEventListener('scroll', surDefilement)
  }, [avecIndex, sections])

  const total = retenues.length
  const vide = total === 0

  return (
    <div ref={defilement} className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="flex-shrink-0 pt-safe" />

      <div className={cn('pt-3 pb-nav-safe', avecIndex ? 'pl-5 pr-8' : 'px-5')}>

        {/* ── Titre ────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-[27px] font-extrabold text-text1 tracking-[-0.03em] leading-none">
              Recettes
            </h1>
            <p className="mt-1.5 text-[13px] text-muted tabular-nums">
              {total} recette{total !== 1 ? 's' : ''}
              {(filtre || enRecherche) && ` sur ${admises.length}`}
            </p>
          </div>
          <button
            onClick={() => openSheet({ sheet: 'new-recipe' })}
            aria-label="Nouvelle recette"
            className="w-11 h-11 flex-shrink-0 rounded-full bg-terra text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-[19px] h-[19px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* ── Chercher ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 h-11 px-3.5 mb-3 rounded-2xl bg-black/[0.045]">
          <svg className="w-[17px] h-[17px] text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Chercher une recette"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-text1 placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Effacer la recherche" className="w-7 h-7 -mr-1.5 flex items-center justify-center text-muted active:scale-90 transition-transform">
              <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>

        {/* ── Filtres ──────────────────────────────────────────────────────────
            Un seul rang. L'actif est plein, les autres sont du texte nu : sur
            dix pastilles bordées, la sélection ne se voyait plus. */}
        {/* Le rang déborde à gauche pour toucher le bord de l'écran, mais
            s'arrête à droite quand l'index est là : sans cela « Petit-déj »
            passait sous les lettres. */}
        <div className={cn('relative -ml-5 mb-1', avecIndex ? '' : '-mr-5')}>
          <div
            className={cn(
              'flex gap-1.5 overflow-x-auto no-scrollbar pl-5 pb-2',
              avecIndex ? 'pr-1' : 'pr-5',
            )}
            role="group"
            aria-label="Filtres"
          >
            {FILTRES.map((f) => {
              const actif = filtre === f.key
              const n = compteurs[f.key] ?? 0
              if (n === 0 && !actif) return null
              return (
                <button
                  key={f.key}
                  onClick={() => setFiltre(actif ? null : f.key)}
                  aria-pressed={actif}
                  className={cn(
                    'flex-shrink-0 h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors',
                    actif ? 'bg-terra text-white' : 'text-text2 bg-black/[0.045]',
                  )}
                >
                  {f.label}
                  {!actif && <span className="ml-1 text-muted tabular-nums">{n}</span>}
                </button>
              )
            })}
          </div>
          <span
            className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgb(var(--c-bg)), transparent)' }}
            aria-hidden
          />
        </div>

        {/* ── La liste ─────────────────────────────────────────────────────── */}
        {vide ? (
          <div className="text-center pt-16">
            <p className="text-[16px] font-semibold text-text1">
              {enRecherche ? 'Aucune recette de ce nom' : 'Aucune recette pour ce filtre'}
            </p>
            <button
              onClick={() => { setSearch(''); setFiltre(null) }}
              className="mt-4 h-11 px-5 rounded-full bg-black/[0.045] text-[14px] font-semibold text-text2 active:scale-95 transition-transform"
            >
              Tout afficher
            </button>
          </div>
        ) : enRecherche ? (
          <div>
            {resultats.map((recipe, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                planCount={planCounts[recipe.id] ?? 0}
                derniere={i === resultats.length - 1}
                onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
              />
            ))}
          </div>
        ) : (
          <div>
            {sections.map((sec) => (
              <section
                key={sec.lettre}
                ref={(el) => {
                  if (el) ancres.current.set(sec.lettre, el)
                  else ancres.current.delete(sec.lettre)
                }}
              >
                {/* La lettre, discrète : c'est un repère de défilement, pas un
                    titre. L'index en bord d'écran porte la navigation. */}
                <h2 className="pt-5 pb-1.5 text-[12px] font-extrabold tracking-[0.1em] text-muted">
                  {sec.lettre === '#' ? 'AUTRES' : sec.lettre}
                </h2>
                {sec.recettes.map((recipe, i) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    planCount={planCounts[recipe.id] ?? 0}
                    derniere={i === sec.recettes.length - 1}
                    onClick={() => openSheet({ sheet: 'recipe-detail', recipeContext: recipe })}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── Index alphabétique ─────────────────────────────────────────────── */}
      {avecIndex && (
        <div className="fixed right-0 top-0 bottom-0 z-20 flex items-center pr-1">
          <TrancheAlphabet
            presentes={lettresPresentes}
            courante={lettreCourante}
            onChoisir={ouvrirA}
          />
        </div>
      )}
    </div>
  )
}
