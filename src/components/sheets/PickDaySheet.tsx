import { useState } from 'react'
import BottomSheet from '@/components/ui/BottomSheet'
import { useAppStore } from '@/store/useAppStore'
import type { Period, SlotKey } from '@/types'
import { DAY_SHORT, PERIOD_LABEL, cn } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'

const PERIODS: Period[] = ['pdej', 'midi', 'soir']
const SLOT_MAP: Record<Period, SlotKey> = { pdej: 'pdej', midi: 'midi', soir: 'soir' }

export default function PickDaySheet() {
  const sheetState = useAppStore((s) => s.sheetState)
  const setMeal = useAppStore((s) => s.setMeal)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const closeSheet = useAppStore((s) => s.closeSheet)

  const currentDayIdx = useAppStore((s) => s.currentDayIdx)
  const [pickedDay, setPickedDay] = useState(currentDayIdx >= 0 ? currentDayIdx : 0)
  const [pickedPeriod, setPickedPeriod] = useState<Period>('midi')

  const recipe = sheetState.pickDayContext?.recipe
  if (!recipe) return <BottomSheet name="pick-day"><div /></BottomSheet>

  const handleConfirm = () => {
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

      {/* Jour */}
      <p className="text-xs font-bold text-muted mb-2">Quel jour ?</p>
      <div className="flex gap-1.5 flex-wrap mb-5">
        {DAY_SHORT.map((label, i) => (
          <button
            key={i}
            onClick={() => setPickedDay(i)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200',
              pickedDay === i
                ? 'bg-terra border-terra text-white'
                : 'bg-card border-border text-muted',
            )}
          >
            {label}
          </button>
        ))}
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
