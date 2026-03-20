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
  { id: 'surgeles' },
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
    if (clearConfirm) { clearAllItems(); showToast('Liste vid\u00e9e'); setClearConfirm(false) }
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
      showToast('Liste compl\u00e8te ! \u{1F389}')
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
    showToast('Liste g\u00e9n\u00e9r\u00e9e depuis le planning !')
  }

  const handleCopy = () => {
    const lines = shoppingItems
      .filter((i) => !i.checked)
      .map((i) => `${CAT_LABELS[i.category]} : ${i.name}${i.qty ? ' \u2013 ' + i.qty : ''}`)
    if (!lines.length) { showToast('La liste est vide !'); return }
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Liste copi\u00e9e !'))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 pt-safe" />
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-black text-text1">{'\u{1F6D2}'} Courses</h1>
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
        <div className="px-5 pt-12 flex flex-col items-center gap-5">
          <span className="text-6xl">{'\u{1F6D2}'}</span>
          <div className="text-center max-w-[260px]">
            <p className="text-[17px] font-extrabold text-text1 mb-1.5">Ta liste est vide</p>
            <p className="text-[13px] text-muted font-semibold leading-relaxed">Génère ta liste depuis le planning ou ajoute des articles manuellement.</p>
          </div>
          <div className="w-full space-y-2.5 mt-2">
            <button
              onClick={handleGenerate}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-terra bg-terra-light/60 active:bg-terra-light active:scale-[0.98] transition-all"
            >
              Générer depuis le planning
            </button>
            <button
              onClick={() => openSheet({ sheet: 'add-item' })}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-muted bg-bg active:bg-border/20 active:scale-[0.98] transition-all"
            >
              + Article manuel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mx-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                'text-sm font-extrabold transition-colors',
                pct === 100 ? 'text-sage' : 'text-text1'
              )}>
                {pct === 100 ? '\u2705 Termin\u00e9 !' : `${checked}/${total} articles`}
              </span>
              <span className={cn(
                'text-xs font-bold tabular-nums',
                pct === 100 ? 'text-sage' : 'text-muted'
              )}>
                {remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : ''}
              </span>
            </div>
            <div className="w-full h-2 bg-border/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  pct === 100 ? 'bg-sage' : 'bg-terra',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* CTA re-générer */}
          <div className="px-5 mb-5">
            <button
              onClick={handleGenerate}
              className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-[13px] font-extrabold text-terra bg-terra-light border-[1.5px] border-terra/15 active:scale-[0.97] transition-transform"
            >
              <span>{'\u2728'}</span>
              <span>Régénérer depuis le planning</span>
            </button>
          </div>

          {/* Catégories */}
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

      {/* Barre d'actions en bas */}
      {total > 0 && (
        <div className="flex-shrink-0 bg-card/98 backdrop-blur-xl border-t border-sep px-5 py-3 flex gap-2">
          {checked > 0 && (
            <button
              onClick={() => { clearCheckedItems(); showToast('Articles coch\u00e9s supprim\u00e9s') }}
              className="flex-1 py-2.5 rounded-xl bg-sage/15 text-sage text-xs font-extrabold active:scale-95 transition-transform flex items-center justify-center gap-1.5"
            >
              {'\u2705'} Effacer cochés ({checked})
            </button>
          )}
          <button
            onClick={handleClearAll}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 transition-all flex items-center justify-center gap-1.5',
              clearConfirm
                ? 'bg-terra text-white'
                : 'bg-danger-light text-danger',
            )}
          >
            {clearConfirm ? '\u26A0\uFE0F Confirmer ?' : '\u{1F5D1}\uFE0F Vider la liste'}
          </button>
        </div>
      )}
    </div>
  )
}
