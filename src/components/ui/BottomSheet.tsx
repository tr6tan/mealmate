import { useEffect, useRef, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { SheetName } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  name: SheetName
  children: ReactNode
  className?: string
}

export default function BottomSheet({ name, children, className }: Props) {
  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const isOpen = sheetState.sheet === name
  const ref = useRef<HTMLDivElement>(null)

  // Swipe to close
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
    <div
      ref={ref}
      className={cn(
        'fixed left-0 right-0 bottom-0 z-50',
        'bg-card rounded-t-[28px] max-h-[88dvh] overflow-y-auto no-scrollbar',
        'transform transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
        'px-5 pt-3 pb-10',
        isOpen ? 'translate-y-0' : 'translate-y-full',
        className,
      )}
    >
      {/* Handle */}
      <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
      {children}
    </div>
  )
}
