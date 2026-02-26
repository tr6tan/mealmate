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
      {/* Contenu scrollable */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[72px]">
        {nav}
      </main>

      {/* Nav fixe en bas */}
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
