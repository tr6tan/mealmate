import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { SheetName } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  name: SheetName
  children: ReactNode
  className?: string
  /** Désactive le scroll interne du sheet — les enfants gèrent leur propre scroll */
  noScroll?: boolean
}

/**
 * Sur iOS PWA, le clavier virtuel ne réduit pas window.innerHeight.
 * On utilise visualViewport pour détecter le clavier et ajuster le sheet.
 */
function useKeyboardHeight() {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const kbH = window.innerHeight - vv.height - vv.offsetTop
      setHeight(kbH > 50 ? kbH : 0)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return height
}

export default function BottomSheet({ name, children, className, noScroll }: Props) {
  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const isOpen = sheetState.sheet === name
  const ref = useRef<HTMLDivElement>(null)
  const keyboardHeight = useKeyboardHeight()

  // Ferme le clavier iOS quand le sheet se ferme
  useEffect(() => {
    if (!isOpen) {
      const active = document.activeElement as HTMLElement | null
      active?.blur?.()
    }
  }, [isOpen])

  // Swipe to close — ne ferme que si :
  //  • le touch démarre depuis le handle/header (hors zone scrollable)
  //  • OU depuis la zone scrollable qui est scroll-top=0 et swipe lent + long
  useEffect(() => {
    if (!isOpen) return
    const el = ref.current
    if (!el) return

    let startY = 0
    let startTime = 0
    let touchInScrollable = false

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startTime = Date.now()
      touchInScrollable = false

      // Vérifie si le touch démarre dans un enfant scrollable
      let node = e.target as HTMLElement | null
      while (node && node !== el) {
        if (
          node.scrollHeight > node.clientHeight &&
          window.getComputedStyle(node).overflowY !== 'hidden'
        ) {
          touchInScrollable = true
          // Si le contenu est déjà scrollé vers le bas, on ne ferme jamais
          if (node.scrollTop > 2) {
            touchInScrollable = false // pas de close possible
            startY = -9999 // neutralise le geste
          }
          break
        }
        node = node.parentElement
      }
    }

    const onEnd = (e: TouchEvent) => {
      const deltaY = e.changedTouches[0].clientY - startY
      const elapsed = Date.now() - startTime

      if (deltaY <= 0) return // swipe vers le haut → ignorer

      if (touchInScrollable) {
        // Dans la zone scrollable (scrollTop=0) : exige un grand geste lent
        if (deltaY > 140 && elapsed > 250) closeSheet()
      } else {
        // Zone handle/header : seuil normal
        if (deltaY > 80) closeSheet()
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
    }
  }, [isOpen, closeSheet])

  return (
    <>
      {/* Overlay sombre derrière le sheet */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={closeSheet}
      />

      {/* Sheet */}
      <div
        ref={ref}
        role="dialog"
        aria-modal={isOpen}
        className={cn(
          'fixed left-0 right-0 z-50',
          'bg-card rounded-t-[28px]',
          noScroll
            ? 'flex flex-col overflow-hidden'
            : 'overflow-y-auto overscroll-contain no-scrollbar',
          'transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform',
          'px-5 pt-3',
          isOpen ? '' : 'translate-y-full',
          className,
        )}
        style={{
          bottom: isOpen ? `${keyboardHeight}px` : '0px',
          maxHeight: isOpen
            ? `calc(92dvh - ${keyboardHeight}px)`
            : '92dvh',
          paddingBottom: isOpen
            ? (keyboardHeight > 0 ? '8px' : 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))')
            : undefined,
        }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 flex-shrink-0" />
        {children}
      </div>
    </>
  )
}
