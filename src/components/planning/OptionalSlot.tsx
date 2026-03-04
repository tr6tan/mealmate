import type { Meal } from '@/types'

interface Props {
  label: string
  meal: Meal | null
  onPress: () => void
}

export default function OptionalSlot({ label, meal, onPress }: Props) {
  if (meal) {
    // Rempli : ligne compacte avec l'emoji et le nom
    return (
      <button
        onClick={onPress}
        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left hover:bg-sep active:bg-sep transition-colors"
      >
        {meal.emoji && <span className="text-sm leading-none">{meal.emoji}</span>}
        <span className="text-[11px] font-bold text-text2 truncate flex-1">{meal.name}</span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted opacity-60">{label}</span>
      </button>
    )
  }

  // Vide : juste un petit lien textuel très discret
  return (
    <button
      onClick={onPress}
      className="flex items-center gap-1 px-2 py-0.5 text-left opacity-40 hover:opacity-70 active:opacity-70 transition-opacity"
    >
      <span className="text-[10px] font-bold text-muted">+</span>
      <span className="text-[10px] font-semibold text-muted">{label}</span>
    </button>
  )
}
