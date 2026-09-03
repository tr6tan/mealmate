import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import FoyerCard from './FoyerCard'
import PreferencesCard from './PreferencesCard'
import CreditsPhotosCard from './CreditsPhotosCard'
import type { DietFilter } from '@/types'

export default function SettingsPage() {
  const openSheet = useAppStore((st) => st.openSheet)

  const settings       = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const recipes        = useAppStore((s) => s.recipes)
  const weekPlan       = useAppStore(selectCurrentWeekPlan)

  const diet       = (settings.diet ?? 'all') as DietFilter
  const favCount   = recipes.filter(r => r.fav).length
  const mealsCount = Object.values(weekPlan).reduce(
    (acc, day) => acc + (['midi', 'soir'] as const).filter(s => !!day[s]).length, 0
  )
  const vegeCount  = recipes.filter(r => r.tags?.some(t => t === 'vegetarien' || t === 'vegan')).length
  const veganCount = recipes.filter(r => r.tags?.includes('vegan')).length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
      <div className="flex-shrink-0 pt-safe" />
      <div className="px-5 pt-4 pb-nav-safe flex flex-col gap-4">

        {/* ── Régime alimentaire ── */}
        <div className="glass rounded-[32px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-fill/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-text1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[15px] text-text1">Régime alimentaire</p>
              <p className="text-xs text-muted">Filtre les recettes affichées</p>
            </div>
          </div>
          {/* Les trois puces passaient hors de la carte : « Végé restreint »
              était coupé au bord droit. Elles s'enroulent désormais, et les
              libellés raccourcissent pour tenir à deux par ligne. */}
          <div className="flex flex-wrap gap-2 mb-3">
            {(['all', 'vege', 'vegan'] as DietFilter[]).map(d => (
              <button
                key={d}
                onClick={() => updateSettings({ diet: d })}
                aria-pressed={diet === d}
                className={`px-4 min-h-[40px] rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  diet === d
                    ? 'bg-terra text-white shadow-[0_4px_12px_rgba(0,29,193,0.3)]'
                    : 'bg-fill/50 text-text2 border border-border'
                }`}
              >
                {d === 'all' ? 'Tout' : d === 'vege' ? 'Végétarien' : 'Vegan'}
              </button>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-muted font-medium">
            <span>{recipes.length} recettes</span>
            <span>{vegeCount} végétariennes</span>
            <span>{veganCount} vegan</span>
          </div>
        </div>

        {/* ── Apparence & convives ── */}
        <PreferencesCard />

        {/* ── Favoris ── */}
        <div className="glass rounded-[32px] p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fill/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-text1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[15px] text-text1">
              {favCount} recette{favCount !== 1 ? 's' : ''} en favori
            </p>
            <p className="text-xs text-muted">{recipes.length} recettes au total</p>
          </div>
        </div>

        {/* ── Cette semaine ── */}
        <div className="glass rounded-[32px] p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fill/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-text1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[15px] text-text1">
              {mealsCount} repas planifié{mealsCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted">Cette semaine</p>
          </div>
        </div>

        {/* ── Foyer & partage ── */}
        <FoyerCard />

        {/* ── Revoir l'accueil ──
            Quatre écrans vus une fois au premier lancement ne se retiennent
            pas, et on veut pouvoir les montrer à quelqu'un. */}
        <button
          onClick={() => openSheet({ sheet: 'accueil' })}
          className="w-full h-12 rounded-2xl bg-black/[0.045] text-[14px] font-semibold text-text1 active:scale-[0.98] transition-transform"
        >
          Revoir la présentation
        </button>

        {/* ── Crédits ── */}
        <p className="text-[10px] text-muted text-center px-4 leading-relaxed">
          Icônes par <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="underline">Icons8</a>
        </p>
        <CreditsPhotosCard />

        {/* Version : ici plutôt qu'en surimpression de l'écran principal, où
            elle n'apportait rien à l'usage. */}
        <p className="text-[10px] text-muted text-center font-mono opacity-70">
          v{__APP_VERSION__} · {__BUILD_TIME__}
        </p>

      </div>
    </div>
  )
}
