import { useState } from 'react'
import { useAppStore, selectCurrentWeekPlan } from '@/store/useAppStore'
import { showToast } from '@/components/ui/Toast'
import InviteCard from './InviteCard'

// ─── Mini modal d'édition (remplace window.prompt) ───────────────────────────
interface EditModalProps {
  label: string
  value: string
  type: 'text' | 'number'
  onSave: (v: string) => void
  onClose: () => void
}
function EditModal({ label, value, type, onSave, onClose }: EditModalProps) {
  const [val, setVal] = useState(value)
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative w-full bg-card rounded-t-3xl px-5 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-sep rounded-full mx-auto mb-5" />
        <p className="text-[13px] font-extrabold text-muted uppercase tracking-widest mb-3">{label}</p>
        <input
          autoFocus
          type={type}
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full px-4 py-3.5 rounded-xl bg-sep border-[1.5px] border-border text-[15px] font-bold text-text1 outline-none focus:border-terra transition-colors"
          onKeyDown={e => { if (e.key === 'Enter') onSave(val) }}
        />
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-sep text-text2 text-sm font-extrabold active:scale-[0.97] transition-transform"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(val)}
            className="flex-1 py-3.5 rounded-xl bg-terra text-white text-sm font-extrabold shadow-terra-sm active:scale-[0.97] transition-transform"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ligne de réglage ─────────────────────────────────────────────────────────
interface SettingsRowProps {
  icon: string
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
type EditField = 'nom' | 'personnes' | null
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

  const [editField, setEditField]     = useState<EditField>(null)
  const [dangerField, setDangerField] = useState<DangerField>(null)

  // Comptage repas semaine courante
  const mealsCount = Object.values(weekPlan).reduce((acc, day) => {
    return acc + (['pdej', 'midi', 'soir'] as const).filter(s => !!day[s]).length
  }, 0)

  // Sync badge
  const syncLabel = syncStatus === 'synced' ? 'Synchronisé' : syncStatus === 'error' ? 'Hors ligne' : 'Connexion…'
  const syncBg    = syncStatus === 'synced' ? 'bg-[#E8F5E9] text-[#2E7D32]' : syncStatus === 'error' ? 'bg-[#FDE8F0] text-[#C0304A]' : 'bg-[#FFFDE7] text-[#F57F17]'
  const syncDot   = syncStatus === 'synced' ? 'bg-[#4CAF50]' : syncStatus === 'error' ? 'bg-[#C0304A]' : 'bg-[#FFC107] animate-pulse'

  // Handlers édition
  const handleSaveNom = (v: string) => {
    const trimmed = v.trim()
    if (trimmed) { updateSettings({ nomFoyer: trimmed }); showToast('Nom mis à jour !') }
    setEditField(null)
  }
  const handleSavePersonnes = (v: string) => {
    const n = parseInt(v)
    if (!isNaN(n) && n > 0 && n <= 20) { updateSettings({ personnes: n }); showToast('Mis à jour !') }
    setEditField(null)
  }

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

  // Initiales foyer (1 ou 2 premières lettres des mots)
  const initials = settings.nomFoyer
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="pb-8">

      {/* ── Hero foyer ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="bg-card rounded-2xl border-[1.5px] border-border p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-terra flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-white tracking-tight">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-black text-text1 truncate">{settings.nomFoyer}</h2>
            <p className="text-[12px] text-muted font-semibold mt-0.5">
              {settings.personnes} personne{settings.personnes > 1 ? 's' : ''}
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
            icon="🏠"
            iconBg="bg-[#FFF3EE]"
            label="Nom du foyer"
            value={settings.nomFoyer}
            onClick={() => setEditField('nom')}
          />
          <SettingsRow
            icon="👥"
            iconBg="bg-[#EEF6F0]"
            label="Nombre de personnes"
            value={`${settings.personnes} pers.`}
            onClick={() => setEditField('personnes')}
          />
        </div>
      </div>

      {/* ── Foyer partagé ── */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Foyer partagé</p>
        <InviteCard />
      </div>

      {/* ── Données ── */}
      <div className="px-5 mb-5">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2.5 pl-1">Données</p>
        <div className="bg-card rounded-xl border-[1.5px] border-border overflow-hidden">
          <SettingsRow
            icon="🗑️"
            iconBg="bg-[#FDE8F0]"
            label="Effacer la semaine"
            sub="Remet tous les repas à zéro"
            onClick={() => handleDanger('week')}
            danger
            confirming={dangerField === 'week'}
            confirmLabel="Appuyer à nouveau pour confirmer"
          />
          <SettingsRow
            icon="🔄"
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
      <div className="px-5 text-center mt-2">
        <p className="text-[11px] font-semibold text-muted">MealMate v1.0 · Fait avec ❤️</p>
      </div>

      {/* ── EditModal ── */}
      {editField === 'nom' && (
        <EditModal
          label="Nom du foyer"
          value={settings.nomFoyer}
          type="text"
          onSave={handleSaveNom}
          onClose={() => setEditField(null)}
        />
      )}
      {editField === 'personnes' && (
        <EditModal
          label="Nombre de personnes"
          value={String(settings.personnes)}
          type="number"
          onSave={handleSavePersonnes}
          onClose={() => setEditField(null)}
        />
      )}
    </div>
  )
}
