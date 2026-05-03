import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { ingredientEmoji } from '@/lib/utils'

interface Props {
  category: ShoppingCategory
  label: string
}

export default function ShoppingCategorySection({ category, label }: Props) {
  const shoppingItems      = useAppStore((s) => s.shoppingItems)
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem)
  const removeShoppingItem = useAppStore((s) => s.removeShoppingItem)

  const items = useMemo(
    () => shoppingItems.filter((i) => i.category === category),
    [shoppingItems, category],
  )

  const sorted = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked)
    const checked   = items.filter((i) => i.checked)
    return [...unchecked, ...checked]
  }, [items])

  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-sm text-neutral-500 uppercase tracking-wide mb-3">
        {label}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {sorted.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleShoppingItem(item.id)}
            className="relative flex flex-col items-center gap-1 rounded-3xl p-3 cursor-pointer select-none transition-opacity"
            style={{
              background: 'white',
              boxShadow: item.checked
                ? '0 0 0 3px #34C759, 0 4px 16px rgba(0,0,0,0.08)'
                : '0 0 0 3px white, 0 6px 20px rgba(0,0,0,0.13)',
              opacity: item.checked ? 0.55 : 1,
            }}
          >
            {/* Ingredient emoji */}
            <span className="text-4xl leading-none mb-0.5">{ingredientEmoji(item.name)}</span>

            {/* Item name */}
            <span className={`text-[10px] text-center text-neutral-700 leading-tight ${item.checked ? 'line-through' : ''}`}>
              {item.name}
            </span>

            {/* Qty */}
            {item.qty && (
              <span className="text-[10px] text-neutral-400 text-center">{item.qty}</span>
            )}

            {/* Green check badge */}
            {item.checked && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center shadow ring-2 ring-white">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id) }}
              className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
              aria-label="Supprimer"
            >
              <svg className="w-2.5 h-2.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
