import { useEffect, useRef, type ReactNode } from 'react'
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

export default function BottomSheet({ name, children, className, noScroll }: Props) {
  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const isOpen = sheetState.sheet === name
  const ref = useRef<HTMLDivElement>(null)

  // Swipe to close (sur le handle uniquement pour ne pas bloquer le scroll interne)
  useEffect(() => {
    if (!isOpen) return
    const el = ref.current
    if (!el) return
    let startY = 0
    const onStart = (e: TouchEvent) => (startY = e.touches[0].clientY)
    const onEnd = (e: TouchEvent) => {
      if (e.changedTouches[0].clientY - startY > 80) closeSheet()
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
        className={cn(
          'fixed left-0 right-0 bottom-0 z-50',
          'bg-card rounded-t-[28px] max-h-[88dvh]',
          noScroll
            ? 'flex flex-col overflow-hidden'
            : 'overflow-y-auto no-scrollbar',
          'transform transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          noScroll ? 'px-5 pt-3' : 'px-5 pt-3 pb-10',
          isOpen ? 'translate-y-0' : 'translate-y-full',
          className,
        )}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 flex-shrink-0" />
        {children}
      </div>
    </>
  )
}
