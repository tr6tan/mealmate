import { cn } from '@/lib/utils'

interface Props {
  dayLabel: string
  dayNum: number
  isToday: boolean
  isSelected: boolean
  hasMidi: boolean
  hasSoir: boolean
  onClick: () => void
}

export default function DayChip({ dayLabel, dayNum, isToday, isSelected, hasMidi, hasSoir, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 flex flex-col items-center py-2 rounded-2xl cursor-pointer transition-all duration-200 border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra',
        isToday
          ? 'bg-terra border-terra shadow-[0_4px_14px_rgba(210,61,45,0.35)]'
          : isSelected
          ? 'bg-card border-terra'
          : 'bg-card border-transparent',
      )}
    >
      <span
        className={cn(
          'text-[9px] font-black tracking-wider uppercase leading-none',
          isToday ? 'text-white/70' : isSelected ? 'text-terra' : 'text-muted',
        )}
      >
        {dayLabel}
      </span>
      <span
        className={cn(
          'text-[17px] font-black leading-tight mt-0.5',
          isToday ? 'text-white' : isSelected ? 'text-text1' : 'text-text2',
        )}
      >
        {dayNum}
      </span>
      {/* Dots midi / soir */}
      <div className="flex gap-[3px] mt-1">
        <span className={cn(
          'w-[5px] h-[5px] rounded-full transition-colors',
          isToday
            ? (hasMidi ? 'bg-white' : 'bg-fill/25')
            : (hasMidi ? 'bg-terra' : 'bg-border'),
        )} />
        <span className={cn(
          'w-[5px] h-[5px] rounded-full transition-colors',
          isToday
            ? (hasSoir ? 'bg-white' : 'bg-fill/25')
            : (hasSoir ? 'bg-evening' : 'bg-border'),
        )} />
      </div>
    </button>
  )
}

