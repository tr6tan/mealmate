import { cn } from '@/lib/utils'
import { getStickerSlug, stickerUrl } from '@/lib/stickers'

interface Props {
  /** Nom du plat ou ingrédient (FR). On en déduit le slug. */
  name: string
  /** Slug forcé (court-circuite le mapping). */
  slug?: string | null
  /** Pixel size de l'image. */
  size?: number
  className?: string
  /** Rendu si aucun sticker ne matche (ex: <MealAvatar/>, emoji, initiales). */
  fallback?: React.ReactNode
  /** Drop-shadow autour de l'image (par défaut léger). */
  shadow?: boolean
}

/**
 * Affiche un sticker Icons8 local (`/icons/stickers/{slug}.png`).
 * Si aucun mapping ne matche `name`, retombe sur `fallback`.
 */
export default function FoodSticker({
  name,
  slug,
  size = 40,
  className,
  fallback = null,
  shadow = true,
}: Props) {
  const resolved = slug ?? getStickerSlug(name)
  if (!resolved) return <>{fallback}</>

  return (
    <img
      src={stickerUrl(resolved)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('object-contain select-none pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        filter: shadow ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))' : undefined,
      }}
    />
  )
}
