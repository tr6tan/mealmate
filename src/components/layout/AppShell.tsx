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
    <div className="relative flex flex-col h-[100dvh] bg-bg overflow-hidden">
      {/* Contenu — chaque page gère son propre scroll */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {nav}
      </main>

      {/* Nav fixe en bas */}
      <BottomNav />

      {/* Remplissage safe-area sous la nav (coins arrondis iPhone) */}
      <div
        aria-hidden
        className="fixed bottom-0 left-0 right-0 bg-card"
        style={{ height: 'env(safe-area-inset-bottom, 0px)', zIndex: 29 }}
      />

      {/* Overlay */}
      {sheetState.sheet && (
        <div
          className="fixed inset-0 bg-black/45 z-40 transition-opacity"
          onClick={closeSheet}
        />
      )}

      {/* Sheets & toasts */}
      {children}
    </div>
  )
}
