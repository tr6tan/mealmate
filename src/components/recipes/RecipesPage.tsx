import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { DietaryTag, Period, Recipe } from '@/types'
import { fuzzyScore } from '@/lib/utils'
import { estMaison } from '@/lib/recettesMaison'
import { LETTRES, comparerNoms, initiale } from '@/lib/initiale'
import RecipeCard from './RecipeCard'
import TrancheAlphabet from './TrancheAlphabet'

/**
 * Le livret de recettes.
 *
 * La page était une liste qui défile, coiffée de dix pastilles de filtre, d'un
 * menu déroulant natif et d'un cœur. Pour retrouver une recette parmi cent il
 * fallait défiler longtemps ou connaître son nom d'avance.
 *
 * Elle se tient désormais comme un carnet de cuisine : un index alphabétique
 * sur la tranche, qu'on attrape au pouce pour ouvrir à la lettre, et un
 * classement qui se choisit en trois mots. Les commandes quittent le vocabulaire
 * des boutons d'application — pastilles pleines, menu système — pour celui de la
 * page imprimée : petites capitales espacées et filet sous l'entrée active.
 */

type Classement = 'lettre' | 'moment' | 'miennes'
type Filtre = null | 'fav' | 'rapide' | DietaryTag

const CLASSEMENTS: { key: Classement; label: string }[] = [
  { key: 'lettre',  label: 'Par lettre' },
  { key: 'moment',  label: 'Par moment' },
  { key: 'miennes', label: 'Les miennes' },
]

const FILTRES: { key: Exclude<Filtre, null>; label: string }[] = [
  { key: 'fav',           label: 'Favoris' },
  { key: 'rapide',        label: 'Rapide' },
  { key: 'vegetarien',    label: 'Végé' },
  { key: 'vegan',         label: 'Vegan' },
  { key: 'sans-gluten',   label: 'Sans gluten' },
  { key: 'sans-lactose',  label: 'Sans lactose' },
]

const MOMENTS: { periode: Period; titre: string }[] = [
  { periode: 'pdej', titre: 'Petits-déjeuners' },
  { periode: 'midi', titre: 'Déjeuners' },
  { periode: 'soir', titre: 'Dîners' },
]

interface Section {
  clef: string
  /** Grande initiale de l'index ; absent pour les sections par moment. */
  lettre?: string
  titre: string
  recettes: Recipe[]
}

