import { cn } from '@/lib/utils'

interface Props {
  dayLabel: string
  dayNum: number
  isToday: boolean
  isSelected: boolean
  hasMeal: boolean
  onClick: () => void
}

export default function DayChip({ dayLabel, dayNum, isToday, isSelected, hasMeal, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-2xl cursor-pointer border-2 transition-all duration-200',
        // Default
        'bg-card border-transparent',
        // Today
        isToday && 'bg-white border-terra shadow-[0_0_0_1px_#E07B54]',
        // Selected (not today)
        isSelected && !isToday && 'bg-terra-light border-terra',
      )}
    >
      <span
        className={cn(
          'text-[10px] font-black tracking-widest uppercase',
          isToday ? 'text-terra' : 'text-muted',
          isSelected && !isToday && 'text-terra',
        )}
      >
        {dayLabel}
      </span>
      <span
        className={cn(
          'text-xl font-black mt-0.5',
          isToday || isSelected ? 'text-terra' : 'text-text1',
        )}
      >
        {dayNum}
      </span>
      {/* dot : today = terra, repas planifié = sage, sinon transparent */}
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mt-0.5 transition-colors',
        isToday ? 'bg-terra' : hasMeal ? 'bg-sage' : 'bg-transparent',
      )} />
    </button>
  )
}

