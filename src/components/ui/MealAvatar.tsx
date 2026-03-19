import { cn } from '@/lib/utils'

const AVATAR_COLORS = [
  { bg: '#FECDD3', text: '#9F1239' },
  { bg: '#FED7AA', text: '#9A3412' },
  { bg: '#FDE68A', text: '#92400E' },
  { bg: '#BBF7D0', text: '#166534' },
  { bg: '#A7F3D0', text: '#065F46' },
  { bg: '#BAE6FD', text: '#0C4A6E' },
  { bg: '#BFDBFE', text: '#1E40AF' },
  { bg: '#C7D2FE', text: '#3730A3' },
  { bg: '#DDD6FE', text: '#5B21B6' },
  { bg: '#FBCFE8', text: '#9D174D' },
  { bg: '#99F6E4', text: '#115E59' },
  { bg: '#E5E7EB', text: '#374151' },
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const SIZE = {
  xs:   'w-5 h-5 text-[8px] rounded-md',
  sm:   'w-7 h-7 text-[10px] rounded-lg',
  md:   'w-9 h-9 text-[12px] rounded-xl',
  lg:   'w-10 h-10 text-[13px] rounded-[10px]',
  card: 'w-12 h-12 text-[16px] rounded-xl',
  xl:   'w-[72px] h-[72px] text-[24px] rounded-[20px]',
} as const

interface Props {
  name: string
  size?: keyof typeof SIZE
  className?: string
}

export default function MealAvatar({ name, size = 'lg', className }: Props) {
  const idx = hashName(name) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[idx]
  const initials = getInitials(name || '?')

  return (
    <div
      className={cn(
        'flex-shrink-0 flex items-center justify-center font-black select-none',
        SIZE[size],
        className,
      )}
      style={{ background: color.bg, color: color.text }}
    >
      {initials}
    </div>
  )
}
