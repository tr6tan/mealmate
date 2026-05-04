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
        className="fixed z-50 text-[10px] font-mono opacity-30 pointer-events-none select-none"
        style={{ bottom: 6, left: 8, color: '#0018A8' }}
      >
        v{__APP_VERSION__} · {__BUILD_TIME__}
      </span>

      {/* Debug safe area — TEMP */}
      <div
        style={{ position: 'fixed', bottom: 0, right: 0, fontSize: 11, background: 'rgba(255,0,0,0.85)', color: '#fff', padding: '2px 6px', zIndex: 99999, pointerEvents: 'none' }}
        ref={(el) => {
          if (!el) return
          const probe = document.createElement('div')
          probe.style.cssText = 'position:fixed;bottom:0;height:1px;width:1px;pointer-events:none;opacity:0'
          document.body.appendChild(probe)
          const sab = parseFloat(getComputedStyle(probe).getPropertyValue('bottom')) || 0
          const innerH = window.innerHeight
          const screenH = window.screen.height
          el.textContent = `sab≈${Math.round(screenH-innerH)}px iH=${innerH} sH=${screenH}`
          document.body.removeChild(probe)
        }}
      />

      {/* Sheets & toasts */}}
      {children}
    </div>
  )
}
