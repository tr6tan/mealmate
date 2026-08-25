import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import BottomNav from './BottomNav'

interface Props {
  nav: ReactNode
  children?: ReactNode
}

export default function AppShell({ nav, children }: Props) {
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
        style={{ bottom: 6, left: 8 }}
      >
        v{__APP_VERSION__} · {__BUILD_TIME__}
      </span>

      {/* Peint la safe area bas en beige (iOS auto-offset annulé) */}
      <div
        className="fixed left-0 right-0 z-[49] pointer-events-none bg-bg"
        style={{
          bottom: 'calc(-1 * env(safe-area-inset-bottom))',
          height: 'env(safe-area-inset-bottom)',
        }}
      />

      {/* Sheets & toasts */}
      {children}
    </div>
  )
}
