import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import ShoppingItemRow from './ShoppingItemRow'
import { CategoryIcon } from '@/components/ui/FoodIcons'
import { cn } from '@/lib/utils'

interface Props {
  category: ShoppingCategory
  label: string
}

export default function ShoppingCategorySection({ category, label }: Props) {
  const shoppingItems = useAppStore((s) => s.shoppingItems)
  const [collapsed, setCollapsed] = useState(false)

  const items = useMemo(
    () => shoppingItems.filter((i) => i.category === category),
    [shoppingItems, category],
  )

  // Tri : non-cochés d'abord, cochés ensuite
  const sorted = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked)
    const checked   = items.filter((i) => i.checked)
    return [...unchecked, ...checked]
  }, [items])

  const remaining = items.filter((i) => !i.checked).length
  const checked   = items.filter((i) => i.checked).length
  const total     = items.length
  const allDone   = remaining === 0

  if (total === 0) return null

  return (
    <div>
      {/* Header catégorie — cliquable pour replier */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between pb-2.5 mb-2 border-b-[1.5px] border-border cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            allDone ? 'bg-sage/15' : 'bg-terra-light',
          )}>
            <CategoryIcon
              category={category}
              className={cn('w-4 h-4 flex-shrink-0', allDone ? 'text-sage' : 'text-terra')}
            />
          </div>
          <span className={cn(
            'text-[12px] font-extrabold tracking-[0.04em] uppercase transition-colors',
            allDone ? 'text-sage' : 'text-text2',
          )}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {allDone ? (
            <span className="text-sage font-extrabold text-[11px] flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Terminé
            </span>
          ) : (
            <span className="text-[11px] font-bold text-muted tabular-nums">
              {remaining}<span className="opacity-50">/{total}</span>
            </span>
          )}
          <svg
            className={cn(
              'w-3.5 h-3.5 text-muted/50 transition-transform duration-200',
              collapsed && '-rotate-90',
            )}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Contenu — animé */}
      <div className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-in-out',
        collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
      )}>
        <div className="overflow-hidden">
          <div className="space-y-1.5 pb-1">
            {sorted.map((item, i) => (
              <div key={item.id}>
                {/* Séparateur discret entre non-cochés et cochés */}
                {i > 0 && !sorted[i - 1].checked && item.checked && checked > 0 && (
                  <div className="flex items-center gap-2 py-2 px-1">
                    <div className="flex-1 h-px bg-border/60" />
                    <span className="text-[10px] font-bold text-muted/50 uppercase tracking-wider">Cochés</span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                )}
                <ShoppingItemRow item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
