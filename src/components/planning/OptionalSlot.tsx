import type { Meal } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  meal: Meal | null
  onPress: () => void
}

export default function OptionalSlot({ label, meal, onPress }: Props) {
  return (
    <button
      onClick={onPress}
      className={cn(
        'w-full flex items-center gap-2 px-1 py-1.5 rounded-[9px] transition-all duration-150 text-left',
        'hover:bg-sep active:bg-sep',
      )}
    >
      <span className={cn('text-[10px] font-extrabold uppercase tracking-widest', meal ? 'text-muted' : 'text-text2')}>
        {label}
      </span>
      <span className={cn('flex-1 text-[11px] font-semibold', meal ? 'text-muted font-bold' : 'text-muted')}>
        {meal ? meal.name : `Ajouter ${label.toLowerCase()}…`}
      </span>
      <span className={cn('text-sm font-bold', meal ? 'text-muted' : 'text-muted')}>+</span>
    </button>
  )
}
