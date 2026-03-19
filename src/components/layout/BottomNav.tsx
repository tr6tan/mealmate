import { useAppStore } from '@/store/useAppStore'
import type { ActiveTab } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  id: ActiveTab
  label: string
  emoji: string
}

const navItems: NavItem[] = [
  { id: 'planning',  label: 'Semaine',  emoji: '📅' },
  { id: 'recettes',  label: 'Recettes', emoji: '📖' },
  { id: 'courses',   label: 'Courses',  emoji: '🛒' },
  { id: 'settings',  label: 'Réglages', emoji: '⚙️' },
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
                    ? 'w-12 h-7 bg-terra-light'
                    : 'w-9 h-6 grayscale opacity-60',
                )}
              >
                <span className="text-[18px] leading-none" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
                  {item.emoji}
                </span>
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
