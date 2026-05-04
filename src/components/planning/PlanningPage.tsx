import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import {
  DAY_SHORT, DAY_LONG, MONTHS,
  getMondayByOffset, getDayFromMonday, getTodayIndex, getWeekKey,
  haptic, cn,
} from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import type { Meal, SlotKey } from '@/types'

export default function PlanningPage() {
  const weekPlan           = useAppStore(selectCurrentWeekPlan)
  const weekOffset         = useAppStore((s) => s.weekOffset)
  const setWeekOffset      = useAppStore((s) => s.setWeekOffset)
  const weekPlans          = useAppStore((s) => s.weekPlans)
  const copyWeekFromOffset = useAppStore((s) => s.copyWeekFromOffset)
  const openSheet          = useAppStore((s) => s.openSheet)
  const setMeal            = useAppStore((s) => s.setMeal)
  const recipes            = useAppStore((s) => s.recipes)

  const openMealDetail = useCallback((dayIdx: number, slotKey: SlotKey, meal: Meal) => {
    const recipe = recipes.find((r) => r.name === meal.name)
    if (recipe) {
      openSheet({ sheet: 'recipe-detail', recipeContext: recipe })
    } else {
      openSheet({ sheet: 'meal-actions', actionContext: { dayIdx, slotKey, meal } })
    }
  }, [recipes, openSheet])

  // -- Drag & Drop ---------------------------------------------------------
  type DragSrc = { dayIdx: number; slotKey: SlotKey; meal: Meal }
  const [dragSrc,    setDragSrc]    = useState<DragSrc | null>(null)
  const [dropTarget, setDropTarget] = useState<{ dayIdx: number; slotKey: SlotKey } | null>(null)
  const [touchGhost, setTouchGhost] = useState<{ meal: Meal; x: number; y: number } | null>(null)
  const longPressRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchSrcRef   = useRef<DragSrc | null>(null)
  const dropRef       = useRef<{ dayIdx: number; slotKey: SlotKey } | null>(null)
  const wasDraggingRef = useRef(false)

  const performDrop = useCallback((from: DragSrc, toDay: number, toSlot: SlotKey) => {
    if (from.dayIdx === toDay && from.slotKey === toSlot) return
    const toMeal = (weekPlan[toDay]?.[toSlot] as Meal | null) ?? null
    setMeal(toDay, toSlot, from.meal)
    setMeal(from.dayIdx, from.slotKey, toMeal)
    haptic([10, 20, 10])
  }, [weekPlan, setMeal])
  // -------------------------------------------------------------------------

  const monday   = useMemo(() => getMondayByOffset(weekOffset), [weekOffset])
  const todayIdx = useMemo(() => getTodayIndex(monday), [monday])

  const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({})

  useEffect(() => { setCollapsedDays({}) }, [weekOffset])

  const changeWeek = useCallback((delta: number) => {
    const next = weekOffset + delta
    if (next < -4 || next > 8) return
    setWeekOffset(next)
  }, [weekOffset, setWeekOffset])

  const weekLabel = useMemo(() => {
    const end = getDayFromMonday(monday, 6)
    return `${monday.getDate()} ${MONTHS[monday.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`
  }, [monday])

  const weekTitle = useMemo(() => {
    if (weekOffset === 0) return 'Cette semaine'
    if (weekOffset === 1) return 'Semaine prochaine'
    if (weekOffset === -1) return 'Semaine dernière'
    return weekOffset > 0 ? `Dans ${weekOffset} semaines` : `Il y a ${Math.abs(weekOffset)} semaines`
  }, [weekOffset])

  const planCount = useMemo(() =>
    Object.values(weekPlan).reduce((acc, day) =>
      acc + (['midi', 'soir'] as const).filter((s) => day[s] !== null).length, 0
    ), [weekPlan])

  const hasPrevWeek = useMemo(() => {
    const prevKey = getWeekKey(getMondayByOffset(weekOffset - 1))
    return !!weekPlans[prevKey]
  }, [weekPlans, weekOffset])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain">
      <div className="flex-shrink-0 pt-safe" />
      <div className="px-5 pt-4 pb-nav-safe">

        {/* Week nav */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => changeWeek(-1)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl font-bold text-neutral-600 active:scale-90 transition-transform"
            aria-label="Semaine précédente"
          ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div
            className="flex-1 text-center cursor-pointer"
            onClick={() => weekOffset !== 0 && setWeekOffset(0)}
          >
            <p className="text-xs text-muted font-semibold">{weekTitle}</p>
            <p className="text-[15px] font-semibold text-text1">{weekLabel}</p>
          </div>
          <button
            onClick={() => changeWeek(1)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-xl font-bold text-neutral-600 active:scale-90 transition-transform"
            aria-label="Semaine suivante"
          ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>

        {/* 7 day cards */}
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const date = getDayFromMonday(monday, dayIdx)
            const isToday = weekOffset === 0 && dayIdx === todayIdx
            const isPast = date.getTime() < today.getTime() && !isToday
            const collapsed = collapsedDays[dayIdx] ?? isPast
            const toggleDay = () => setCollapsedDays(c => ({ ...c, [dayIdx]: !(c[dayIdx] ?? isPast) }))
            const plan = weekPlan[dayIdx]
            const midiMeal = plan?.midi ?? null
            const soirMeal = plan?.soir ?? null

            if (collapsed) {
              return (
                <button
                  key={dayIdx}
                  onClick={toggleDay}
                  className="w-full rounded-2xl px-4 py-2.5 glass-subtle flex items-center gap-3 active:opacity-70 transition-opacity text-left"
                >
                  <span className="text-[11px] font-bold text-muted tabular-nums w-16 shrink-0">
                    {DAY_SHORT[dayIdx]}. {date.getDate()}
                  </span>
                  <div className="flex-1 h-px bg-white/50 rounded-full" />
                  {[midiMeal, soirMeal].filter(Boolean).map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: 'rgba(0,24,168,0.35)' }}
                    />
                  ))}
                  <svg className="w-3 h-3 text-muted/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              )
            }

            const cardClass = isToday
              ? 'rounded-3xl p-4'
              : isPast
              ? 'glass-subtle rounded-3xl p-4'
              : 'glass rounded-3xl p-4'

            return (
              <div
                key={dayIdx}
                className={cardClass}
                style={isToday ? { background: '#0018A8', boxShadow: '0 12px 32px rgba(0,24,168,0.35)' } : undefined}
              >
                {/* Day header – tap to collapse */}
                <div
                  className="flex items-center gap-3 mb-3 cursor-pointer select-none active:opacity-70 transition-opacity"
                  onClick={toggleDay}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0',
                    isToday ? 'bg-white/20' : 'bg-white/50',
                  )}>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-white/70' : 'text-muted'}`}>
                      {DAY_SHORT[dayIdx]}
                    </span>
                    <span className={`text-[17px] font-black leading-none ${isToday ? 'text-white' : 'text-text1'}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-text2'}`}>
                      {DAY_LONG[dayIdx]}
                    </p>
                    {isToday && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-white text-[#0018A8] rounded-full text-[10px] font-bold">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isToday ? 'text-white/60' : 'text-muted/50'}`}
                    style={{ transform: 'rotate(180deg)' }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {/* Meal slots – 2-col grid */}
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { slotKey: 'midi' as const, label: 'Déjeuner', meal: midiMeal },
                    { slotKey: 'soir' as const, label: 'Dîner',    meal: soirMeal },
                  ]).map(({ slotKey, label, meal }) => (
                    <div
                      key={slotKey}
                      data-slot
                      data-day-idx={dayIdx}
                      data-slot-key={slotKey}
                      /* -- HTML5 DnD (desktop) -- */
                      draggable={!!meal}
                      onDragStart={(e) => {
                        if (!meal) return
                        setDragSrc({ dayIdx, slotKey, meal })
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => { setDragSrc(null); setDropTarget(null) }}
                      onDragOver={(e) => {
                        if (!dragSrc) return
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDropTarget({ dayIdx, slotKey })
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        if (dragSrc) performDrop(dragSrc, dayIdx, slotKey)
                        setDragSrc(null); setDropTarget(null)
                      }}
                      /* -- Touch DnD (mobile) long-press -- */
                      onTouchStart={(e) => {
                        if (!meal) return
                        const t = e.touches[0]
                        longPressRef.current = setTimeout(() => {
                          touchSrcRef.current = { dayIdx, slotKey, meal }
                          setTouchGhost({ meal, x: t.clientX, y: t.clientY })
                          haptic([10])
                        }, 300)
                      }}
                      onTouchMove={(e) => {
                        if (!touchSrcRef.current) { clearTimeout(longPressRef.current!); return }
                        const t = e.touches[0]
                        setTouchGhost((g) => g ? { ...g, x: t.clientX, y: t.clientY } : null)
                        const el = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-slot]')
                        if (el) {
                          const dt = {
                            dayIdx: parseInt(el.getAttribute('data-day-idx') ?? '-1'),
                            slotKey: el.getAttribute('data-slot-key') as SlotKey,
                          }
                          dropRef.current = dt
                          setDropTarget(dt)
                        } else {
                          dropRef.current = null
                          setDropTarget(null)
                        }
                      }}
                      onTouchEnd={() => {
                        clearTimeout(longPressRef.current!)
                        if (touchSrcRef.current && dropRef.current) {
                          wasDraggingRef.current = true
                          performDrop(touchSrcRef.current, dropRef.current.dayIdx, dropRef.current.slotKey)
                        }
                        touchSrcRef.current = null; dropRef.current = null
                        setTouchGhost(null); setDropTarget(null)
                      }}
                      onTouchCancel={() => {
                        clearTimeout(longPressRef.current!)
                        touchSrcRef.current = null; dropRef.current = null
                        setTouchGhost(null); setDropTarget(null)
                      }}
                      onClick={() => {
                        if (wasDraggingRef.current) { wasDraggingRef.current = false; return }
                        meal
                          ? openMealDetail(dayIdx, slotKey, meal)
                          : openSheet({ sheet: 'add-meal', addMealPeriod: slotKey, mealContext: { dayIdx, slotKey } })
                      }}
                      style={{ touchAction: meal ? 'none' : 'auto' }}
                      className={cn(
                        'min-h-[88px] rounded-2xl p-3 relative overflow-hidden cursor-pointer select-none transition',
                        isToday ? 'bg-white/15 active:bg-white/25' : 'bg-white/40 backdrop-blur active:bg-white/60',
                        dragSrc?.dayIdx === dayIdx && dragSrc?.slotKey === slotKey && 'opacity-40 scale-95',
                        dropTarget?.dayIdx === dayIdx && dropTarget?.slotKey === slotKey && 'ring-2 ring-[#0018A8]/50 ring-inset',
                      )}
                    >
                      <div className={`text-[10px] uppercase tracking-wide mb-1 font-medium ${isToday ? 'text-white/70' : 'text-muted'}`}>
                        {label}
                      </div>

                      {meal ? (
                        <>
                          <p className={`text-[13px] font-semibold leading-tight pr-6 ${isToday ? 'text-white' : 'text-text1'}`}>
                            {meal.name}
                          </p>
                          {meal.emoji && (
                            <div
                              className="absolute -bottom-2 -right-2 text-[58px] leading-none pointer-events-none select-none"
                              style={{ opacity: isToday ? 0.15 : 0.11 }}
                            >
                              {meal.emoji}
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setMeal(dayIdx, slotKey, null) }}
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center"
                          >
                            <svg className="w-2.5 h-2.5 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <div className={`flex items-center gap-1.5 text-sm ${isToday ? 'text-white/60' : 'text-neutral-400'}`}>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Ajouter
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* -- Touch drag ghost -- */}
        {touchGhost && (
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{ left: touchGhost.x - 36, top: touchGhost.y - 36 }}
          >
            <div
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[36px] shadow-2xl"
              style={{ background: '#0018A8', opacity: 0.92, transform: 'scale(1.08)' }}
            >
              {touchGhost.meal.emoji || touchGhost.meal.name.slice(0, 1)}
            </div>
          </div>
        )}

        {planCount === 0 && hasPrevWeek && (
          <button
            onClick={() => { copyWeekFromOffset(weekOffset - 1); showToast('Semaine copiée !') }}
            className="mt-4 w-full glass rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-text2 active:scale-[0.97] transition-transform"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Réutiliser la semaine précédente
          </button>
        )}
      </div>
    </div>
  )
}
