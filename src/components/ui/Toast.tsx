import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastOptions = {
  action?: { label: string; onClick: () => void }
  duration?: number
}

let _setToast: ((msg: string, opts?: ToastOptions) => void) | null = null

export function showToast(msg: string, opts?: ToastOptions) {
  _setToast?.(msg, opts)
}

export default function Toast() {
  const [msg, setMsg] = useState('')
  const [action, setAction] = useState<ToastOptions['action']>(undefined)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    _setToast = (m, opts) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setMsg(m)
      setAction(opts?.action)
      setVisible(true)
      const duration = opts?.duration ?? (opts?.action ? 3500 : 2200)
      timerRef.current = setTimeout(() => setVisible(false), duration)
    }
    return () => { _setToast = null }
  }, [])

  return (
    <div
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[200]',
        'bg-text1 text-white px-4 py-3 rounded-2xl',
        'text-[13px] font-bold whitespace-nowrap',
        'transition-all duration-300 flex items-center gap-3',
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none',
      )}
    >
      <span>{msg}</span>
      {action && (
        <button
          onClick={() => { action.onClick(); setVisible(false) }}
          className="text-terra font-extrabold text-[13px] bg-white/15 px-2.5 py-1 rounded-xl active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
