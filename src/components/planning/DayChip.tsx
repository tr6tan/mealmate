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
          ? { background: '#990000', border: '2px solid #990000' }
          : isSelected
          ? { background: '#99000015', border: '2px solid #990000' }
          : { background: '#F4F0EA', border: '2px solid transparent' }
      }
      className="flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all duration-200"
    >
      <span
        className="text-[10px] font-black tracking-widest uppercase"
        style={{ color: isToday ? 'rgba(255,255,255,0.75)' : isSelected ? '#990000' : '#988C80' }}
      >
        {dayLabel}
      </span>
      <span
        className="text-xl font-black mt-0.5"
        style={{ color: isToday ? '#fff' : isSelected ? '#990000' : '#1C1612' }}
      >
        {dayNum}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full mt-0.5 transition-colors"
        style={{
          background: isToday
            ? 'rgba(255,255,255,0.6)'
            : hasMeal
            ? '#99a680'
            : 'transparent',
        }}
      />
    </button>
  )
}

