import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DayPlan } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DAY_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'] as const
export const DAY_LONG  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
export const MONTHS    = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'] as const

export const PERIOD_LABEL = { pdej: 'Petit-dej', midi: 'Midi', soir: 'Soir' } as const
export const PERIOD_LONG  = { pdej: 'Petit-déjeuner', midi: 'Déjeuner', soir: 'Dîner' } as const

/** Lundi de la semaine courante (ou d'une date donnée) */
export function getWeekMonday(from = new Date()): Date {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d
}

/** Lundi de la semaine courante + offset (en semaines, peut être négatif) */
export function getMondayByOffset(offset: number): Date {
  const monday = getWeekMonday()
  monday.setDate(monday.getDate() + offset * 7)
  return monday
}

/** Clé unique pour une semaine (YYYY-MM-DD du lundi) */
export function getWeekKey(monday: Date): string {
  const y = monday.getFullYear()
  const m = String(monday.getMonth() + 1).padStart(2, '0')
  const d = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Date du Nième jour à partir du lundi */
export function getDayFromMonday(monday: Date, dayIdx: number): Date {
  const d = new Date(monday)
  d.setDate(monday.getDate() + dayIdx)
  return d
}

/** Index du jour actuel dans la semaine (0=Lun…6=Dim), ou -1 si hors semaine */
export function getTodayIndex(monday: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = getDayFromMonday(monday, i)
    if (d.getTime() === today.getTime()) return i
  }
  return -1
}

export function emptyDay(): DayPlan {
  return {
    pdej: null,
    midi: null,
    midi_entree: null,
    midi_dessert: null,
    soir: null,
    soir_entree: null,
    soir_dessert: null,
  }
}

export const CAT_LABELS: Record<string, string> = {
  legumes: 'Fruits & Légumes',
  viandes: 'Viandes',
  cremerie: 'Crèmerie',
  epicerie: 'Épicerie',
  maison: 'Maison & Hygiène',
}

/** Vibration haptic légère (iOS silent, Android light) */
export function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern) } catch { /* silencé si non supporté */ }
}

/** Redimensionne + compresse une image (File) en base64 JPEG */
export function resizeToBase64(file: File, maxW = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
