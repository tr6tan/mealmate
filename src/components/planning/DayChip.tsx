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
      style={
        isToday
          ? { background: '#D23D2D', border: '2px solid #D23D2D', boxShadow: '0 4px 14px rgba(210,61,45,0.35)' }
          : isSelected
          ? { background: '#FFFCF0', border: '2px solid #D23D2D' }
          : { background: '#FFFCF0', border: '2px solid transparent', opacity: 0.75 }
      }
      className="flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all duration-200"
    >
      <span
        className="text-[10px] font-black tracking-widest uppercase"
        style={{ color: isToday ? 'rgba(255,255,255,0.75)' : isSelected ? '#D23D2D' : '#986C58' }}
      >
        {dayLabel}
      </span>
      <span
        className="text-xl font-black mt-0.5"
        style={{ color: isToday ? '#fff' : isSelected ? '#281008' : '#986C58' }}
      >
        {dayNum}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full mt-0.5 transition-colors"
        style={{
          background: isToday
            ? 'rgba(255,255,255,0.6)'
            : hasMeal
            ? '#31603D'
            : 'transparent',
        }}
      />
    </button>
  )
}

