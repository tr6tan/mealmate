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
  surgeles: 'Surgelés',
  maison: 'Maison & Hygiène',
}

/** Vibration haptic légère (iOS silent, Android light) */
export function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern) } catch { /* silencé si non supporté */ }
}

// ── Recherche floue (fuzzy search) ──────────────────────────────────────────

/** Retire accents + minuscules */
function normalizeStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/** Distance de Levenshtein bornée */
function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

/**
 * Recherche floue : retourne un score > 0 si `query` matche `target`.
 * Tolère fautes de frappe, accents manquants, sous-chaînes.
 * Score plus élevé = meilleur match.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = normalizeStr(query)
  const t = normalizeStr(target)
  if (!q) return 1 // query vide → tout match
  if (t === q) return 100 // exact
  if (t.includes(q)) return 80 // sous-chaîne exacte
  if (q.length >= 3 && t.startsWith(q)) return 90 // préfixe

  // Recherche par mots du query dans le target
  const qWords = q.split(/\s+/).filter(w => w.length >= 2)
  const tWords = t.split(/\s+/)
  if (qWords.length === 0) return 1

  let totalScore = 0
  for (const qw of qWords) {
    let bestWord = 0
    for (const tw of tWords) {
      if (tw.includes(qw)) { bestWord = 60; break }
      if (qw.length >= 3 && tw.startsWith(qw)) { bestWord = Math.max(bestWord, 55); continue }
      const d = levenshtein(qw, tw)
      if (d <= 1 && qw.length >= 3) bestWord = Math.max(bestWord, 40)
      else if (d <= 2 && qw.length >= 5) bestWord = Math.max(bestWord, 20)
    }
    // Aussi tester contre le target entier (ex: "bolo" dans "bolognaise")
    if (bestWord < 60 && t.includes(qw)) bestWord = Math.max(bestWord, 50)
    totalScore += bestWord
  }

  return totalScore / qWords.length
}

/**
 * Filtre + trie une liste par pertinence fuzzy.
 * Retourne uniquement les éléments avec un score suffisant.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  minScore = 15,
): (T & { _fuzzyScore: number })[] {
  if (!query.trim()) return items.map(item => ({ ...item, _fuzzyScore: 1 }))
  return items
    .map(item => ({ ...item, _fuzzyScore: fuzzyScore(query, getText(item)) }))
    .filter(item => item._fuzzyScore >= minScore)
    .sort((a, b) => b._fuzzyScore - a._fuzzyScore)
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
