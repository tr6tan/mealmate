import { useMemo, useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingItem, ShoppingCategory } from '@/types'
import { ingredientEmoji } from '@/lib/utils'
import FoodSticker from '@/components/ui/FoodSticker'

interface Props {
  category: ShoppingCategory
  label: string
}

function ShoppingCard({ item }: { item: ShoppingItem }) {
  const toggleShoppingItem    = useAppStore((s) => s.toggleShoppingItem)
  const removeShoppingItem    = useAppStore((s) => s.removeShoppingItem)
  const updateShoppingItemQty = useAppStore((s) => s.updateShoppingItemQty)

  const [editingQty, setEditingQty] = useState(false)
  const [qtyDraft, setQtyDraft]     = useState(item.qty ?? '')
  const [stamping, setStamping]     = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const didTouch    = useRef(false)
  const didQtyTouch = useRef(false)
  const prevChecked = useRef(item.checked)

  // Déclenche l'animation "stamp" au moment du cochage
  useEffect(() => {
    if (item.checked && !prevChecked.current) {
      setStamping(true)
      const t = setTimeout(() => setStamping(false), 500)
      return () => clearTimeout(t)
    }
    prevChecked.current = item.checked
  }, [item.checked])

  // ── Toggle ──────────────────────────────────────────────────────────────
  const doToggle = () => {
    navigator.vibrate?.(30)
    toggleShoppingItem(item.id)
  }
  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (editingQty) return
    e.preventDefault()          // bloque le click synthétique
    didTouch.current = true
    doToggle()
  }
  const handleCardClick = () => {
    if (editingQty) return
    if (didTouch.current) { didTouch.current = false; return }
    doToggle()
  }

  // ── Quantité ────────────────────────────────────────────────────────────
  const openQty = () => {
    setQtyDraft(item.qty ?? '')
    setEditingQty(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }
  const handleQtyTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    didQtyTouch.current = true
    openQty()
  }
  const handleQtyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (didQtyTouch.current) { didQtyTouch.current = false; return }
    openQty()
  }

  const commitQty = () => {
    updateShoppingItemQty(item.id, qtyDraft.trim())
    setEditingQty(false)
  }

  return (
    <div
      onTouchEnd={handleCardTouchEnd}
      onClick={handleCardClick}
      className="relative flex flex-col items-center gap-1 rounded-3xl p-3 cursor-pointer select-none"
      style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
    >
      {/* Ring coloré (transition douce) */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300"
        style={{ boxShadow: item.checked ? '0 0 0 2.5px #34C759' : '0 0 0 0px transparent' }}
      />

      {/* Sticker – animation stamp au cochage, scale-down + grisé quand coché */}
      <div
        className={stamping ? 'animate-sticker-stamp' : 'transition-all duration-300'}
        style={!stamping ? {
          transform: item.checked ? 'scale(0.82)' : 'scale(1)',
          filter: item.checked ? 'grayscale(0.55) opacity(0.6)' : 'none',
        } : undefined}
      >
        <FoodSticker
          name={item.name}
          size={48}
          fallback={<span className="text-4xl leading-none">{ingredientEmoji(item.name)}</span>}
        />
      </div>

      {/* Nom */}
      <span className={`text-[10px] text-center leading-tight transition-all duration-300 ${
        item.checked ? 'line-through text-neutral-400' : 'text-neutral-700'
      }`}>
        {item.name}
      </span>

      {/* Quantité — tap pour éditer */}
      {editingQty ? (
        <input
          ref={inputRef}
          autoFocus
          value={qtyDraft}
          onChange={(e) => setQtyDraft(e.target.value)}
          onBlur={commitQty}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitQty() } }}
          onClick={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          placeholder="qté"
          className="w-full text-[11px] text-center font-semibold rounded-lg px-1 py-0.5 outline-none border border-[#0018A8]/40 bg-white text-[#0018A8]"
          style={{ maxWidth: 60 }}
        />
      ) : (
        <button
          type="button"
          onTouchEnd={handleQtyTouchEnd}
          onClick={handleQtyClick}
          className="text-[11px] font-semibold rounded-lg px-2 py-0.5 transition-colors"
          style={{
            background: item.qty ? 'rgba(0,24,168,0.08)' : 'rgba(0,0,0,0.04)',
            color: item.qty ? '#0018A8' : '#9CA3AF',
            touchAction: 'manipulation',
          }}
        >
          {item.qty || '+qté'}
        </button>
      )}

      {/* Badge coché — pop animé */}
      {item.checked && (
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#34C759] flex items-center justify-center shadow ring-2 ring-white animate-check-pop">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}

      {/* Supprimer */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeShoppingItem(item.id) }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); removeShoppingItem(item.id) }}
        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
        style={{ touchAction: 'manipulation' }}
        aria-label="Supprimer"
      >
        <svg className="w-2.5 h-2.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

export default function ShoppingCategorySection({ category, label }: Props) {
  const shoppingItems = useAppStore((s) => s.shoppingItems)

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
          <ShoppingCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
