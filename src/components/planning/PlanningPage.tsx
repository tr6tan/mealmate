import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import {
  DAY_SHORT, DAY_LONG, MONTHS,
  getMondayByOffset, getDayFromMonday, getTodayIndex,
  cn,
} from '@/lib/utils'
import DayChip from './DayChip'
import DayView from './DayView'

export default function PlanningPage() {
  const currentDayIdx  = useAppStore((s) => s.currentDayIdx)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)
  const weekOffset     = useAppStore((s) => s.weekOffset)
  const setWeekOffset  = useAppStore((s) => s.setWeekOffset)
  const weekPlan       = useAppStore(selectCurrentWeekPlan)

  const monday    = useMemo(() => getMondayByOffset(weekOffset), [weekOffset])
  const todayIdx  = useMemo(() => getTodayIndex(monday), [monday])

  const [selectedIdx, setSelectedIdx] = useState(currentDayIdx >= 0 ? currentDayIdx : 0)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [displayIdx, setDisplayIdx] = useState(selectedIdx)

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
    if (dx < -50 && selectedIdx < 6) goToDay(selectedIdx + 1)
    else if (dx > 50 && selectedIdx > 0) goToDay(selectedIdx - 1)
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
            onClick={() => setWeekOffset(weekOffset - 1)}
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
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg2 text-text1 text-base font-bold leading-none active:scale-90 transition-transform"
            aria-label="Semaine suivante"
          >
            ›
          </button>

          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[11px] font-bold text-terra bg-terra-light px-2 py-1 rounded-full active:scale-90 transition-transform"
            >
              Auj.
            </button>
          )}
        </div>
      </div>

      {/* Day chips */}
      <div className="flex gap-2.5 px-5 pb-4 overflow-x-auto no-scrollbar">
        {Array.from({ length: 7 }).map((_, i) => {
          const d = getDayFromMonday(monday, i)
          return (
            <DayChip
              key={i}
              dayLabel={DAY_SHORT[i]}
              dayNum={d.getDate()}
              isToday={i === todayIdx}
              isSelected={i === selectedIdx}
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
      </div>
    </div>
  )
}

