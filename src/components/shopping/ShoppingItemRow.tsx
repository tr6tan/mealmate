import { useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingItem } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  item: ShoppingItem
}

export default function ShoppingItemRow({ item }: Props) {
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem)
  const removeShoppingItem = useAppStore((s) => s.removeShoppingItem)

  // Évite le double-fire touchEnd + click sur iOS
  const didToggle = useRef(false)

  const handleToggleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    didToggle.current = true
    navigator.vibrate?.(30)
    toggleShoppingItem(item.id)
  }
  const handleToggleClick = () => {
    if (didToggle.current) { didToggle.current = false; return }
    navigator.vibrate?.(30)
    toggleShoppingItem(item.id)
  }

  const handleDeleteTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeShoppingItem(item.id)
  }

  return (
    <div
      className={cn(
        'group w-full rounded-xl px-3 py-3 flex items-center gap-3 border-[1.5px] select-none',
        'transition-all duration-200',
        item.checked
          ? 'border-sage/20 bg-sage/5 opacity-60'
          : 'bg-card border-border shadow-sm',
      )}
      style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
    >
      {/* Checkbox animée — seule zone qui toggle */}
      <button
        type="button"
        className={cn(
          'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0',
          'transition-all duration-200 cursor-pointer',
          item.checked ? 'bg-sage border-sage text-white scale-110' : 'border-border',
        )}
        style={{ touchAction: 'manipulation' }}
        onTouchEnd={handleToggleTouchEnd}
        onClick={handleToggleClick}
        aria-label={item.checked ? 'Décocher' : 'Cocher'}
      >
        {item.checked && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Nom */}
      <span
        className={cn(
          'flex-1 text-[14px] font-semibold transition-all duration-200 leading-snug',
          item.checked ? 'line-through text-muted/50' : 'text-text1',
        )}
      >
        {item.name}
      </span>

      {/* Qty badge */}
      {item.qty && (
        <span className={cn(
          'text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap transition-all duration-200',
          item.checked ? 'bg-sep/50 text-muted/40' : 'bg-terra-light text-terra font-extrabold',
        )}>
          {item.qty}
        </span>
      )}

      {/* Supprimer */}
      <button
        type="button"
        onTouchEnd={handleDeleteTouchEnd}
        onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id) }}
        className={cn(
          'p-1.5 -mr-1 rounded-lg flex items-center transition-all',
          'text-muted/30 active:text-terra active:bg-terra-light',
        )}
        style={{ touchAction: 'manipulation' }}
        aria-label="Supprimer"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}
