import { useMemo, useRef, useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS, MONTHS, getMondayByOffset, cn } from '@/lib/utils'
import ShoppingCategorySection from './ShoppingCategorySection'
import { showToast } from '@/components/ui/Toast'

const CATEGORIES: { id: ShoppingCategory }[] = [
  { id: 'legumes' },
  { id: 'viandes' },
  { id: 'cremerie' },
  { id: 'epicerie' },
  { id: 'maison' },
]

export default function ShoppingPage() {
  const openSheet           = useAppStore((s) => s.openSheet)
  const generateShoppingFromPlan = useAppStore((s) => s.generateShoppingFromPlan)
  const clearCheckedItems   = useAppStore((s) => s.clearCheckedItems)
  const clearAllItems       = useAppStore((s) => s.clearAllItems)
  const shoppingItems       = useAppStore((s) => s.shoppingItems)
  const weekOffset          = useAppStore((s) => s.weekOffset)

  const [clearConfirm, setClearConfirm] = useState(false)

  const handleClearAll = () => {
    if (clearConfirm) { clearAllItems(); showToast('Liste vidée'); setClearConfirm(false) }
    else { setClearConfirm(true); setTimeout(() => setClearConfirm(false), 3000) }
  }

  const total   = shoppingItems.length
  const checked = shoppingItems.filter((i) => i.checked).length
  const remaining = total - checked
  const pct     = total ? Math.round((checked / total) * 100) : 0

  const prevPctRef = useRef(0)
  useEffect(() => {
    if (pct === 100 && total > 0 && prevPctRef.current < 100) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#D23D2D', '#F5C065', '#31603D', '#6E433D'] })
      showToast('Liste complète !')
    }
    prevPctRef.current = pct
  }, [pct, total])

  const monday   = getMondayByOffset(weekOffset)
  const weekLabel = `Semaine du ${monday.getDate()} ${MONTHS[monday.getMonth()]}`

  const filledCategories = useMemo(
    () => CATEGORIES.filter((c) => shoppingItems.some((i) => i.category === c.id)),
    [shoppingItems],
  )

  const handleGenerate = () => {
    generateShoppingFromPlan()
    showToast('Liste générée depuis le planning !')
  }

  const handleCopy = () => {
    const lines = shoppingItems
      .filter((i) => !i.checked)
      .map((i) => `${CAT_LABELS[i.category]} : ${i.name}${i.qty ? ' – ' + i.qty : ''}`)
    if (!lines.length) { showToast('La liste est vide !'); return }
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Liste copiée !'))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 pt-safe" />
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-text1">Courses</h1>
          <p className="text-[13px] text-muted font-semibold mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
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
          )}
          <button
            onClick={() => openSheet({ sheet: 'add-item' })}
            className="w-10 h-10 rounded-full bg-terra text-white flex items-center justify-center text-xl font-bold shadow-terra-sm active:scale-95 transition-transform"
            aria-label="Ajouter un article"
          >
            +
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto no-scrollbar overscroll-contain"
        style={{ paddingBottom: '16px' }}
      >
      {total === 0 ? (
        /* ── Empty state ── */
        <div className="px-5 pt-6 flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-terra-light flex items-center justify-center">
            <svg className="w-9 h-9" style={{ color: '#D23D2D80' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold text-text1 mb-1">Liste vide</p>
            <p className="text-[13px] text-muted font-semibold">Génère ta liste depuis le planning ou ajoute des articles manuellement.</p>
          </div>
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
          <button
            onClick={() => openSheet({ sheet: 'add-item' })}
            className="w-full border-2 border-border rounded-2xl py-3 text-sm font-bold text-muted active:scale-[0.97] transition-transform"
          >
            + Article manuel
          </button>
        </div>
      ) : (
        <>
          {/* Progress card */}
          <div className="mx-5 mb-4 bg-card border-[1.5px] border-border rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[22px] font-black tabular-nums transition-colors duration-300',
                  pct === 100 ? 'text-sage' : 'text-terra'
                )}>{pct}%</span>
                <span className="text-[12px] font-bold text-muted">
                  {remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : 'Tout coché !'}
                </span>
              </div>
              <span className="text-[12px] font-bold text-muted">{checked}/{total}</span>
            </div>
            <div className="bg-sep rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  pct === 100 ? 'bg-sage' : ''
                )}
                style={pct !== 100 ? { background: 'linear-gradient(to right, #D23D2D, #A32E20)', width: `${pct}%` } : { width: `${pct}%` }}
              />
            </div>
          </div>

          {/* CTA générer */}
          <div className="px-5 mb-5">
            <button
              onClick={handleGenerate}
              className="w-full border-2 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-extrabold active:scale-[0.97] transition-transform"
              style={{ borderColor: '#D23D2D30', color: '#D23D2D', background: '#D23D2D08' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Regénérer depuis le planning
            </button>
          </div>

          {/* Catégories — seulement celles qui ont des articles */}
          <div className="px-5 space-y-5">
            {filledCategories.map((cat) => (
              <ShoppingCategorySection
                key={cat.id}
                category={cat.id}
                label={CAT_LABELS[cat.id]}
              />
            ))}
          </div>
        </>
      )}
      </div>{/* /scroll */}

      {/* Barre d'actions en bas — élément flex statique */}
      {total > 0 && (
        <div className="flex-shrink-0 bg-card/98 backdrop-blur-xl border-t border-sep px-5 py-3 flex gap-2">
          {checked > 0 && (
            <button
              onClick={() => { clearCheckedItems(); showToast('Articles cochés supprimés') }}
              className="flex-1 py-2.5 rounded-xl bg-sage/15 text-sage text-xs font-extrabold active:scale-95 transition-transform"
            >
              Effacer les cochés ({checked})
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="flex-1 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 transition-transform"
            style={clearConfirm
              ? { background: '#FDE8F0', color: '#C0304A' }
              : { background: '#FDE8F0', color: '#C0304A' }}
          >
            {clearConfirm ? 'Confirmer ?' : 'Vider la liste'}
          </button>
        </div>
      )}
    </div>
  )
}
