/**
 * Identité du foyer.
 *
 * Un foyer = un document Firestore, partagé entre les membres qui en
 * connaissent l'identifiant. L'id se propage par le lien d'invitation
 * (`?foyer=…`) puis est mémorisé localement.
 *
 * Historique : l'app a longtemps utilisé un id unique codé en dur, ce qui
 * donnait le même planning à toute personne ouvrant l'URL. Cet id reste le
 * défaut pour ne pas couper les foyers existants de leurs données, mais
 * `createFoyer()` permet désormais d'en obtenir un privé.
 */
import { nanoid } from '@/lib/nanoid'

/** Foyer historique, défaut pour les installations antérieures au multi-foyer. */
const LEGACY_FOYER_ID = 'c1cfad8f-ddba-4518-a320-7776f3c0f5f7'

const STORAGE_KEY = 'mealmate-foyer-id'
const QUERY_PARAM = 'foyer'

/**
 * Un id de foyer plausible : évite qu'une URL bricolée pointe n'importe où.
 * La borne basse (16) est la même que dans firestore.rules, un id court
 * serait devinable par énumération.
 */
function isValidFoyerId(id: string | null | undefined): id is string {
  return !!id && /^[A-Za-z0-9_-]{16,64}$/.test(id)
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function store(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* mode privé : on retombera sur l'URL ou le défaut */
  }
}

let _cached: string | null = null

/**
 * Id du foyer courant, par ordre de priorité :
 *   1. `?foyer=…` dans l'URL (lien d'invitation), mémorisé au passage
 *   2. le dernier foyer utilisé sur cet appareil
 *   3. le foyer historique
 */
export function getFoyerId(): string {
  if (_cached) return _cached

  let id: string | null = null
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(QUERY_PARAM)
    if (isValidFoyerId(fromUrl)) {
      id = fromUrl
      store(id)
      // On nettoie l'URL : l'id est mémorisé, inutile de le laisser traîner.
      const url = new URL(window.location.href)
      url.searchParams.delete(QUERY_PARAM)
      window.history.replaceState({}, '', url.toString())
    }
  } catch {
    /* URL illisible : on continue */
  }

  if (!id) {
    const stored = readStored()
    if (isValidFoyerId(stored)) id = stored
  }

  _cached = id ?? LEGACY_FOYER_ID
  return _cached
}

/** Crée un foyer neuf et privé, et bascule dessus (rechargement requis). */
export function createFoyer(): string {
  const id = nanoid(21)
  store(id)
  _cached = id
  return id
}

/** Rejoint un foyer existant à partir de son id. */
export function joinFoyer(id: string): boolean {
  if (!isValidFoyerId(id)) return false
  store(id)
  _cached = id
  return true
}

/** Vrai tant que le foyer est celui partagé par défaut (donc pas privé). */
export function isLegacyFoyer(): boolean {
  return getFoyerId() === LEGACY_FOYER_ID
}

/** 'foyers_dev' sur la branche de test, 'foyers' en production. */
export const COLLECTION = import.meta.env.VITE_APP_ENV === 'dev' ? 'foyers_dev' : 'foyers'

/** URL de l'app (pour le QR code de partage). */
export function getSiteUrl(): string {
  return window.location.origin
}

/** Lien d'invitation : ouvre l'app directement sur le bon foyer. */
export function getInviteUrl(): string {
  return `${getSiteUrl()}/?${QUERY_PARAM}=${getFoyerId()}`
}
