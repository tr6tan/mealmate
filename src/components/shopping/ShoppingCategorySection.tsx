import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import ShoppingItemRow from './ShoppingItemRow'

interface Props {
  category: ShoppingCategory
  icon: string
  label: string
}

export default function ShoppingCategorySection({ category, icon, label }: Props) {
  const allItems = useAppStore((s) => s.shoppingItems)
  const items = allItems.filter((i) => i.category === category)

  return (
    <div>
      {/* Header catégorie */}
      <div className="flex items-center gap-2 pb-2.5 mb-2 border-b-[1.5px] border-border">
        <span className="text-[15px]">{icon}</span>
        <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-muted">
          {label}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-[#BEBEBE] font-semibold italic py-2 pl-1">
          Aucun article dans cette catégorie
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <ShoppingItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
