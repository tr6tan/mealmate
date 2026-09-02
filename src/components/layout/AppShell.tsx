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
        /*
         * La zone de gestes est réservée ici, une fois pour toutes. La barre
         * de navigation vit dans le flux (dernier enfant de ce conteneur
         * flex) : elle se pose donc juste au-dessus, sans dépendre de la
         * façon dont le navigateur traite les `position: fixed`, qui varie
         * d'un appareil à l'autre.
         */
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Contenu, chaque page gère son propre scroll */}
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

      {/* Sheets & toasts */}
      {children}
    </div>
  )
}
