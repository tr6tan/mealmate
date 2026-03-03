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
    setWeekSlideDir(delta > 0 ? 'left' : 'right')
    setWeekOffset(weekOffset + delta)
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
      acc + (['pdej', 'midi', 'soir'] as const).filter((s) => day[s] !== null).length, 0
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
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        {/* Titre + nav semaine */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] font-black tracking-[0.12em] uppercase text-muted">Mon planning</p>
            <h1 className="text-[26px] font-black text-text1 leading-tight">{weekTitle}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            {planCount > 0 && (
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted active:scale-90 transition-transform"
                aria-label="Partager le planning"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
            )}
            <button
              onClick={() => setViewMode(v => v === 'day' ? 'week' : 'day')}
              className="w-8 h-8 flex items-center justify-center rounded-full text-base transition-all active:scale-90 border"
              style={viewMode === 'week'
                ? { background: '#D23D2D', color: '#fff', borderColor: '#D23D2D' }
                : { background: 'transparent', color: '#986C58', borderColor: '#D8C880' }}
            >
              {viewMode === 'week' ? '▤' : '▦'}
            </button>
          </div>
        </div>

        {/* Barre de navigation semaine */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeWeek(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted text-lg font-bold leading-none active:scale-90 transition-transform"
          >
            ‹
          </button>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <p className="text-[12px] text-muted font-semibold truncate">{weekLabel}</p>
            {planCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: '#D23D2D', background: '#D23D2D12', border: '1px solid #D23D2D25' }}>
                {planCount}/21
              </span>
            )}
            {weekOffset < 0 && (
              <span className="text-[10px] font-bold text-muted bg-sep px-2 py-0.5 rounded-full flex-shrink-0">
                Passé
              </span>
            )}
          </div>
          {weekOffset !== 0 && (
            <button
              onClick={() => { setWeekOffset(0); setWeekSlideDir(null) }}
              className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 active:scale-90 transition-transform"
              style={{ color: '#D23D2D', background: '#D23D2D14' }}
            >
              Auj.
            </button>
          )}
          {planCount > 0 && (
            <button
              onClick={handleClearWeek}
              className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 active:scale-90 transition-transform"
              style={clearWeekConfirm
                ? { color: '#C0304A', background: '#FDE8F0' }
                : { color: '#986C58', background: '#6E433D10' }}
            >
              {clearWeekConfirm ? 'Confirmer ?' : 'Vider'}
            </button>
          )}
          <button
            onClick={() => changeWeek(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted text-lg font-bold leading-none active:scale-90 transition-transform"
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
        <div className="flex gap-2.5 px-5 pb-4 overflow-x-auto no-scrollbar">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = getDayFromMonday(monday, i)
            const day = weekPlan[i]
            const hasMeal = day != null && (
              day.pdej !== null || day.midi !== null || day.soir !== null ||
              day.midi_entree !== null || day.midi_dessert !== null ||
              day.soir_entree !== null || day.soir_dessert !== null
            )
            return (
              <DayChip
                key={i}
                dayLabel={DAY_SHORT[i]}
                dayNum={d.getDate()}
                isToday={i === todayIdx}
                isSelected={i === selectedIdx}
                hasMeal={hasMeal}
                onClick={() => goToDay(i)}
              />
            )
          })}
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

