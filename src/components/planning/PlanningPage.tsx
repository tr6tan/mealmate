import { useMemo, useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  DAY_SHORT, DAY_LONG, MONTHS,
  getWeekMonday, getDayFromMonday, getTodayIndex,
  cn,
} from '@/lib/utils'
import DayChip from './DayChip'
import DayView from './DayView'
import type { Period } from '@/types'

export default function PlanningPage() {
  const currentDayIdx = useAppStore((s) => s.currentDayIdx)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)
  const openSheet = useAppStore((s) => s.openSheet)
  const weekPlan = useAppStore((s) => s.weekPlan)

  const monday = useMemo(() => getWeekMonday(), [])
  const todayIdx = useMemo(() => getTodayIndex(monday), [monday])

  // Si currentDayIdx pas encore initialisé
  const [selectedIdx, setSelectedIdx] = useState(currentDayIdx >= 0 ? currentDayIdx : 0)
  useEffect(() => {
    if (currentDayIdx >= 0) setSelectedIdx(currentDayIdx)
  }, [currentDayIdx])

  const handleSelectDay = (idx: number) => {
    setSelectedIdx(idx)
    setCurrentDayIdx(idx)
  }

  const weekLabel = useMemo(() => {
    const start = monday
    const end = getDayFromMonday(monday, 6)
    return `Semaine du ${start.getDate()} ${MONTHS[start.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]}`
  }, [monday])

  const planCount = useMemo(() =>
    Object.values(weekPlan).reduce((acc, day) =>
      acc + (['pdej', 'midi', 'soir'] as const).filter((s) => day[s] !== null).length, 0
    ), [weekPlan])

  const selectedLabel = useMemo(() => {
    const d = getDayFromMonday(monday, selectedIdx)
    return `${DAY_LONG[selectedIdx]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  }, [monday, selectedIdx])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-text1">Planning</h1>
          <p className="text-[13px] text-muted font-semibold mt-0.5">
            {weekLabel}
            {planCount > 0 && (
              <span className="ml-2 text-[11px] font-bold text-terra bg-terra-light px-2 py-0.5 rounded-full">
                {planCount}/21
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => openSheet({ sheet: 'add-meal', addMealPeriod: 'midi', mealContext: { dayIdx: selectedIdx, slotKey: 'midi' } })}
          className="w-10 h-10 rounded-full bg-terra text-white flex items-center justify-center text-xl font-bold shadow-terra-sm active:scale-95 transition-transform"
          aria-label="Ajouter un repas"
        >
          +
        </button>
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
              onClick={() => handleSelectDay(i)}
            />
          )
        })}
      </div>

      {/* Day view */}
      <div className="px-5 pb-6">
        <div className="text-[17px] font-extrabold text-text1 mb-3 pl-2.5 border-l-[3px] border-terra">
          {selectedLabel}
        </div>
        <DayView dayIdx={selectedIdx} />
      </div>
    </div>
  )
}
