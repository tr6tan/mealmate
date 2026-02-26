import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

let _setToast: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  _setToast?.(msg)
}

export default function Toast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _setToast = (m) => {
      setMsg(m)
      setVisible(true)
      setTimeout(() => setVisible(false), 2200)
    }
    return () => { _setToast = null }
  }, [])

  return (
    <div
      style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-[200]',
        'bg-text1 text-white px-4 py-3 rounded-2xl',
        'text-[13px] font-bold whitespace-nowrap pointer-events-none',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      )}
    >
      {msg}
    </div>
  )
}
