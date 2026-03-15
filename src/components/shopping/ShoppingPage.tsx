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

/* ── Cercle SVG pour la progress card ── */
const CIRCLE_R = 28
const CIRCLE_C = 2 * Math.PI * CIRCLE_R

function ProgressRing({ pct, className }: { pct: number; className?: string }) {
  const offset = CIRCLE_C - (pct / 100) * CIRCLE_C
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r={CIRCLE_R} stroke="rgb(var(--c-sep))" strokeWidth="5" />
      <circle
        cx="32" cy="32" r={CIRCLE_R}
        stroke={pct === 100 ? 'rgb(var(--c-sage))' : 'rgb(var(--c-terra))'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={CIRCLE_C}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  )
}

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
      showToast('Liste complète ! 🎉')
    }
    prevPctRef.current = pct
  }, [pct, total])

  const monday   = getMondayByOffset(weekOffset)
  const weekLabel = `Semaine du ${monday.getDate()} ${MONTHS[monday.getMonth()]}`

  const filledCategories = useMemo(
    () => CATEGORIES.filter((c) => shoppingItems.some((i) => i.category === c.id)),
    [shoppingItems],
  )

  // Résumé par catégorie pour les pills
  const catSummary = useMemo(() => {
    const m = new Map<ShoppingCategory, { total: number; done: number }>()
    for (const i of shoppingItems) {
      const e = m.get(i.category) ?? { total: 0, done: 0 }
      e.total++
      if (i.checked) e.done++
      m.set(i.category, e)
    }
    return m
  }, [shoppingItems])

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
        <div className="px-5 pt-8 flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-[28px] bg-terra-light flex items-center justify-center">
              <svg className="w-11 h-11 text-terra/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center">
              <span className="text-sm">📝</span>
            </div>
          </div>
          <div className="text-center max-w-[260px]">
            <p className="text-[17px] font-extrabold text-text1 mb-1.5">Ta liste est vide</p>
            <p className="text-[13px] text-muted font-semibold leading-relaxed">Génère ta liste depuis le planning ou ajoute des articles manuellement.</p>
          </div>
          <div className="w-full space-y-2.5 mt-1">
            <button
              onClick={handleGenerate}
              className="group w-full relative overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-2.5 text-[15px] font-extrabold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #D23D2D 0%, #A32E20 50%, #D23D2D 100%)', boxShadow: '0 4px 20px -4px rgba(210,61,45,0.45), 0 1px 3px rgba(210,61,45,0.2)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
              <svg className="w-[18px] h-[18px] relative" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 2H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 2v6a1 1 0 0 0 1 1h4"/>
                <path d="M13 22H5a2 2 0 0 1-2-2v-6"/>
                <path d="M21 13v6a2 2 0 0 1-2 2h-6"/>
                <path d="M3 13l3-3 3 3"/>
                <path d="M21 11l-3 3-3-3"/>
              </svg>
              <span className="relative">Générer depuis le planning</span>
              <svg className="w-4 h-4 relative opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button
              onClick={() => openSheet({ sheet: 'add-item' })}
              className="w-full border-2 border-border rounded-2xl py-3 text-sm font-bold text-muted active:scale-[0.97] transition-transform hover:bg-card"
            >
              + Article manuel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress card améliorée */}
          <div className="mx-5 mb-4 bg-card border-[1.5px] border-border rounded-2xl px-4 py-3.5">
            <div className="flex items-center gap-4">
              <ProgressRing pct={pct} className="w-14 h-14 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={cn(
                    'text-[26px] font-black tabular-nums leading-none transition-colors duration-300',
                    pct === 100 ? 'text-sage' : 'text-terra'
                  )}>{pct}%</span>
                  <span className="text-[12px] font-bold text-muted">
                    {pct === 100 ? 'Terminé !' : 'complété'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                  <span className="tabular-nums">{checked}/{total} articles</span>
                  {remaining > 0 && (
                    <>
                      <span className="text-muted/40">•</span>
                      <span>{remaining} restant{remaining > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mini-pills catégories */}
            {filledCategories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-sep">
                {filledCategories.map((cat) => {
                  const s = catSummary.get(cat.id)
                  if (!s) return null
                  const done = s.done === s.total
                  return (
                    <span key={cat.id} className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg',
                      done ? 'bg-sage/10 text-sage' : 'bg-sep text-muted',
                    )}>
                      {done && <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      {CAT_LABELS[cat.id]}
                      <span className="opacity-60">{s.done}/{s.total}</span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* CTA re-générer */}
          <div className="px-5 mb-5">
            <button
              onClick={handleGenerate}
              className="group w-full relative overflow-hidden rounded-2xl py-3 flex items-center justify-center gap-2 text-[13px] font-extrabold active:scale-[0.97] transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(210,61,45,0.08), rgba(210,61,45,0.03))', border: '1.5px solid rgba(210,61,45,0.2)', color: '#D23D2D' }}
            >
              <div className="absolute inset-0 bg-terra/5 opacity-0 group-active:opacity-100 transition-opacity" />
              <svg className="w-4 h-4 relative" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 2H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 2v6a1 1 0 0 0 1 1h4"/>
                <path d="M13 22H5a2 2 0 0 1-2-2v-6"/>
                <path d="M21 13v6a2 2 0 0 1-2 2h-6"/>
                <path d="M3 13l3-3 3 3"/>
                <path d="M21 11l-3 3-3-3"/>
              </svg>
              <span className="relative">Regénérer depuis le planning</span>
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
              onClick={() => { clearCheckedItems(); showToast('Articles cochés supprimés') }}
              className="flex-1 py-2.5 rounded-xl bg-sage/15 text-sage text-xs font-extrabold active:scale-95 transition-transform flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Effacer cochés ({checked})
            </button>
          )}
          <button
            onClick={handleClearAll}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 transition-all flex items-center justify-center gap-1.5',
              clearConfirm
                ? 'bg-terra text-white'
                : 'bg-[#FDE8F0] text-[#C0304A]',
            )}
          >
            {clearConfirm ? (
              <>⚠️ Confirmer ?</>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Vider la liste
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
