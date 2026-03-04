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
    // div valide : pas de button imbriqué dans un button (HTML invalide sur iOS)
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group w-full bg-card rounded-xl px-3 py-3.5 flex items-center gap-3 border-[1.5px] cursor-pointer transition-colors duration-200 select-none',
        item.checked ? 'border-sage/30 bg-sage/5' : 'border-border',
      )}
      style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
      onTouchEnd={handleToggleTouchEnd}
      onClick={handleToggleClick}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-6 h-6 rounded-[7px] border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
          item.checked ? 'bg-sage border-sage text-white' : 'border-border',
        )}
      >
        {item.checked && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Nom */}
      <span
        className={cn(
          'flex-1 text-[13px] font-bold transition-all duration-200',
          item.checked ? 'line-through text-muted/60' : 'text-text1',
        )}
      >
        {item.name}
      </span>

      {/* Qty */}
      {item.qty && (
        <span className={cn(
          'text-[11px] font-bold bg-sep px-2 py-0.5 rounded-[7px] whitespace-nowrap transition-opacity duration-200',
          item.checked ? 'text-muted/50' : 'text-muted',
        )}>
          {item.qty}
        </span>
      )}

      {/* Supprimer — bouton autonome, pas imbriqué dans un button */}
      <button
        type="button"
        onTouchEnd={handleDeleteTouchEnd}
        onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id) }}
        className="text-muted/40 active:text-terra transition-colors ml-1 p-1 -mr-1 flex items-center"
        style={{ touchAction: 'manipulation' }}
        aria-label="Supprimer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}
