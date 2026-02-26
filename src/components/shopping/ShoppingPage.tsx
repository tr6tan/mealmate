import { useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS, MONTHS, getWeekMonday } from '@/lib/utils'
import ShoppingCategorySection from './ShoppingCategorySection'
import { showToast } from '@/components/ui/Toast'

const CATEGORIES: { id: ShoppingCategory; icon: string }[] = [
  { id: 'legumes',  icon: '🥦' },
  { id: 'viandes',  icon: '🥩' },
  { id: 'cremerie', icon: '🧀' },
  { id: 'epicerie', icon: '🛒' },
  { id: 'maison',   icon: '🧴' },
]

export default function ShoppingPage() {
  const openSheet = useAppStore((s) => s.openSheet)
  const generateShoppingFromPlan = useAppStore((s) => s.generateShoppingFromPlan)
  const clearCheckedItems = useAppStore((s) => s.clearCheckedItems)
  const shoppingItems = useAppStore((s) => s.shoppingItems)
  const total   = shoppingItems.length
  const checked  = shoppingItems.filter((i) => i.checked).length
  const pct      = total ? Math.round((checked / total) * 100) : 0

  const prevPctRef = useRef(0)
  useEffect(() => {
    if (pct === 100 && total > 0 && prevPctRef.current < 100) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#E07B54', '#F4A67A', '#6B8F71', '#FFD700'] })
    }
    prevPctRef.current = pct
  }, [pct, total])

  const monday = getWeekMonday()
  const weekLabel = `Semaine du ${monday.getDate()} ${MONTHS[monday.getMonth()]}`

  const handleGenerate = () => {
    generateShoppingFromPlan()
    showToast('Liste générée depuis le planning !')
  }

  const handleCopy = () => {
    const CAT_ICONS: Record<string, string> = { legumes: '🥦', viandes: '🥩', cremerie: '🧀', epicerie: '🛒', maison: '🧴' }
    const lines = shoppingItems
      .filter((i) => !i.checked)
      .map((i) => `${CAT_ICONS[i.category] ?? ''} ${i.name}${i.qty ? ' – ' + i.qty : ''}`)
    if (!lines.length) { showToast('La liste est vide !'); return }
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('📋 Liste copiée !'))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-text1">Courses</h1>
          <p className="text-[13px] text-muted font-semibold mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="w-10 h-10 rounded-full bg-card border-[1.5px] border-border text-text2 flex items-center justify-center shadow-card active:scale-95 transition-transform"
            aria-label="Copier la liste"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button
            onClick={() => openSheet({ sheet: 'add-item' })}
            className="w-10 h-10 rounded-full bg-terra text-white flex items-center justify-center text-xl font-bold shadow-terra-sm active:scale-95 transition-transform"
            aria-label="Ajouter un article"
          >
            +
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 mb-3.5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] font-bold text-muted">Progression</span>
          <span className="text-[13px] font-extrabold text-terra">
            {checked} / {total} articles
          </span>
        </div>
        <div className="bg-sep rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-terra to-[#F4A67A] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* CTA générer depuis planning */}
      <div className="px-5 mb-4">
        <button
          onClick={handleGenerate}
          className="w-full bg-terra text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-extrabold shadow-terra active:scale-[0.97] transition-transform"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Générer depuis le planning
        </button>
      </div>

      {/* Catégories */}
      <div className="px-5 pb-32 space-y-5">
        {CATEGORIES.map((cat) => (
          <ShoppingCategorySection
            key={cat.id}
            category={cat.id}
            icon={cat.icon}
            label={CAT_LABELS[cat.id]}
          />
        ))}
      </div>

      {/* Clear checked */}
      {checked > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center">
          <button
            onClick={() => { clearCheckedItems(); showToast('Articles cochés supprimés') }}
            className="bg-white/90 backdrop-blur border border-border rounded-full px-4 py-2 text-xs font-bold text-muted shadow-card active:scale-95 transition-transform"
          >
            Supprimer les articles cochés ({checked})
          </button>
        </div>
      )}
    </div>
  )
}
