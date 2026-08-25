import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import MealAvatar from '@/components/ui/MealAvatar'

// ── Icônes ───────────────────────────────────────────────────────────────────
const IcoClose   = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoChevR   = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
const IcoChevL   = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcoPlay    = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IcoPause   = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IcoReset   = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function CookingSheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const recipe = sheetState.recipeContext
  const isOpen = sheetState.sheet === 'cook-mode'

  const steps = recipe?.steps ?? []
  const hasSteps = steps.length > 0

  const [stepIdx, setStepIdx] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef    = useRef<number>(0)
  const baseRef     = useRef<number>(0)

  // Reset quand on ouvre
  useEffect(() => {
    if (isOpen) {
      setStepIdx(0)
      setElapsed(0)
      setRunning(false)
      baseRef.current = 0
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isOpen])

  // Chrono
  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      intervalRef.current = setInterval(() => {
        setElapsed(baseRef.current + Date.now() - startRef.current)
      }, 100)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      baseRef.current = elapsed
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const resetChrono = () => {
    setRunning(false)
    setElapsed(0)
    baseRef.current = 0
  }

  const goNext = useCallback(() => {
    if (stepIdx < steps.length - 1) setStepIdx((i) => i + 1)
  }, [stepIdx, steps.length])

  const goPrev = useCallback(() => {
    if (stepIdx > 0) setStepIdx((i) => i - 1)
  }, [stepIdx])

  // Swipe horizontal
  const touchStartX = useRef<number>(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  if (!isOpen || !recipe) return null

  const isDone = stepIdx === steps.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgb(var(--c-terra))' }}
    >
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {recipe.emoji
            ? <span className="text-3xl leading-none">{recipe.emoji}</span>
            : <MealAvatar name={recipe.name} size="md" />}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white/60 leading-none mb-0.5">En cuisine</p>
            <p className="text-[16px] font-bold text-white leading-tight truncate">{recipe.name}</p>
          </div>
        </div>
        <button
          onClick={closeSheet}
          aria-label="Quitter le mode cuisine"
          className="w-9 h-9 rounded-full bg-fill/15 flex items-center justify-center text-white active:bg-fill/25 transition shrink-0"
        >
          <IcoClose />
        </button>
      </div>

      {/* ── CHRONO ── */}
      <div className="flex items-center justify-center gap-4 py-3 shrink-0">
        <button
          onClick={resetChrono}
          aria-label="Remettre le minuteur à zéro"
          className="w-9 h-9 rounded-full bg-fill/10 flex items-center justify-center text-white/70 active:bg-fill/20"
        >
          <IcoReset />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-fill/15 active:bg-fill/25 transition"
        >
          <span className="text-white/70">{running ? <IcoPause /> : <IcoPlay />}</span>
          <span
            className="text-[28px] font-bold text-white tabular-nums leading-none"
            style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}
          >
            {formatTime(elapsed)}
          </span>
        </button>
      </div>

      {/* ── ÉTAPES ── */}
      {hasSteps ? (
        <>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 py-2 shrink-0">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIdx(i)}
                className="transition-all"
                style={{
                  width: i === stepIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === stepIdx ? 'white' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>

          {/* Step card — swipeable */}
          <div
            className="flex-1 flex flex-col px-5 py-4 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="flex-1 rounded-[28px] flex flex-col px-6 py-6"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              {/* Numéro */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0"
                >
                  <span className="text-[15px] font-black" style={{ color: 'rgb(var(--c-terra))' }}>{stepIdx + 1}</span>
                </div>
                <span className="text-[13px] font-semibold text-white/50">
                  Étape {stepIdx + 1} sur {steps.length}
                </span>
              </div>

              {/* Texte de l'étape */}
              <p className="text-[20px] font-semibold text-white leading-relaxed flex-1">
                {steps[stepIdx]}
              </p>
            </div>
          </div>

          {/* Nav prev / next */}
          <div className="flex items-center gap-3 px-5 pb-safe pb-6 shrink-0">
            <button
              onClick={goPrev}
              disabled={stepIdx === 0}
              className="flex-1 py-4 rounded-2xl flex items-center justify-center text-white transition active:scale-95"
              style={{ background: stepIdx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)', opacity: stepIdx === 0 ? 0.4 : 1 }}
            >
              <IcoChevL />
              <span className="text-[15px] font-bold ml-1">Précédent</span>
            </button>

            {isDone ? (
              <button
                onClick={closeSheet}
                className="flex-1 py-4 rounded-2xl flex items-center justify-center text-terra text-[15px] font-bold bg-white active:scale-95 transition"
              >
                Terminé 🎉
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex-1 py-4 rounded-2xl flex items-center justify-center text-terra text-[15px] font-bold bg-white active:scale-95 transition"
              >
                <span>Suivant</span>
                <IcoChevR />
              </button>
            )}
          </div>
        </>
      ) : (
        /* Pas d'étapes — juste le chrono */
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-white/60 text-[15px] font-medium">
            Cette recette n'a pas d'étapes détaillées.
          </p>
          <button
            onClick={closeSheet}
            className="px-8 py-4 rounded-2xl bg-white text-terra text-[15px] font-bold active:scale-95 transition"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  )
}
