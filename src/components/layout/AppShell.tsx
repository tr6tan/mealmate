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
        /* position:fixed inset:0 est le moyen le plus robuste de couvrir
           exactement l'écran physique sur iOS PWA (évite les bugs dvh/fill-available) */
        position: 'fixed',
        inset: 0,
      }}
    >
      {/* Contenu — chaque page gère son propre scroll */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {nav}
      </main>

      {/* Nav en bas — élément flex normal dans AppShell (pas fixed) */}
      <BottomNav />

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
