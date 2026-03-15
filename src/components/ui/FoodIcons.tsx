/**
 * FoodIcons � Ic�nes SVG solid/filled pour MealMate
 * Style : chunky, g�om�trique, 100% fill (pas de stroke).
 * viewBox="0 0 24 24", fill="currentColor" sur tous les chemins.
 */
import type { ComponentProps } from 'react'
import type { Period, ShoppingCategory } from '@/types'

type P = ComponentProps<'svg'>

const Ico = ({ children, ...p }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    {children}
  </svg>
)

/* ---------------------------
   CAT�GORIES DE COURSES
--------------------------- */

/** L�gumes � carotte */
export function IconCarrot(p: P) {
  return (
    <Ico {...p}>
      <path d="M12 22c-.8 0-1.2-.6-1.4-1.4L9 9.3C8.8 8 10.2 7 12 7s3.2 1 3 2.3L13.4 20.6C13.2 21.4 12.8 22 12 22z"/>
      <path d="M12 7C11.5 5 11.8 2.5 12 1.5 12.2 2.5 12.5 5 12 7z"/>
      <path d="M11.5 7.1C10.2 5.4 7.8 5 6.5 5.9 7.4 7.7 9.8 8.3 11.5 7.1z"/>
      <path d="M12.5 7.1C13.8 5.4 16.2 5 17.5 5.9 16.6 7.7 14.2 8.3 12.5 7.1z"/>
    </Ico>
  )
}

/** Viandes � cuisse de poulet */
export function IconDrumstick(p: P) {
  return (
    <Ico {...p}>
      <circle cx="8.5" cy="8.5" r="6"/>
      <rect x="12" y="11.5" width="2.5" height="9" rx="1.25" transform="rotate(-40 12 11.5)"/>
      <circle cx="18" cy="18" r="2.2"/>
    </Ico>
  )
}

/** Cr�merie � fromage wedge */
export function IconCheese(p: P) {
  return (
    <Ico {...p}>
      <path d="M2 19L12 3l10 16H2z"/>
      <circle cx="9" cy="13" r="1.4" opacity="0.25"/>
      <circle cx="14.5" cy="15" r="1" opacity="0.25"/>
      <circle cx="11.5" cy="16.5" r="0.8" opacity="0.25"/>
    </Ico>
  )
}

/** �picerie � panier en osier */
export function IconBasket(p: P) {
  return (
    <Ico {...p}>
      <path fillRule="evenodd" clipRule="evenodd" d="M8.5 11C8.5 8 10.1 6 12 6s3.5 2 3.5 5h-2C13.5 9.4 12.8 8 12 8s-1.5 1.4-1.5 3h-2z"/>
      <path d="M3 11h18l-2.2 9.5a1 1 0 0 1-1 .5H6.2a1 1 0 0 1-1-.5L3 11z"/>
    </Ico>
  )
}

/** Maison */
export function IconHouse(p: P) {
  return (
    <Ico {...p}>
      <path d="M12 2L1 10.5h3V22h6v-6h4v6h6V10.5h3L12 2z"/>
    </Ico>
  )
}

/* ---------------------------
   P�RIODES DE REPAS
--------------------------- */

/** Petit-d�jeuner � tasse de caf� */
export function IconCoffee(p: P) {
  return (
    <Ico {...p}>
      <path d="M8.5 2C8.5 3.5 7.5 4.5 7.5 6c0-1.5 1-2.5 1-4zM12 2c0 1.5-1 2.5-1 4 0-1.5 1-2.5 1-4zM15.5 2c0 1.5-1 2.5-1 4 0-1.5 1-2.5 1-4z" opacity="0.55"/>
      <path d="M4 8h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M20 10.5h1a2 2 0 0 1 0 4h-1V13h1a.5.5 0 0 0 0-1h-1v-1.5z"/>
      <rect x="2" y="20.5" width="20" height="1.5" rx=".75"/>
    </Ico>
  )
}

/** D�jeuner � fourchette + couteau */
export function IconPlate(p: P) {
  return (
    <Ico {...p}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 2h1v3.2h.6V2h1v3.2h.6V2h1v4.2a2 2 0 0 1-1.5 1.94l-.2 12.34a.5.5 0 0 1-1 0L9.5 8.14A2 2 0 0 1 8 6.2V2h-.5z"/>
      <path d="M15.5 2c0 3.5-1.2 5.5-1.2 7.5v11a.7.7 0 0 0 1.4 0v-5.3h1V2h-1.2z"/>
    </Ico>
  )
}

/** D�ner � lune croissant */
export function IconMoon(p: P) {
  return (
    <Ico {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
    </Ico>
  )
}

/* ---------------------------
   SLOTS REPAS
--------------------------- */

/** Entr�e � bol salade */
export function IconSalad(p: P) {
  return (
    <Ico {...p}>
      <path d="M3 13h18a9 9 0 0 1-18 0z"/>
      <path d="M12 13C11 9 8.5 6 6 7c.8 3.5 3.5 6.5 6 6z"/>
      <path d="M12 13C13 9 15.5 6 18 7c-.8 3.5-3.5 6.5-6 6z"/>
      <rect x="11.5" y="5" width="1" height="8" rx=".5"/>
    </Ico>
  )
}

/** Dessert � cupcake */
export function IconCupcake(p: P) {
  return (
    <Ico {...p}>
      <path d="M7 11C7 7.7 9.2 5.5 12 5.5S17 7.7 17 11H7z"/>
      <circle cx="12" cy="5" r="1.8"/>
      <path d="M6 11h12l-1.5 8a1 1 0 0 1-1 .8H8.5a1 1 0 0 1-1-.8L6 11z"/>
    </Ico>
  )
}

/** G�n�rique � fourchette */
export function IconFork(p: P) {
  return (
    <Ico {...p}>
      <path fillRule="evenodd" clipRule="evenodd" d="M7.5 2h1v3.2h.6V2h1v3.2h.6V2h1v4.2a2 2 0 0 1-1.5 1.94l-.2 12.34a.5.5 0 0 1-1 0L9.5 8.14A2 2 0 0 1 8 6.2V2h-.5z"/>
      <path d="M15.5 2c0 3.5-1.2 5.5-1.2 7.5v11a.7.7 0 0 0 1.4 0v-5.3h1V2h-1.2z"/>
    </Ico>
  )
}

/* ---------------------------
   COMPOSANTS UTILITAIRES
--------------------------- */

/** Ic�ne automatique selon la p�riode */
export function PeriodIcon({ period, ...p }: { period: Period } & P) {
  if (period === 'pdej') return <IconCoffee {...p} />
  if (period === 'midi') return <IconPlate {...p} />
  return <IconMoon {...p} />
}

/** Ic�ne automatique selon la cat�gorie de courses */
export function CategoryIcon({ category, ...p }: { category: ShoppingCategory } & P) {
  if (category === 'legumes')  return <IconCarrot {...p} />
  if (category === 'viandes')  return <IconDrumstick {...p} />
  if (category === 'cremerie') return <IconCheese {...p} />
  if (category === 'epicerie') return <IconBasket {...p} />
  if (category === 'surgeles') return <IconBasket {...p} />
  return <IconHouse {...p} />
}
