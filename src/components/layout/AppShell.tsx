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
      className="relative flex flex-col bg-bg overflow-hidden"
      style={{
        height: '100dvh',
        /* Fallback pour iOS Safari < 15.4 qui ne supporte pas dvh */
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Contenu — chaque page gère son propre scroll */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {nav}
      </main>

      {/* Nav fixe en bas */}
      <BottomNav />

      {/* Remplissage safe-area sous la nav (home indicator iPhone).
           On utilise un paddingBottom très généreux pour couvrir la zone physique
           même si env() n'est pas calculé à temps au premier rendu. */}
      <div
        aria-hidden
        className="fixed bottom-0 left-0 right-0 bg-card"
        style={{
          height: 'calc(env(safe-area-inset-bottom, 0px) + 2px)',
          zIndex: 29,
          transform: 'translateY(2px)', /* déborde légèrement sous le bord physique */
        }}
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
