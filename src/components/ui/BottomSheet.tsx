import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { SheetName } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  name: SheetName
  children: ReactNode
  className?: string
  /** Désactive le scroll interne du sheet — les enfants gèrent leur propre scroll */
  noScroll?: boolean
  /**
   * Fait flotter la poignée par-dessus le contenu au lieu de lui réserver une
   * ligne. Sur une feuille qui s'ouvre sur une photo pleine largeur, les 4px
   * de poignée et ses 16px de marge laissaient une bande blanche au-dessus de
   * l'image. À réserver aux feuilles dont le haut est une image, où la
   * poignée reste lisible en blanc translucide.
   */
  handleOverlay?: boolean
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

/** Durée de l'animation de fermeture — le contenu reste monté le temps de glisser. */
const CLOSE_ANIMATION_MS = 400

export default function BottomSheet({ name, children, className, noScroll, handleOverlay }: Props) {
  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const isOpen = sheetState.sheet === name
  const ref = useRef<HTMLDivElement>(null)
  const keyboardHeight = useKeyboardHeight()

  /**
   * Le contenu n'existe dans le DOM que pendant l'ouverture (plus l'animation
   * de sortie). Les huit sheets de l'app restant montées en permanence, les
   * garder rendues laissait ~330 éléments focusables hors écran sur le chemin
   * de tabulation, et sept `role="dialog"` déclarés en même temps.
   */
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      return
    }
    const t = setTimeout(() => setMounted(false), CLOSE_ANIMATION_MS)
    return () => clearTimeout(t)
  }, [isOpen])

  // Ferme le clavier iOS quand le sheet se ferme
  useEffect(() => {
    if (!isOpen) {
      const active = document.activeElement as HTMLElement | null
      active?.blur?.()
    }
  }, [isOpen])

  // ── Clavier : Échap ferme, Tab reste piégé dans le sheet ──────────────────
  const focusables = useCallback((): HTMLElement[] => {
    const el = ref.current
    if (!el) return []
    return Array.from(
      el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((n) => !n.hasAttribute('disabled') && n.offsetParent !== null)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    // Mémorise le déclencheur pour lui rendre le focus à la fermeture.
    const previous = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSheet()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !ref.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [isOpen, closeSheet, focusables])

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
    let gestureDisabled = false

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startTime = Date.now()
      touchInScrollable = false
      gestureDisabled = false

      /*
       * Cherche la zone défilante sous le doigt, `el` compris : c'est
       * souvent le sheet lui-même qui défile, et l'ancienne boucle
       * s'arrêtait juste avant de l'examiner. Le geste retombait alors sur
       * le seuil permissif du handle, et la fiche se fermait dès qu'on
       * tirait un peu vers le bas pour lire la suite.
       */
      let node = e.target as HTMLElement | null
      while (node) {
        if (
          node.scrollHeight > node.clientHeight + 1 &&
          window.getComputedStyle(node).overflowY !== 'hidden'
        ) {
          touchInScrollable = true
          // Contenu déjà défilé : on ne ferme pas, on laisse défiler.
          if (node.scrollTop > 2) gestureDisabled = true
          break
        }
        if (node === el) break
        node = node.parentElement
      }
    }

    const onEnd = (e: TouchEvent) => {
      if (gestureDisabled) return // touch dans zone scrollée → on ne ferme jamais

      const deltaY = e.changedTouches[0].clientY - startY
      const elapsed = Date.now() - startTime

      if (deltaY <= 0) return // swipe vers le haut → ignorer

      if (touchInScrollable) {
        // Haut d'une zone défilante : il faut un geste ample et délibéré,
        // pour ne pas confondre avec une tentative de défilement.
        if (deltaY > 180 && elapsed > 300) closeSheet()
      } else {
        // Poignée ou en-tête : la fermeture est le seul geste attendu.
        if (deltaY > 90) closeSheet()
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
        aria-hidden={!isOpen}
        {...(!isOpen ? { inert: '' } : {})}
        className={cn(
          'fixed left-0 right-0 z-50',
          'bg-card rounded-t-[28px]',
          noScroll
            ? 'flex flex-col overflow-hidden'
            : 'overflow-y-auto overscroll-contain no-scrollbar',
          'transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform',
          'px-5 pt-3',
          className,
        )}
        style={{
          bottom: isOpen ? `${keyboardHeight}px` : '0px',
          maxHeight: isOpen
            ? `calc(92dvh - ${keyboardHeight}px)`
            : '92dvh',
          paddingBottom: isOpen
            ? (keyboardHeight > 0 ? '8px' : '40px')
            : undefined,
          transform: isOpen
            ? 'translateY(0)'
            : 'translateY(calc(100% + env(safe-area-inset-bottom)))',
        }}
      >
        {/* Handle */}
        {handleOverlay ? (
          // Hauteur nulle : la poignée est dessinée par-dessus l'image sans
          // pousser le contenu vers le bas.
          <div className="h-0 relative z-20" aria-hidden>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/70" />
          </div>
        ) : (
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 flex-shrink-0" />
        )}
        {mounted && children}
      </div>
    </>
  )
}
