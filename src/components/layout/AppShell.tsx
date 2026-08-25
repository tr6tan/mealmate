import { useEffect, useState, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import BottomNav from './BottomNav'

interface Props {
  nav: ReactNode
  children?: ReactNode
}

export default function AppShell({ nav, children }: Props) {
  // Diagnostic temporaire affiché à côté de la version (cf. useFixedInsetProbe)
  const [probe, setProbe] = useState('')
  useEffect(() => {
    const lire = () => setProbe(document.documentElement.dataset.probe ?? '')
    lire()
    window.addEventListener('probe-updated', lire)
    return () => window.removeEventListener('probe-updated', lire)
  }, [])

  const sheetState = useAppStore((s) => s.sheetState)
  const closeSheet = useAppStore((s) => s.closeSheet)

  return (
    <div
      className="relative flex flex-col bg-bg"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      {/* Contenu — chaque page gère son propre scroll */}
      <main className="flex-1 overflow-hidden flex flex-col h-full">
        {nav}
      </main>

      {/*
        Bandeau opaque derrière la barre d'état.
        `apple-mobile-web-app-status-bar-style: black-translucent` rend la
        barre transparente : sans ce bandeau, le contenu défile sous l'heure
        et les icônes système, qui deviennent illisibles.
      */}
      <div
        className="fixed left-0 right-0 z-[45] pointer-events-none bg-bg"
        style={{ top: 0, height: 'env(safe-area-inset-top)' }}
      />

      {/* Nav flottante (position:fixed, hors du flux) */}
      <BottomNav />

      {/* Overlay */}
      {sheetState.sheet && (
        <div
          className="fixed inset-0 bg-black/45 z-40 transition-opacity"
          onClick={closeSheet}
        />
      )}

      {/* Version badge */}
      <span
        className="fixed z-50 text-[10px] font-mono pointer-events-none select-none text-muted"
        style={{ bottom: 'calc(4px - var(--fixed-bottom-gap, 0px))', left: 8 }}
      >
        v{__APP_VERSION__} · {__BUILD_TIME__} · {probe}
      </span>

      {/* Sheets & toasts */}
      {children}
    </div>
  )
}
