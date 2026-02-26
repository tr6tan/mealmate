import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export default function SyncBanner() {
  const syncStatus = useAppStore((s) => s.syncStatus)

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[300] flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-white',
        'transition-all duration-400 ease-in-out',
        syncStatus === 'error'
          ? 'translate-y-0 opacity-100 bg-[#C0304A]'
          : '-translate-y-full opacity-0 pointer-events-none bg-transparent',
      )}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <span>⚠️</span>
      <span>Hors ligne — données sauvegardées localement</span>
    </div>
  )
}
