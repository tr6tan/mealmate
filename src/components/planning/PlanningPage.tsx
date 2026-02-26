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

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-black text-text1">Planning</h1>

        {/* Navigation semaines */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => changeWeek(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg2 text-text1 text-base font-bold leading-none active:scale-90 transition-transform"
            aria-label="Semaine précédente"
          >
            ‹
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-extrabold text-terra truncate">{weekTitle}</p>
            <p className="text-[12px] text-muted font-semibold">
              {weekLabel}
              {planCount > 0 && (
                <span className="ml-2 text-[11px] font-bold text-terra bg-terra-light px-2 py-0.5 rounded-full">
                  {planCount}/21
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => changeWeek(1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg2 text-text1 text-base font-bold leading-none active:scale-90 transition-transform"
            aria-label="Semaine suivante"
          >
            ›
          </button>

          {weekOffset !== 0 && (
            <button
              onClick={() => { setWeekOffset(0); setWeekSlideDir(null) }}
              className="text-[11px] font-bold text-terra bg-terra-light px-2 py-1 rounded-full active:scale-90 transition-transform"
            >
              Auj.
            </button>
          )}

          <button
            onClick={() => setViewMode(v => v === 'day' ? 'week' : 'day')}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full text-base transition-all active:scale-90',
              viewMode === 'week' ? 'bg-terra text-white' : 'bg-bg2 text-text1',
            )}
            aria-label={viewMode === 'week' ? 'Vue jour' : 'Vue semaine'}
            title={viewMode === 'week' ? 'Vue jour' : 'Vue semaine'}
          >
            {viewMode === 'week' ? '▤' : '▦'}
          </button>

          {planCount > 0 && (
            <button
              onClick={() => { if (window.confirm('Vider toute la semaine ?')) clearWeek() }}
              className="text-[11px] font-bold text-[#C0304A] bg-[#FFF0F0] px-2 py-1 rounded-full active:scale-90 transition-transform"
            >
              Vider
            </button>
          )}
        </div>
      </div>

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
          <div className="text-[17px] font-extrabold text-text1 mb-3 pl-2.5 border-l-[3px] border-terra">
            {selectedLabel}
          </div>
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
              <span>♻️</span> Réutiliser la semaine précédente
            </button>
          )}
        </div>
        </>
      )}
      </div>
    </div>
  )
}

