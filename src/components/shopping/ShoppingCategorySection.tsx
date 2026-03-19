import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import ShoppingItemRow from './ShoppingItemRow'
import { cn } from '@/lib/utils'

const CAT_EMOJI: Record<ShoppingCategory, string> = {
  legumes: '\u{1F966}',
  viandes: '\u{1F969}',
  cremerie: '\u{1F9C0}',
  epicerie: '\u{1F36A}',
  surgeles: '\u{2744}\uFE0F',
  maison: '\u{1F9F9}',
}

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
    <div className="bg-card rounded-2xl border-[1.5px] border-border overflow-hidden">
      {/* Header catégorie */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base leading-none">{CAT_EMOJI[category]}</span>
          <span className={cn(
            'text-[13px] font-extrabold transition-colors',
            allDone ? 'text-sage' : 'text-text1',
          )}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {allDone ? (
            <span className="text-sage font-extrabold text-[11px]">{'\u2705'}</span>
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

      {/* Contenu */}
      <div className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-in-out',
        collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
      )}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 space-y-1.5">
            {sorted.map((item, i) => (
              <div key={item.id}>
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
