import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import ShoppingItemRow from './ShoppingItemRow'

interface Props {
  category: ShoppingCategory
  label: string
}

export default function ShoppingCategorySection({ category, label }: Props) {
  const allItems = useAppStore((s) => s.shoppingItems)
  const items = allItems.filter((i) => i.category === category)

  // Articles non cochés d'abord, cochés en bas
  const sorted = useMemo(
    () => [...items.filter((i) => !i.checked), ...items.filter((i) => i.checked)],
    [items],
  )

  const remaining = items.filter((i) => !i.checked).length
  const total = items.length

  if (total === 0) return null

  return (
    <div>
      {/* Header catégorie */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b-[1.5px] border-border">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-muted">
            {label}
          </span>
        </div>
        <span className="text-[11px] font-bold text-muted">
          {remaining === 0 ? (
            <span className="text-sage font-extrabold flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Tout coché
            </span>
          ) : (
            <span>{remaining}<span className="opacity-50">/{total}</span></span>
          )}
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((item) => (
          <ShoppingItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
