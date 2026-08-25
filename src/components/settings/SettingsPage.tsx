import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import FoyerCard from './FoyerCard'
import type { DietFilter } from '@/types'

export default function SettingsPage() {
  const settings       = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const setActiveTab   = useAppStore((s) => s.setActiveTab)
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
            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[15px] text-neutral-900">Régime alimentaire</p>
              <p className="text-xs text-neutral-500">Filtre les recettes affichées</p>
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            {(['all', 'vege', 'vegan'] as DietFilter[]).map(d => (
              <button
                key={d}
                onClick={() => updateSettings({ diet: d })}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                  diet === d
                    ? 'bg-[#001DC1] text-white shadow-[0_4px_12px_rgba(0,29,193,0.3)]'
                    : 'bg-white/50 text-neutral-700'
                }`}
              >
                {d === 'all' ? 'Tout' : d === 'vege' ? 'Végétarien·ne' : 'Végé restreint'}
              </button>
            ))}
          </div>
          <div className="flex gap-4 text-[11px] text-neutral-400 font-medium">
            <span>{recipes.length} recettes</span>
            <span>{vegeCount} végétariennes</span>
            <span>{veganCount} vegan</span>
          </div>
        </div>

        {/* ── Favoris ── */}
        <div className="glass rounded-[32px] p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[15px] text-neutral-900">
              {favCount} recette{favCount !== 1 ? 's' : ''} en favori
            </p>
            <p className="text-xs text-neutral-500">{recipes.length} recettes au total</p>
          </div>
        </div>

        {/* ── Cette semaine ── */}
        <div className="glass rounded-[32px] p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-[15px] text-neutral-900">
              {mealsCount} repas planifié{mealsCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-neutral-500">Cette semaine</p>
          </div>
        </div>

        {/* ── Accès rapide ── */}
        <div className="glass rounded-[32px] p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-neutral-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                <path d="M7 2v20"/>
                <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[15px] text-neutral-900">Accès rapide</p>
              <p className="text-xs text-neutral-500">Naviguer entre les sections</p>
            </div>
          </div>
          <div className="flex justify-between">
            {[
              {
                label: 'Éditeur',
                action: () => setActiveTab('recettes'),
                icon: (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                ),
              },
              {
                label: 'Planning',
                action: () => setActiveTab('planning'),
                icon: (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ),
              },
              {
                label: 'Courses',
                action: () => setActiveTab('courses'),
                icon: (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                ),
              },
              {
                label: 'Cuisine',
                action: () => setActiveTab('recettes'),
                icon: (
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                    <line x1="6" y1="17" x2="18" y2="17"/>
                  </svg>
                ),
              },
            ].map(({ label, action, icon }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <button
                  onClick={action}
                  aria-label={label}
                  className="w-12 h-12 rounded-full bg-[#0018A8] flex items-center justify-center shadow-[0_4px_16px_rgba(0,24,168,0.35)] active:scale-90 transition-transform"
                >
                  {icon}
                </button>
                <span className="text-[10px] text-neutral-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Foyer & partage ── */}
        <FoyerCard />

        {/* ── Crédits ── */}
        <p className="text-[10px] text-neutral-400 text-center px-4 leading-relaxed">
          Icônes par <a href="https://icons8.com" target="_blank" rel="noopener noreferrer" className="underline">Icons8</a>
        </p>

      </div>
    </div>
  )
}
