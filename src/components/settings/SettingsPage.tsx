import { useState, type ReactNode } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'
import InviteCard from './InviteCard'
import { useFoyerPresence } from '@/hooks/useFoyerPresence'

// ─── Ligne de réglage ─────────────────────────────────────────────────────────
interface SettingsRowProps {
  icon: ReactNode
  iconBg: string
  label: string
  value?: string
  sub?: string
  onClick: () => void
  danger?: boolean
  confirmLabel?: string
  confirming?: boolean
}
function SettingsRow({ icon, iconBg, label, value, sub, onClick, danger, confirmLabel, confirming }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-sep last:border-0 transition-colors active:bg-sep ${
        confirming ? 'bg-[#FDE8F0]' : 'hover:bg-sep'
      }`}
    >
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-bold ${danger ? 'text-[#C0304A]' : 'text-text1'}`}>
          {confirming ? (confirmLabel ?? label) : label}
        </p>
        {sub && !confirming && <p className="text-[11px] text-muted font-medium mt-0.5">{sub}</p>}
      </div>
      {value && !confirming && (
        <span className="text-[13px] font-bold text-muted mr-1">{value}</span>
      )}
      <span className={`text-lg ${confirming ? 'text-[#C0304A]' : 'text-muted'}`}>›</span>
    </button>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
type DangerField = 'week' | 'recipes' | null

export default function SettingsPage() {
  const settings       = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const clearWeek      = useAppStore((s) => s.clearWeek)
  const resetRecipes   = useAppStore((s) => s.resetRecipes)
  const syncStatus     = useAppStore((s) => s.syncStatus)
  const recipes        = useAppStore((s) => s.recipes)
  const shoppingItems  = useAppStore((s) => s.shoppingItems)
  const weekPlan       = useAppStore(selectCurrentWeekPlan)
  const onlineCount    = useFoyerPresence()

  const [dangerField, setDangerField] = useState<DangerField>(null)

  // Comptage repas semaine courante
  const mealsCount = Object.values(weekPlan).reduce((acc, day) => {
    return acc + (['pdej', 'midi', 'soir'] as const).filter(s => !!day[s]).length
  }, 0)

  // Sync badge
  const syncLabel = syncStatus === 'synced' ? 'Synchronisé' : syncStatus === 'error' ? 'Hors ligne' : 'Connexion…'
  const syncBg    = syncStatus === 'synced' ? 'bg-[#E8F5E9] text-[#2E7D32]' : syncStatus === 'error' ? 'bg-[#FDE8F0] text-[#C0304A]' : 'bg-[#FFFDE7] text-[#F57F17]'
  const syncDot   = syncStatus === 'synced' ? 'bg-[#4CAF50]' : syncStatus === 'error' ? 'bg-[#C0304A]' : 'bg-[#FFC107] animate-pulse'

  // Handlers danger (2-tap — 1er tap = demande confirm, 2e tap = exécute)
  const handleDanger = (field: DangerField) => {
    if (dangerField === field) {
      if (field === 'week')    { clearWeek();    showToast('Semaine effacée') }
      if (field === 'recipes') { resetRecipes(); showToast('Recettes réinitialisées') }
      setDangerField(null)
    } else {
      setDangerField(field)
      setTimeout(() => setDangerField(null), 3000)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 pt-safe" />
      <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain pb-nav-safe">

      {/* ── Hero ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="bg-card rounded-2xl border-[1.5px] border-border p-4 flex items-center gap-4">
          <img src="/favicon.svg" alt="MealMate" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-black text-text1">MealMate</h2>
            <p className="text-[12px] text-muted font-semibold mt-0.5">
              {onlineCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
                  <span className="text-[#2E7D32]">Partenaire en ligne</span>
                </span>
              ) : 'Votre planning repas partagé'}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-extrabold flex-shrink-0 ${syncBg}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${syncDot}`} />
            {syncLabel}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="px-5 mb-5">
        <div className="bg-card rounded-2xl border-[1.5px] border-border overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-sep py-4">
            <div className="text-center px-2">
              <p className="text-[22px] font-black text-text1 leading-none">{recipes.length}</p>
              <p className="text-[10px] font-bold text-muted mt-1.5 leading-tight">Recettes</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[22px] font-black text-text1 leading-none">{mealsCount}</p>
              <p className="text-[10px] font-bold text-muted mt-1.5 leading-tight">Repas semaine</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[22px] font-black text-text1 leading-none">{shoppingItems.length}</p>
              <p className="text-[10px] font-bold text-muted mt-1.5 leading-tight">Articles courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Préférences ── */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Préférences</p>
        <div className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden">
          <SettingsRow
          icon={<svg className="w-5 h-5 text-text2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            iconBg="bg-[#EEF2FF]"
            label="Mode sombre"
            value={settings.darkMode ? 'Actif' : 'Désactivé'}
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          />
        </div>
      </div>

      {/* ── Partager l'app ── */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Partager l'app</p>
        <InviteCard onlineCount={onlineCount} />
      </div>

      {/* ── Données ── */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Données</p>
        <div className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden">
          <SettingsRow
          icon={<svg className="w-5 h-5 text-[#C0304A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
            iconBg="bg-[#FDE8F0]"
            label="Effacer la semaine"
            sub="Remet tous les repas à zéro"
            onClick={() => handleDanger('week')}
            danger
            confirming={dangerField === 'week'}
            confirmLabel="Appuyer à nouveau pour confirmer"
          />
          <SettingsRow
          icon={<svg className="w-5 h-5 text-[#C0304A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>}
            iconBg="bg-[#FDE8F0]"
            label="Réinitialiser les recettes"
            sub="Supprime vos recettes personnalisées"
            onClick={() => handleDanger('recipes')}
            danger
            confirming={dangerField === 'recipes'}
            confirmLabel="Appuyer à nouveau pour confirmer"
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 text-center mt-2 pb-6">
        <p className="text-[11px] font-semibold text-muted">MealMate v1.0 · Fait avec <svg className="w-3 h-3 inline text-[#C0304A]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></p>
      </div>
      </div>{/* /scroll */}

    </div>
  )
}
