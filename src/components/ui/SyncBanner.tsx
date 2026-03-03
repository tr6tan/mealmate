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
        isSaving  && 'bg-[#D23D2D]',
        isUpdated && 'bg-[#2E7D32]',
      )}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      {isError   && <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Hors ligne — données sauvegardées localement</span></>}
      {isSaving  && <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg><span>Sauvegarde…</span></>}
      {isUpdated && <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg><span>Planning mis à jour !</span></>}
    </div>
  )
}
