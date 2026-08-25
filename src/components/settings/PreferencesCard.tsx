import { useAppStore } from '@/store/useAppStore'
import type { ThemeName } from '@/types'

/**
 * Préférences du foyer : apparence et nombre de convives.
 *
 * Ces réglages existaient dans le modèle (`settings.darkMode`, `theme`,
 * `personnes`) sans aucun contrôle dans l'interface : le mode sombre et le
 * thème Océan étaient donc impossibles à activer, et le nombre de personnes
 * n'était lu nulle part.
 */

const THEMES: { key: ThemeName; label: string; puce: string }[] = [
  { key: 'classic', label: 'Classique', puce: '#0018A8' },
  { key: 'ocean', label: 'Océan', puce: '#2563EB' },
]

export default function PreferencesCard() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)

  const theme = settings.theme ?? 'classic'
  const dark = !!settings.darkMode
  const personnes = settings.personnes

  return (
    <div className="glass rounded-[32px] p-5 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-fill/50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-text1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[15px] text-text1">Apparence</p>
          <p className="text-xs text-muted">Thème et mode sombre</p>
        </div>
      </div>

      {/* Thème */}
      <div className="flex gap-2">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => updateSettings({ theme: t.key })}
            aria-pressed={theme === t.key}
            className={`flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-2xl text-sm font-semibold transition-all active:scale-95 ${
              theme === t.key
                ? 'bg-terra text-white'
                : 'bg-fill/50 text-text2 border border-border'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ background: t.puce }}
              aria-hidden
            />
            {t.label}
          </button>
        ))}
      </div>

      {/* Mode sombre */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text1">Mode sombre</p>
          <p className="text-xs text-muted">Réglage propre à cet appareil</p>
        </div>
        <button
          role="switch"
          aria-checked={dark}
          aria-label="Mode sombre"
          onClick={() => updateSettings({ darkMode: !dark })}
          className={`relative w-[52px] h-8 rounded-full transition-colors flex-shrink-0 ${
            dark ? 'bg-terra' : 'bg-border'
          }`}
        >
          <span
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform"
            style={{ transform: dark ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {/* Nombre de convives */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text1">Nombre de personnes</p>
          <p className="text-xs text-muted">Base des quantités de recettes</p>
        </div>
        <div className="flex items-center gap-1 bg-fill/50 border border-border rounded-full p-1 flex-shrink-0">
          <button
            onClick={() => updateSettings({ personnes: Math.max(1, personnes - 1) })}
            aria-label="Une personne de moins"
            disabled={personnes <= 1}
            className="w-10 h-10 rounded-full flex items-center justify-center text-text2 font-black text-lg active:scale-90 transition-transform disabled:opacity-30"
          >
            −
          </button>
          <span className="text-sm font-bold text-text1 min-w-[24px] text-center" aria-live="polite">
            {personnes}
          </span>
          <button
            onClick={() => updateSettings({ personnes: Math.min(12, personnes + 1) })}
            aria-label="Une personne de plus"
            disabled={personnes >= 12}
            className="w-10 h-10 rounded-full flex items-center justify-center text-text2 font-black text-lg active:scale-90 transition-transform disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
