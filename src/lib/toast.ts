/**
 * Émetteur de toasts, séparé du composant qui les affiche.
 *
 * `showToast` est appelé depuis des modules qui ne sont pas des composants :
 * le garder dans Toast.tsx cassait le Fast Refresh (un fichier ne doit
 * exporter que des composants pour être rechargeable à chaud).
 */
export type ToastOptions = {
  action?: { label: string; onClick: () => void }
  duration?: number
}

type Handler = (msg: string, opts?: ToastOptions) => void

let handler: Handler | null = null

/** Branche l'afficheur. Appelé par le composant <Toast/> à son montage. */
export function setToastHandler(fn: Handler | null) {
  handler = fn
}

/** Affiche un message. Sans afficheur monté, l'appel est ignoré. */
export function showToast(msg: string, opts?: ToastOptions) {
  handler?.(msg, opts)
}
