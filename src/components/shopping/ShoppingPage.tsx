import { useMemo, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS, MONTHS, getMondayByOffset, cn } from '@/lib/utils'
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
  const openSheet           = useAppStore((s) => s.openSheet)
  const generateShoppingFromPlan = useAppStore((s) => s.generateShoppingFromPlan)
  const clearCheckedItems   = useAppStore((s) => s.clearCheckedItems)
  const clearAllItems       = useAppStore((s) => s.clearAllItems)
  const shoppingItems       = useAppStore((s) => s.shoppingItems)
  const weekOffset          = useAppStore((s) => s.weekOffset)

  const total   = shoppingItems.length
  const checked = shoppingItems.filter((i) => i.checked).length
  const remaining = total - checked
  const pct     = total ? Math.round((checked / total) * 100) : 0

  const prevPctRef = useRef(0)
  useEffect(() => {
    if (pct === 100 && total > 0 && prevPctRef.current < 100) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#990000', '#ffc48f', '#99a680', '#9bb5bd'] })
      showToast('🎉 Liste complète !')
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
    const CAT_ICONS: Record<string, string> = { legumes: '🥦', viandes: '🥩', cremerie: '🧀', epicerie: '🛒', maison: '🧴' }
    const lines = shoppingItems
      .filter((i) => !i.checked)
      .map((i) => `${CAT_ICONS[i.category] ?? ''} ${i.name}${i.qty ? ' – ' + i.qty : ''}`)
    if (!lines.length) { showToast('La liste est vide !'); return }
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('📋 Liste copiée !'))
  }

  return (
    <div className="pb-36">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
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

      {total === 0 ? (
        /* ── Empty state ── */
        <div className="px-5 pt-6 flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-terra-light flex items-center justify-center text-4xl">
            🛒
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
                  {remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : '✅ Tout coché !'}
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
                style={pct !== 100 ? { background: 'linear-gradient(to right, #990000, #c04040)', width: `${pct}%` } : { width: `${pct}%` }}
              />
            </div>
          </div>

          {/* CTA générer */}
          <div className="px-5 mb-5">
            <button
              onClick={handleGenerate}
              className="w-full border-2 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-extrabold active:scale-[0.97] transition-transform"
              style={{ borderColor: '#99000030', color: '#990000', background: '#99000008' }}
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
                icon={cat.icon}
                label={CAT_LABELS[cat.id]}
              />
            ))}
          </div>
        </>
      )}

      {/* Barre d'actions fixe en bas */}
      {total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-card/98 backdrop-blur-xl border-t border-sep px-5 py-3 flex gap-2"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)' }}
        >
          {checked > 0 && (
            <button
              onClick={() => { clearCheckedItems(); showToast('Articles cochés supprimés') }}
              className="flex-1 py-2.5 rounded-xl bg-sage/15 text-sage text-xs font-extrabold active:scale-95 transition-transform"
            >
              Effacer les cochés ({checked})
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Vider toute la liste de courses ?')) {
                clearAllItems()
                showToast('Liste vidée')
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#FDE8F0] text-[#C0304A] text-xs font-extrabold active:scale-95 transition-transform"
          >
            Vider la liste
          </button>
        </div>
      )}
    </div>
  )
}
