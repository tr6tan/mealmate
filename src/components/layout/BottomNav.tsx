import { useAppStore } from '@/store/useAppStore'
import type { ActiveTab } from '@/types'
import { Calendar, BookOpen, ShoppingBasket, Settings } from 'lucide-react'

interface NavItem {
  id: ActiveTab
  label: string
  icon: typeof Calendar
}

const navItems: NavItem[] = [
  { id: 'planning',  label: 'Semaine',  icon: Calendar },
  { id: 'recettes',  label: 'Recettes', icon: BookOpen },
  { id: 'courses',   label: 'Courses',  icon: ShoppingBasket },
  { id: 'settings',  label: 'Réglages', icon: Settings },
]

export default function BottomNav() {
  const activeTab    = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const shoppingItems = useAppStore((s) => s.shoppingItems)
  const remaining = shoppingItems.filter((i) => !i.checked).length

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 rounded-full px-2 py-2 flex gap-1 z-50"
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        background: '#0018A8',
        boxShadow: '0 8px 32px rgba(0,24,168,0.40), 0 1px 0 rgba(255,255,255,0.14) inset',
        border: '1px solid rgba(0,50,220,0.35)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            aria-label={item.label}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-200 active:scale-95 ${
              active
                ? 'bg-white text-[#0018A8]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {active && <span className="text-sm font-semibold">{item.label}</span>}
            {item.id === 'courses' && remaining > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-white text-[#0018A8] text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
                {remaining}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
