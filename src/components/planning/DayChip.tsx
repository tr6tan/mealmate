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
        'flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all duration-200 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra',
        isToday
          ? 'bg-terra border-terra shadow-[0_4px_14px_rgba(210,61,45,0.35)]'
          : isSelected
          ? 'bg-card border-terra'
          : 'bg-card border-transparent opacity-75',
      )}
    >
      <span
        className={cn(
          'text-[10px] font-black tracking-widest uppercase',
          isToday ? 'text-white/75' : isSelected ? 'text-terra' : 'text-muted',
        )}
      >
        {dayLabel}
      </span>
      <span
        className={cn(
          'text-xl font-black mt-0.5',
          isToday ? 'text-white' : isSelected ? 'text-text1' : 'text-muted',
        )}
      >
        {dayNum}
      </span>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mt-0.5 transition-colors',
          isToday ? 'bg-white/60' : hasMeal ? 'bg-sage' : 'bg-transparent',
        )}
      />
    </button>
  )
}

