import type { ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { ActiveTab } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  id: ActiveTab
  label: string
  icon: (active: boolean) => ReactNode
}

const navItems: NavItem[] = [
  {
    id: 'planning',
    label: 'Semaine',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={active ? 'currentColor' : 'none'} />
        {!active && <line x1="9" y1="7" x2="15" y2="7" />}
      </svg>
    ),
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill={active ? 'currentColor' : 'none'} />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Réglages',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={active ? 'rgb(var(--c-card))' : 'none'} />
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
    <nav className="bg-card/95 backdrop-blur-xl border-t border-border/60 flex flex-col flex-shrink-0">
      <div className="flex justify-around items-stretch pt-1 pb-0.5">
        {navItems.map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              className="flex flex-col items-center gap-0.5 py-1 px-3 flex-1 border-none bg-transparent cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra rounded-lg active:scale-90 transition-transform duration-150"
            >
              {/* Pill background actif */}
              <span
                className={cn(
                  'relative flex items-center justify-center rounded-2xl transition-all duration-250',
                  active
                    ? 'w-14 h-8 bg-terra-light [&>svg]:w-[20px] [&>svg]:h-[20px] text-terra'
                    : 'w-10 h-7 [&>svg]:w-[18px] [&>svg]:h-[18px] text-muted',
                )}
              >
                {item.icon(active)}
                {item.id === 'courses' && remaining > 0 && (
                  <span className="absolute -top-1.5 -right-0.5 min-w-[18px] h-[18px] bg-terra text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
                    {remaining}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold tracking-wide transition-colors duration-200',
                  active ? 'text-terra' : 'text-muted',
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
