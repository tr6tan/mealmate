import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ActiveTab } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  id: ActiveTab
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  {
    id: 'planning',
    label: 'Semaine',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: 'recettes',
    label: 'Recettes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M9 12h6M12 9v6" />
      </svg>
    ),
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Réglages',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const activeTab    = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const shoppingItems = useAppStore((s) => s.shoppingItems)
  const remaining = shoppingItems.filter((i) => !i.checked).length

  return (
    <nav className="nav-ios-safe fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-sep flex justify-around items-stretch">
      {navItems.map((item) => {
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center gap-1 pt-2 pb-3 px-4 flex-1 border-none bg-transparent cursor-pointer"
          >
            <span
              className={cn(
                'relative flex items-center justify-center w-12 h-7 rounded-full [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-current transition-all duration-200',
                active ? 'bg-terra-light text-terra' : 'text-muted bg-transparent',
              )}
            >
              {item.icon}
              {item.id === 'courses' && remaining > 0 && (
                <span className="absolute -top-1 right-0.5 min-w-[16px] h-4 bg-terra text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1 leading-none">
                  {remaining}
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold tracking-wide transition-colors duration-200',
                active ? 'text-terra' : 'text-muted',
              )}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
