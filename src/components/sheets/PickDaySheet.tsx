import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, SlotKey } from '@/types'
import { DAY_SHORT, PERIOD_LABEL, MONTHS, getMondayByOffset, getDayFromMonday, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

const PERIODS: Period[] = ['pdej', 'midi', 'soir']
const SLOT_MAP: Record<Period, SlotKey> = { pdej: 'pdej', midi: 'midi', soir: 'soir' }

export default function PickDaySheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const setMeal = useAppStore((s) => s.setMeal)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setWeekOffset = useAppStore((s) => s.setWeekOffset)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const currentDayIdx = useAppStore((s) => s.currentDayIdx)
  const storeWeekOffset = useAppStore((s) => s.weekOffset)

  const [pickedDay, setPickedDay] = useState(currentDayIdx >= 0 ? currentDayIdx : 0)
  const [pickedPeriod, setPickedPeriod] = useState<Period>('midi')
  const [localOffset, setLocalOffset] = useState(storeWeekOffset)

  const recipe = sheetState.pickDayContext?.recipe
  if (!recipe) return <BottomSheet name="pick-day"><div /></BottomSheet>

  const monday = getMondayByOffset(localOffset)

  const weekLabel = (() => {
    if (localOffset === 0) return 'Cette semaine'
    if (localOffset === 1) return 'Semaine prochaine'
    if (localOffset === -1) return 'Semaine dernière'
    return localOffset > 0 ? `Dans ${localOffset} semaines` : `Il y a ${Math.abs(localOffset)} semaines`
  })()

  const handleConfirm = () => {
    setWeekOffset(localOffset)
    setMeal(pickedDay, SLOT_MAP[pickedPeriod], {
      name: recipe.name,
      emoji: recipe.emoji,
      time: recipe.time,
      fav: recipe.fav,
    })
    setCurrentDayIdx(pickedDay)
    setActiveTab('planning')
    closeSheet()
    showToast(`${recipe.name} ajouté au planning !`)
  }

  return (
    <BottomSheet name="pick-day">
      <h2 className="text-[17px] font-extrabold text-text1 truncate mb-4">
        Ajouter au planning : {recipe.name}
      </h2>

      {/* Navigation semaine */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setLocalOffset(localOffset - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg2 text-text1 text-lg font-bold active:scale-90 transition-transform"
        >‹</button>
        <div className="text-center">
          <p className="text-[13px] font-extrabold text-terra">{weekLabel}</p>
        </div>
        <button
          onClick={() => setLocalOffset(localOffset + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-bg2 text-text1 text-lg font-bold active:scale-90 transition-transform"
        >›</button>
      </div>

      {/* Jour */}
      <p className="text-xs font-bold text-muted mb-2">Quel jour ?</p>
      <div className="flex gap-1.5 flex-wrap mb-5">
        {DAY_SHORT.map((label, i) => {
          const d = getDayFromMonday(monday, i)
          return (
            <button
              key={i}
              onClick={() => setPickedDay(i)}
              className={cn(
                'flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 min-w-[44px]',
                pickedDay === i
                  ? 'bg-terra border-terra text-white'
                  : 'bg-card border-border text-muted',
              )}
            >
              <span>{label}</span>
              <span className="text-[11px] font-black">{d.getDate()} {MONTHS[d.getMonth()]}</span>
            </button>
          )
        })}
      </div>

      {/* Période */}
      <p className="text-xs font-bold text-muted mb-2">Quelle période ?</p>
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPickedPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200',
              pickedPeriod === p
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full py-3.5 bg-terra text-white rounded-2xl text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
      >
        Ajouter au planning
      </button>
    </BottomSheet>
  )
}
