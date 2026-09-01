import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useWakeLock } from '@/hooks/useWakeLock'
import { lireDuree } from '@/lib/dureeEtape'
import { scaleQty } from '@/lib/utils'

/**
 * Mode cuisine : une étape à la fois, écran maintenu allumé.
 *
 * Trois manques rendaient l'écran peu utilisable aux fourneaux : l'écran
 * s'éteignait au bout de quelques dizaines de secondes, les ingrédients
 * n'étaient consultables qu'en ressortant de la recette, et le minuteur
 * démarrait à zéro sans rien savoir des durées annoncées dans les étapes.
 */

const IcoClose = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)
const IcoChevR = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
)
const IcoChevL = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
)
const IcoPlay = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
)
const IcoPause = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
)
const IcoReset = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
)
const IcoList = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
)

function formatTime(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const h = Math.floor(m / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CookingSheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const personnes = useAppStore((s) => s.settings.personnes)

  const recipe = sheetState.recipeContext
  const isOpen = sheetState.sheet === 'cook-mode'

  const steps = useMemo(() => recipe?.steps ?? [], [recipe])
  const ingredients = useMemo(() => recipe?.ingredients ?? [], [recipe])
  const hasSteps = steps.length > 0

  const [stepIdx, setStepIdx] = useState(0)
  const [ingredientsOuverts, setIngredientsOuverts] = useState(false)

  // Minuteur : compte à rebours quand l'étape annonce une durée, chronomètre
  // sinon. `cible` à 0 signifie « pas de durée connue ».
  const [cible, setCible] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)
  const baseRef = useRef(0)

  // L'écran reste allumé tant que le mode cuisine est ouvert.
  useWakeLock(isOpen)

  const dureeEtape = useMemo(() => lireDuree(steps[stepIdx] ?? ''), [steps, stepIdx])

  useEffect(() => {
    if (isOpen) {
      setStepIdx(0)
      setElapsed(0)
      setRunning(false)
      setCible(0)
      setIngredientsOuverts(false)
      baseRef.current = 0
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isOpen])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setElapsed(baseRef.current + Date.now() - startRef.current)
      }, 200)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      baseRef.current = elapsed
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const restant = cible > 0 ? cible * 1000 - elapsed : 0
  const termine = cible > 0 && restant <= 0

  // Fin du compte à rebours : on s'arrête et on vibre, sans son (le téléphone
  // est souvent en silencieux et l'app n'a pas de permission audio).
  useEffect(() => {
    if (termine && running) {
      setRunning(false)
      try {
        navigator.vibrate?.([200, 100, 200, 100, 400])
      } catch {
        /* non supporté */
      }
    }
  }, [termine, running])

  const resetChrono = () => {
    setRunning(false)
    setElapsed(0)
    baseRef.current = 0
  }

  const lancerDuree = (secondes: number) => {
    setCible(secondes)
    setElapsed(0)
    baseRef.current = 0
    setRunning(true)
  }

  const goNext = useCallback(() => {
    setStepIdx((i) => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  const goPrev = useCallback(() => {
    setStepIdx((i) => Math.max(i - 1, 0))
  }, [])

  const touchStartX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  if (!isOpen || !recipe) return null

  const isDone = stepIdx === steps.length - 1
  const affichage = cible > 0 ? formatTime(Math.max(0, restant)) : formatTime(elapsed)

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgb(var(--c-terra))' }}>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-safe pt-4 pb-2 shrink-0">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white/55 tracking-[0.1em] uppercase leading-none mb-1">
            En cuisine
          </p>
          <p className="text-[17px] font-bold text-white leading-tight truncate">{recipe.name}</p>
        </div>
        <button
          onClick={closeSheet}
          aria-label="Quitter le mode cuisine"
          className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white active:bg-white/25 transition shrink-0"
        >
          <IcoClose />
        </button>
      </div>

      {hasSteps ? (
        <>
          {/* ── Progression ───────────────────────────────────────────────── */}
          <div className="flex justify-center gap-1.5 py-3 shrink-0" role="group" aria-label="Étapes">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIdx(i)}
                aria-label={`Étape ${i + 1}`}
                aria-current={i === stepIdx}
                className="py-2"
              >
                <span
                  className="block transition-all"
                  style={{
                    width: i === stepIdx ? 22 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: i <= stepIdx ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                />
              </button>
            ))}
          </div>

          {/* ── Étape ─────────────────────────────────────────────────────── */}
          <div
            className="flex-1 min-h-0 flex flex-col px-5 pb-2 overflow-y-auto no-scrollbar"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <p className="text-[12px] font-bold text-white/50 tracking-[0.08em] uppercase mb-3">
              Étape {stepIdx + 1} sur {steps.length}
            </p>
            {/*
              Le texte occupe la page, sans carte : une étape de deux lignes
              flottait au sommet d'un cadre de 1100px de haut.
            */}
            <p className="text-[26px] font-semibold text-white leading-[1.35] tracking-[-0.01em]">
              {steps[stepIdx]}
            </p>

            {/* Durée repérée dans l'étape : un geste pour la lancer */}
            {dureeEtape && cible !== dureeEtape.secondes && (
              <button
                onClick={() => lancerDuree(dureeEtape.secondes)}
                className="self-start mt-6 flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full bg-white text-[14px] font-bold active:scale-95 transition-transform"
                style={{ color: 'rgb(var(--c-terra))' }}
              >
                <IcoPlay />
                Lancer {dureeEtape.libelle}
              </button>
            )}
          </div>

          {/* ── Ingrédients, dépliables sans quitter l'étape ──────────────── */}
          {ingredients.length > 0 && (
            <div className="px-5 shrink-0">
              <button
                onClick={() => setIngredientsOuverts((v) => !v)}
                aria-expanded={ingredientsOuverts}
                className="w-full flex items-center gap-2 py-3 text-white/75 text-[13px] font-bold active:opacity-70"
              >
                <IcoList />
                Ingrédients ({ingredients.length})
                <span className="ml-auto text-white/50">{ingredientsOuverts ? '−' : '+'}</span>
              </button>
              {ingredientsOuverts && (
                <ul className="pb-3 max-h-[30vh] overflow-y-auto no-scrollbar">
                  {ingredients.map((ing, i) => (
                    <li
                      key={`${ing.name}-${i}`}
                      className="flex justify-between gap-4 py-2 border-b border-white/10 last:border-0"
                    >
                      <span className="text-[15px] text-white/90">{ing.name}</span>
                      <span className="text-[14px] font-semibold text-white/60 tabular-nums flex-shrink-0">
                        {scaleQty(ing.qty, personnes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Minuteur ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-3 px-5 py-2 shrink-0">
            <button
              onClick={resetChrono}
              aria-label="Remettre le minuteur à zéro"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:bg-white/20"
            >
              <IcoReset />
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? 'Mettre le minuteur en pause' : 'Démarrer le minuteur'}
              className="flex items-center gap-3 px-5 py-2.5 min-h-[44px] rounded-full transition"
              style={{ background: termine ? '#fff' : 'rgba(255,255,255,0.15)' }}
            >
              <span style={{ color: termine ? 'rgb(var(--c-terra))' : 'rgba(255,255,255,0.7)' }}>
                {running ? <IcoPause /> : <IcoPlay />}
              </span>
              <span
                className="text-[26px] font-bold tabular-nums leading-none"
                style={{
                  color: termine ? 'rgb(var(--c-terra))' : '#fff',
                  fontFeatureSettings: '"tnum"',
                }}
                aria-live={termine ? 'assertive' : 'off'}
              >
                {termine ? 'Prêt !' : affichage}
              </span>
            </button>
          </div>

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-5 pb-safe pb-5 shrink-0">
            <button
              onClick={goPrev}
              disabled={stepIdx === 0}
              className="flex-1 py-4 min-h-[52px] rounded-2xl flex items-center justify-center text-white transition active:scale-95 disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <IcoChevL />
              <span className="text-[15px] font-bold ml-1">Précédent</span>
            </button>
            <button
              onClick={isDone ? closeSheet : goNext}
              className="flex-1 py-4 min-h-[52px] rounded-2xl flex items-center justify-center bg-white text-[15px] font-bold active:scale-95 transition"
              style={{ color: 'rgb(var(--c-terra))' }}
            >
              {isDone ? 'Terminé' : <><span>Suivant</span><IcoChevR /></>}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-white/70 text-[15px] font-medium">
            Cette recette n’a pas d’étapes détaillées.
          </p>
          <button
            onClick={closeSheet}
            className="px-8 py-4 min-h-[52px] rounded-2xl bg-white text-[15px] font-bold active:scale-95 transition"
            style={{ color: 'rgb(var(--c-terra))' }}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}