export default function RecipesPage() {
  const recipes   = useAppStore((s) => s.recipes)
  const weekPlans = useAppStore((s) => s.weekPlans)
  const openSheet = useAppStore((s) => s.openSheet)
  const diet      = useAppStore((s) => s.settings.diet ?? 'all')

  const [search, setSearch]         = useState('')
  const [classement, setClassement] = useState<Classement>('lettre')
  const [filtre, setFiltre]         = useState<Filtre>(null)
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
    if (filtre === 'fav' && !r.fav) return false
    if (filtre === 'rapide' && !r.rapide) return false
    if (filtre && filtre !== 'fav' && filtre !== 'rapide' && !r.tags?.includes(filtre)) return false
    if (classement === 'miennes' && !estMaison(r)) return false
    if (search && fuzzyScore(search, r.name) < 15) return false
    return true
  }), [admises, filtre, classement, search])

  const compteurs = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of FILTRES) {
      c[f.key] = admises.filter((r) =>
        f.key === 'fav' ? r.fav : f.key === 'rapide' ? r.rapide : r.tags?.includes(f.key),
      ).length
    }
    c.miennes = admises.filter(estMaison).length
    return c
  }, [admises])

  /*
   * Une recherche en cours répond à la frappe, pas au classement : on rend
   * alors une seule liste par pertinence, sans index ni intertitre. Découper
   * trois résultats sous trois grandes initiales serait du décor.
   */
  const enRecherche = search.trim().length > 0

  const sections = useMemo<Section[]>(() => {
    if (enRecherche) {
      const tri = [...retenues].sort((a, b) => fuzzyScore(search, b.name) - fuzzyScore(search, a.name))
      return [{ clef: 'recherche', titre: '', recettes: tri }]
    }

    if (classement === 'moment') {
      return MOMENTS
        .map(({ periode, titre }) => ({
          clef: periode,
          titre,
          recettes: retenues.filter((r) => r.period === periode)
            .sort((a, b) => comparerNoms(a.name, b.name)),
        }))
        .filter((s) => s.recettes.length > 0)
    }

    // Par lettre, et « les miennes » qui sont trop peu nombreuses pour un index
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
        clef: l,
        lettre: l,
        titre: l === '#' ? 'Autres' : l,
        recettes: (parLettre.get(l) ?? []).sort((a, b) => comparerNoms(a.name, b.name)),
      }))
  }, [retenues, classement, enRecherche, search])

  const lettresPresentes = useMemo(
    () => new Set(sections.filter((s) => s.lettre).map((s) => s.lettre as string)),
    [sections],
  )

  const avecTranche = !enRecherche && classement !== 'moment' && lettresPresentes.size > 2

  const ouvrirA = useCallback((lettre: string) => {
    const cible = ancres.current.get(lettre)
    const boite = defilement.current
    if (!cible || !boite) return
    // `scrollIntoView` remonterait aussi le conteneur parent de l'app : on
    // calcule la position dans le seul conteneur qui défile.
    boite.scrollTo({
      top: cible.offsetTop - boite.offsetTop - 6,
      behavior: 'smooth',
    })
    setLettreCourante(lettre)
  }, [])

  /*
   * Lettre en cours de lecture, pour la marquer sur la tranche. Relevée sur
   * un `requestAnimationFrame` : un calcul par événement de défilement
   * saccadait la liste sur les appareils lents.
   */
  useEffect(() => {
    const boite = defilement.current
    if (!boite || !avecTranche) return
    let enAttente = false

    const relever = () => {
      enAttente = false
      const haut = boite.scrollTop + boite.offsetTop + 40
      let vue: string | null = null
      for (const [lettre, el] of ancres.current) {
        if (el.offsetTop <= haut) vue = lettre
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
  }, [avecTranche, sections])

  const total = retenues.length

  return (
    <div ref={defilement} className="papier flex-1 min-h-0 overflow-y-auto no-scrollbar relative">
      <div className="flex-shrink-0 pt-safe" />

      <div className={`pt-4 pb-nav-safe ${avecTranche ? 'pl-5 pr-9' : 'px-5'}`}>

        {/* ── Faux-titre ───────────────────────────────────────────────────── */}
        <header className="text-center mb-4">
          <h1 className="font-book capitales text-[13px] text-text2">Recettes</h1>
          <div className="filet-double w-[42%] mx-auto mt-2.5" aria-hidden />
          <p className="font-book italic text-[14px] text-muted mt-2.5">
            <span className="elzevir">{total}</span> recette{total !== 1 ? 's' : ''}
            {filtre && ' retenues'}
          </p>
        </header>

        {/* ── Écrire une recette ───────────────────────────────────────────────
            Une ligne d'ex-libris plutôt qu'un bouton plein : la page garde son
            calme, et l'action reste la plus large de l'écran. */}
        <button
          onClick={() => openSheet({ sheet: 'new-recipe' })}
          className="w-full mb-4 py-2.5 min-h-[46px] border-y border-text2/25 flex items-center justify-center gap-2.5 active:opacity-55 transition-opacity"
        >
          <svg className="w-[15px] h-[15px] text-evening/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          <span className="font-book italic text-[15.5px] text-text1">Écrire une nouvelle recette</span>
        </button>

        {/* ── Chercher ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 border-b border-text2/25 focus-within:border-evening/60 pb-2 mb-4 transition-colors">
          <svg className="w-4 h-4 text-text2/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Chercher une recette…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent outline-none font-book text-[17px] text-text1 placeholder:font-sans placeholder:text-[14px] placeholder:italic placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Effacer la recherche" className="w-9 h-9 -mr-2 flex items-center justify-center text-text2 active:scale-90 transition-transform">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>

        {/* ── Classement ───────────────────────────────────────────────────────
            Le menu déroulant natif affichait le style du système au milieu de
            la page. Trois mots en petites capitales, filet sous l'actif. */}
        {!enRecherche && (
          <div className="flex items-stretch justify-between gap-1 mb-2.5" role="group" aria-label="Classement">
            {CLASSEMENTS.map((c) => {
              const actif = classement === c.key
              const vide = c.key === 'miennes' && compteurs.miennes === 0
              return (
                <button
                  key={c.key}
                  onClick={() => setClassement(c.key)}
                  disabled={vide}
                  aria-pressed={actif}
                  className={
                    'flex-1 min-h-[44px] pb-1.5 font-book text-[10px] font-semibold uppercase tracking-[0.11em] whitespace-nowrap border-b transition-colors ' +
                    (actif
                      ? 'text-accent border-accent'
                      : vide
                        ? 'text-text2/30 border-transparent'
                        : 'text-text2 border-transparent')
                  }
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Filtres ──────────────────────────────────────────────────────── */}
        <div className="relative mb-1">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pr-6" role="group" aria-label="Filtres">
            {FILTRES.map((f) => {
              const actif = filtre === f.key
              const n = compteurs[f.key] ?? 0
              return (
                <button
                  key={f.key}
                  onClick={() => setFiltre(actif ? null : f.key)}
                  disabled={n === 0}
                  aria-pressed={actif}
                  className={
                    'flex-shrink-0 min-h-[44px] pb-1 font-book capitales text-[10px] whitespace-nowrap border-b transition-colors ' +
                    (actif
                      ? 'text-sage border-sage'
                      : n === 0
                        ? 'text-text2/25 border-transparent'
                        : 'text-text2 border-transparent')
                  }
                >
                  {f.label}
                  {n > 0 && <span className="elzevir ml-1 tracking-normal">{n}</span>}
                </button>
              )
            })}
          </div>
          <span
            className="absolute right-0 top-0 bottom-1 w-7 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgb(var(--c-bg)), transparent)' }}
            aria-hidden
          />
        </div>

        {/* ── Le corps du livret ───────────────────────────────────────────── */}
        {total === 0 ? (
          <div className="text-center py-14">
            <p className="font-book text-[19px] text-text1">Rien sous cette main.</p>
            <p className="font-book italic text-[15px] text-muted mt-1.5">
              {search ? 'Aucune recette de ce nom.' : 'Aucune recette ne répond à ce filtre.'}
            </p>
            <button
              onClick={() => { setSearch(''); setFiltre(null); setClassement('lettre') }}
              className="mt-5 min-h-[44px] font-book capitales text-[10.5px] text-accent border-b border-accent pb-1"
            >
              Revenir au livret
            </button>
          </div>
        ) : (
          <div>
            {sections.map((sec) => (
              <section
                key={sec.clef}
                ref={(el) => {
                  if (!sec.lettre) return
                  if (el) ancres.current.set(sec.lettre, el)
                  else ancres.current.delete(sec.lettre)
                }}
              >
                {sec.titre && (
                  sec.lettre ? (
                    /* Grande initiale : le repère qu'on cherche des yeux en
                       feuilletant.

                       Elle a été collante en haut un moment, et c'était une
                       erreur : deux en-têtes coexistaient pendant la
                       transition — B épinglé tandis que C arrivait — et la
                       ligne prise entre les deux était tranchée en son milieu.
                       La position est déjà donnée par la lettre marquée sur la
                       tranche. */
                    <div className="flex items-baseline gap-3 pt-5 pb-1.5">
                      <span className="font-book text-[27px] font-semibold text-evening leading-none">
                        {sec.titre}
                      </span>
                      <span className="flex-1 h-px bg-text2/25 mb-1.5" aria-hidden />
                      <span className="font-book elzevir text-[13px] text-text2/70 mb-1">
                        {sec.recettes.length}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3 pt-5 pb-1.5">
                      <h2 className="font-book capitales text-[11px] text-text2">{sec.titre}</h2>
                      <span className="flex-1 h-px bg-text2/25 mb-1" aria-hidden />
                    </div>
                  )
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

            {/* Cul-de-lampe : le livret se ferme sur un ornement. */}
            <div className="flex items-center justify-center gap-2 pt-7 pb-2" aria-hidden>
              <span className="w-8 h-px bg-text2/25" />
              <svg width="15" height="8" viewBox="0 0 17 9" fill="none" className="text-evening/45">
                <path d="M8.5 0.9 L10.6 4.5 L8.5 8.1 L6.4 4.5 Z" fill="currentColor" />
              </svg>
              <span className="w-8 h-px bg-text2/25" />
            </div>
          </div>
        )}
      </div>

      {/* ── La tranche ─────────────────────────────────────────────────────── */}
      {avecTranche && (
        <div className="fixed right-0 top-0 bottom-0 z-20 flex items-center pr-0.5 pointer-events-auto">
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
