import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import {
  DAY_SHORT, DAY_LONG, MONTHS,
  getMondayByOffset, getDayFromMonday, getTodayIndex, getWeekKey,
  cn,
} from '@/lib/utils'
import DayChip from './DayChip'
import DayView from './DayView'
import WeekOverview from './WeekOverview'
import { showToast } from '@/components/ui/Toast'

export default function PlanningPage() {
  const currentDayIdx    = useAppStore((s) => s.currentDayIdx)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)
  const weekOffset       = useAppStore((s) => s.weekOffset)
  const setWeekOffset    = useAppStore((s) => s.setWeekOffset)
  const weekPlans        = useAppStore((s) => s.weekPlans)
  const weekPlan         = useAppStore(selectCurrentWeekPlan)
  const clearWeek        = useAppStore((s) => s.clearWeek)
  const copyWeekFromOffset = useAppStore((s) => s.copyWeekFromOffset)

  const monday   = useMemo(() => getMondayByOffset(weekOffset), [weekOffset])
  const todayIdx = useMemo(() => getTodayIndex(monday), [monday])

  const [selectedIdx, setSelectedIdx] = useState(currentDayIdx >= 0 ? currentDayIdx : 0)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [displayIdx, setDisplayIdx] = useState(selectedIdx)
  const [weekSlideDir, setWeekSlideDir] = useState<'left' | 'right' | null>(null)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [clearWeekConfirm, setClearWeekConfirm] = useState(false)

  const handleClearWeek = () => {
    if (clearWeekConfirm) { clearWeek(); setClearWeekConfirm(false) }
    else { setClearWeekConfirm(true); setTimeout(() => setClearWeekConfirm(false), 3000) }
  }

  // Sync depuis store (ouverture via PickDay, etc.)
  useEffect(() => {
    if (currentDayIdx >= 0) setSelectedIdx(currentDayIdx)
  }, [currentDayIdx])

  // Reset le jour sélectionné quand on change de semaine
  useEffect(() => {
    const newIdx = todayIdx >= 0 ? todayIdx : 0
    setSelectedIdx(newIdx)
    setDisplayIdx(newIdx)
  }, [weekOffset, todayIdx])

  const changeWeek = useCallback((delta: number) => {
    const next = weekOffset + delta
    if (next < -4 || next > 8) return
    setWeekSlideDir(delta > 0 ? 'left' : 'right')
    setWeekOffset(next)
    setTimeout(() => setWeekSlideDir(null), 280)
  }, [weekOffset, setWeekOffset])

  const goToDay = useCallback((idx: number) => {
    if (idx === selectedIdx) return
    const dir = idx > selectedIdx ? 'left' : 'right'
    setSlideDir(dir)
    setSelectedIdx(idx)
    setCurrentDayIdx(idx)
    setTimeout(() => {
      setDisplayIdx(idx)
      setSlideDir(null)
    }, 220)
  }, [selectedIdx, setCurrentDayIdx])

  // ── Swipe handling ──────────────────────────────────────────────────────────
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontal = useRef(false)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontal.current = false
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (dx > dy && dx > 8) isHorizontal.current = true
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isHorizontal.current) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) {
      if (selectedIdx < 6) goToDay(selectedIdx + 1)
      else { changeWeek(1); setSelectedIdx(0); setDisplayIdx(0) }
    } else if (dx > 50) {
      if (selectedIdx > 0) goToDay(selectedIdx - 1)
      else { changeWeek(-1); setSelectedIdx(6); setDisplayIdx(6) }
    }
  }

  const weekLabel = useMemo(() => {
    const start = monday
    const end = getDayFromMonday(monday, 6)
    return `${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]}`
  }, [monday])

  const planCount = useMemo(() =>
    Object.values(weekPlan).reduce((acc, day) =>
      acc + (['midi', 'soir'] as const).filter((s) => day[s] !== null).length, 0
    ), [weekPlan])

  const hasPrevWeek = useMemo(() => {
    const prevKey = getWeekKey(getMondayByOffset(weekOffset - 1))
    return !!weekPlans[prevKey]
  }, [weekPlans, weekOffset])

  const selectedLabel = useMemo(() => {
    const d = getDayFromMonday(monday, selectedIdx)
    return `${DAY_LONG[selectedIdx]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  }, [monday, selectedIdx])

  const weekTitle = useMemo(() => {
    if (weekOffset === 0) return 'Cette semaine'
    if (weekOffset === 1) return 'Semaine prochaine'
    if (weekOffset === -1) return 'Semaine dernière'
    return weekOffset > 0 ? `Dans ${weekOffset} semaines` : `Il y a ${Math.abs(weekOffset)} semaines`
  }, [weekOffset])

  const handleShare = useCallback(() => {
    const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    const SLOT_LABELS: Record<string, string> = { pdej: 'Matin', midi: 'Midi', soir: 'Soir' }
    const lines: string[] = [`${weekTitle} (${weekLabel})`, '']
    for (let i = 0; i < 7; i++) {
      const day = weekPlan[i]
      if (!day) continue
      const slots = [
        { key: 'pdej', meal: day.pdej },
        { key: 'midi', meal: day.midi },
        { key: 'soir', meal: day.soir },
      ].filter((s) => s.meal)
      if (!slots.length) continue
      lines.push(`**${DAY_NAMES[i]}**`)
      slots.forEach(({ key, meal }) => {
        lines.push(`  ${SLOT_LABELS[key]} ${meal!.name}`)
      })
    }
    if (lines.length <= 2) { showToast('Planning vide — rien à partager !'); return }
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Planning copié !'))
  }, [weekPlan, weekTitle, weekLabel])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Safe-area top */}
      <div className="flex-shrink-0 pt-safe" />
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2">
        {/* Ligne 1 : Titre + actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-black text-text1 leading-tight">{weekTitle}</h1>
            <p className="text-[11px] font-semibold text-muted mt-0.5">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {weekOffset !== 0 && (
              <button
                onClick={() => { setWeekOffset(0); setWeekSlideDir(null) }}
                className="h-8 px-3 rounded-full text-[11px] font-black flex-shrink-0 active:scale-90 transition-transform bg-terra text-white"
              >
                Aujourd'hui
              </button>
            )}
            <button
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-muted active:scale-90 transition-transform"
              aria-label="Partager le planning"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
            <button
              onClick={() => setViewMode(v => v === 'day' ? 'week' : 'day')}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all active:scale-90 border',
                viewMode === 'week'
                  ? 'bg-terra text-white border-terra'
                  : 'bg-card text-muted border-border',
              )}
              aria-label={viewMode === 'week' ? 'Vue journalière' : 'Vue hebdomadaire'}
            >
              {viewMode === 'week' ? '▤' : '▦'}
            </button>
          </div>
        </div>

        {/* Ligne 2 : Nav semaine + compteur */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeWeek(-1)}
            aria-label="Semaine précédente"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-muted text-base font-bold leading-none active:scale-90 transition-transform"
          >
            ‹
          </button>
          <div className="flex-1" />
          {planCount > 0 && (
            <div className="flex items-center gap-1.5 mr-1">
              <div className="flex items-center gap-0.5">
                <div className="w-6 h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div className="h-full bg-terra rounded-full transition-all duration-500" style={{ width: `${Math.round((planCount / 14) * 100)}%` }} />
                </div>
              </div>
              <span className="text-[10px] font-black text-muted">{planCount}/14</span>
            </div>
          )}
          {planCount > 0 && (
            <button
              onClick={handleClearWeek}
              className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-full active:scale-90 transition-all',
                clearWeekConfirm ? 'bg-danger-light text-danger' : 'text-muted',
              )}
            >
              {clearWeekConfirm ? 'Confirmer ?' : 'Vider'}
            </button>
          )}
          <button
            onClick={() => changeWeek(1)}
            aria-label="Semaine suivante"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-muted text-base font-bold leading-none active:scale-90 transition-transform"
          >
            ›
          </button>
        </div>
      </div>

      {/* Zone scrollable interne */}
      <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain pb-nav-safe">
      {/* Day chips + contenu animé au changement de semaine */}
      <div className={cn(
        'transition-all duration-250 ease-out',
        weekSlideDir === 'left'  && 'animate-slide-left',
        weekSlideDir === 'right' && 'animate-slide-right',
      )}>

      {viewMode === 'week' ? (
        <WeekOverview
          selectedIdx={selectedIdx}
          onSelectDay={(idx) => { setSelectedIdx(idx); setCurrentDayIdx(idx); setViewMode('day') }}
        />
      ) : (
        <>
        {/* Day chips */}
        <div className="flex gap-1 px-5 pb-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = getDayFromMonday(monday, i)
            const day = weekPlan[i]
            return (
              <DayChip
                key={i}
                dayLabel={DAY_SHORT[i]}
                dayNum={d.getDate()}
                isToday={i === todayIdx}
                isSelected={i === selectedIdx}
                hasMidi={!!day?.midi}
                hasSoir={!!day?.soir}
                onClick={() => goToDay(i)}
              />
            )
          })}
        </div>

        {/* Label jour sélectionné */}
        <div className="px-5 pb-3 pt-1">
          <p className="text-[13px] font-extrabold text-text1 capitalize">{selectedLabel}</p>
        </div>

        {/* Day view avec swipe */}
        <div
          className="px-5 pb-6 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={cn(
              'transition-all duration-200 ease-out',
              slideDir === 'left'  && 'animate-slide-left',
              slideDir === 'right' && 'animate-slide-right',
            )}
          >
            <DayView dayIdx={displayIdx} />
          </div>

          {/* CTA copier semaine précédente */}
          {planCount === 0 && hasPrevWeek && (
            <button
              onClick={() => {
                copyWeekFromOffset(weekOffset - 1)
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-terra text-terra text-sm font-extrabold active:scale-[0.97] transition-transform"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
              Réutiliser la semaine précédente
            </button>
          )}
        </div>
        </>
      )}
      </div>
      </div>{/* /zone scrollable */}
    </div>
  )
}

