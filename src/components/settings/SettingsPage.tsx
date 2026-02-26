import { useAppStore } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'
import InviteCard from './InviteCard'

interface SettingsRowProps {
  icon: string
  iconBg: string
  label: string
  sub?: string
  onClick: () => void
  danger?: boolean
}

function SettingsRow({ icon, iconBg, label, sub, onClick, danger }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-sep last:border-0 transition-colors hover:bg-sep active:bg-sep"
    >
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-bold ${danger ? 'text-[#C0304A]' : 'text-text1'}`}>{label}</p>
        {sub && <p className="text-[11px] text-muted font-medium mt-0.5">{sub}</p>}
      </div>
      <span className="text-muted text-lg">›</span>
    </button>
  )
}

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const clearWeek = useAppStore((s) => s.clearWeek)
  const resetRecipes = useAppStore((s) => s.resetRecipes)
  const syncStatus = useAppStore((s) => s.syncStatus)

  const handlePersonnes = () => {
    const val = window.prompt('Nombre de personnes :', String(settings.personnes))
    if (val === null) return
    const n = parseInt(val)
    if (!isNaN(n) && n > 0) {
      updateSettings({ personnes: n })
      showToast('Mis à jour !')
    }
  }

  const handleNom = () => {
    const val = window.prompt('Nom du foyer :', settings.nomFoyer)
    if (val !== null) {
      updateSettings({ nomFoyer: val.trim() || settings.nomFoyer })
      showToast('Mis à jour !')
    }
  }

  const handleClearWeek = () => {
    if (window.confirm('Effacer toute la semaine ?')) {
      clearWeek()
      showToast('Semaine effacée')
    }
  }

  const handleResetRecipes = () => {
    if (window.confirm('Réinitialiser toutes les recettes ?')) {
      resetRecipes()
      showToast('Recettes réinitialisées')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-black text-text1">Réglages</h1>
        <p className="text-[13px] text-muted font-semibold mt-0.5">Préférences</p>
      </div>

      {/* Section Planning */}
      <div className="px-5 mb-5">
        <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Planning</p>
        <div className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden">
          <SettingsRow
            icon="👤"
            iconBg="bg-[#FFF3EE]"
            label="Nombre de personnes"
            sub={`${settings.personnes} personne${settings.personnes > 1 ? 's' : ''}`}
            onClick={handlePersonnes}
          />
          <SettingsRow
            icon="✏️"
            iconBg="bg-[#EEF6F0]"
            label="Nom du foyer"
            sub={settings.nomFoyer}
            onClick={handleNom}
          />
        </div>
      </div>

      {/* Section Inviter */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-2 mb-2.5 pl-1">
          <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-muted">Foyer partagé</p>
          <span
            title={syncStatus === 'synced' ? 'Syncé' : syncStatus === 'error' ? 'Erreur de sync' : 'Connexion...'}
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              syncStatus === 'synced' ? 'bg-green-500' :
              syncStatus === 'error'  ? 'bg-red-500' :
              'bg-yellow-400 animate-pulse'
            }`}
          />
        </div>
        <InviteCard />
      </div>

      {/* Section Données */}
      <div className="px-5 mb-5">
        <p className="text-xs font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Données</p>
        <div className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden">
          <SettingsRow
            icon="🗑️"
            iconBg="bg-[#FDE8F0]"
            label="Effacer la semaine"
            sub="Remet tous les repas à zéro"
            onClick={handleClearWeek}
            danger
          />
          <SettingsRow
            icon="🔄"
            iconBg="bg-[#FDE8F0]"
            label="Réinitialiser les recettes"
            sub="Supprime vos recettes personnalisées"
            onClick={handleResetRecipes}
            danger
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pt-4 text-center">
        <p className="text-xs font-semibold text-muted">MealMate v1.0 — Fait avec ❤️</p>
        <p className="text-xs font-semibold text-muted mt-1">{settings.nomFoyer}</p>
      </div>
    </div>
  )
}
