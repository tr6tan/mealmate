import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export default function SyncBanner() {
  const syncStatus = useAppStore((s) => s.syncStatus)

  const isError   = syncStatus === 'error'
  const isSaving  = syncStatus === 'saving'
  const isUpdated = syncStatus === 'updated'
  const visible   = isError || isSaving || isUpdated

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[300] flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-white',
        'transition-all duration-400 ease-in-out',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none',
        isError   && 'bg-[#C0304A]',
        isSaving  && 'bg-[#E07B54]',
        isUpdated && 'bg-[#2E7D32]',
      )}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      {isError   && <><span>⚠️</span><span>Hors ligne — données sauvegardées localement</span></>}
      {isSaving  && <><span className="animate-spin inline-block">↻</span><span>Sauvegarde…</span></>}
      {isUpdated && <><span>✨</span><span>Planning mis à jour !</span></>}
    </div>
  )
}
