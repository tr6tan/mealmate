import { useMemo, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useAppStore } from '@/store/useAppStore'
import type { ShoppingCategory } from '@/types'
import { CAT_LABELS } from '@/lib/utils'
import ShoppingCategorySection from './ShoppingCategorySection'
import { showToast } from '@/lib/toast'

const CATEGORIES: { id: ShoppingCategory }[] = [
  { id: 'legumes' },
  { id: 'viandes' },
  { id: 'cremerie' },
  { id: 'epicerie' },
  { id: 'surgeles' },
  { id: 'maison' },
]

export default function ShoppingPage() {
  const openSheet                = useAppStore((s) => s.openSheet)
  const generateShoppingFromPlan = useAppStore((s) => s.generateShoppingFromPlan)
  const clearCheckedItems        = useAppStore((s) => s.clearCheckedItems)
  const setAllChecked            = useAppStore((s) => s.setAllChecked)
  const shoppingItems            = useAppStore((s) => s.shoppingItems)

  const total     = shoppingItems.length
  const checked   = shoppingItems.filter((i) => i.checked).length
  const remaining = total - checked
  const pct       = total ? Math.round((checked / total) * 100) : 0

  const prevPctRef = useRef(0)
  useEffect(() => {
    if (pct === 100 && total > 0 && prevPctRef.current < 100) {
      // Salve 1 — deux canons latéraux simultanés
      const fire = (originX: number, angle: number) =>
        confetti({
          particleCount: 60,
          angle,
          spread: 55,
          origin: { x: originX, y: 0.75 },
          colors: ['#001DC1', '#F5C065', '#34C759', '#FF3B5C', '#ffffff'],
          scalar: 1.1,
          gravity: 0.9,
          drift: 0.1,
          ticks: 280,
        })

      fire(0.15, 65)
      fire(0.85, 115)

      // Salve 2 — rafale centrale 200ms après
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 100,
          origin: { x: 0.5, y: 0.6 },
          colors: ['#001DC1', '#F5C065', '#34C759', '#FF3B5C', '#ffffff'],
          scalar: 0.9,
          gravity: 0.7,
          ticks: 350,
          startVelocity: 30,
        })
      }, 200)

      // Salve 3 — étoiles dorées 400ms après
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { x: 0.5, y: 0.55 },
          shapes: ['star'],
          colors: ['#F5C065', '#FFD700', '#FFA500'],
          scalar: 1.4,
          gravity: 0.6,
          ticks: 400,
          startVelocity: 25,
        })
      }, 400)

      showToast('Liste complète ! 🎉')
    }
    prevPctRef.current = pct
  }, [pct, total])

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
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="flex-shrink-0 pt-safe" />
      <div className="px-5 pt-4 pb-nav-safe">

        {/* Progression */}
        <div className="mb-5">
          <p className="text-sm text-text2 font-semibold">
            {remaining > 0
              ? `${remaining} article${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} sur ${total}`
              : total > 0 ? 'Tout est coché' : 'La liste est vide'
            }
          </p>
          {total > 0 && (
            <div
              className="mt-2 h-1.5 rounded-full bg-sep overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progression des courses"
            >
              <div
                className="h-full rounded-full bg-success transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => openSheet({ sheet: 'add-item' })} className="btn-primary">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter
          </button>
          <button onClick={handleGenerate} className="btn-secondary">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Depuis planning
          </button>
        </div>

        {/* Action links */}
        {total > 0 && (
          <div className="flex gap-4 mb-4 items-center">
            <button
              onClick={() => remaining === 0 ? setAllChecked(false) : setAllChecked(true)}
              className="text-xs font-semibold flex items-center gap-1.5 text-text2 py-2.5 px-1 min-h-[44px] active:opacity-60"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {remaining === 0 ? 'Tout décocher' : 'Tout cocher'}
            </button>
            {checked > 0 && (
              <button
                onClick={() => { clearCheckedItems(); showToast('Articles cochés supprimés') }}
                className="text-xs font-semibold flex items-center gap-1.5 text-text2 py-2.5 px-1 min-h-[44px] active:opacity-60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Vider ({checked})
              </button>
            )}
            <button
              onClick={handleCopy}
              className="text-xs font-semibold flex items-center gap-1.5 text-text2 py-2.5 px-1 min-h-[44px] ml-auto flex-shrink-0 active:opacity-60"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Partager
            </button>
          </div>
        )}

        {/* Empty state */}
        {total === 0 ? (
          <div className="glass rounded-[32px] px-8 py-10 text-center mt-4 flex flex-col items-center gap-3">
            <svg className="w-9 h-9 text-muted opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <div>
              <p className="text-sm text-text1 font-semibold mb-1">Votre panier est vide</p>
              <p className="text-xs text-muted leading-relaxed">Ajoutez des articles ou importez<br/>votre planning de la semaine.</p>
            </div>
          </div>
        ) : (
          /* Categories */
          <div>
            {filledCategories.map((cat) => (
              <ShoppingCategorySection
                key={cat.id}
                category={cat.id}
                label={CAT_LABELS[cat.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
