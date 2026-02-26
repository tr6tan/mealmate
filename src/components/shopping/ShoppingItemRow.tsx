import { useAppStore } from '@/store/useAppStore'
import type { ShoppingItem } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  item: ShoppingItem
}

export default function ShoppingItemRow({ item }: Props) {
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem)
  const removeShoppingItem = useAppStore((s) => s.removeShoppingItem)

  return (
    <div
      className={cn(
        'bg-card rounded-xl px-3 py-2.5 flex items-center gap-2.5 border-[1.5px] border-border cursor-pointer transition-all duration-200 animate-slide-in',
        item.checked && 'opacity-45',
      )}
      onClick={() => { navigator.vibrate?.(25); toggleShoppingItem(item.id) }}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-6 h-6 rounded-[7px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
          item.checked ? 'bg-sage border-sage text-white' : 'border-border',
        )}
      >
        {item.checked && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Nom */}
      <span
        className={cn(
          'flex-1 text-[13px] font-bold text-text1',
          item.checked && 'line-through text-muted',
        )}
      >
        {item.name}
      </span>

      {/* Qty */}
      {item.qty && (
        <span className="text-[11px] font-bold text-muted bg-sep px-2 py-0.5 rounded-[7px] whitespace-nowrap">
          {item.qty}
        </span>
      )}

      {/* Supprimer */}
      <button
        onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id) }}
        className="text-muted text-sm opacity-40 hover:opacity-100 transition-opacity ml-1"
        aria-label="Supprimer"
      >
        ✕
      </button>
    </div>
  )
}
