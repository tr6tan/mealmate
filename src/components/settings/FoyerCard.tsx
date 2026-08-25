import { useState } from 'react'
import InviteCard from './InviteCard'
import { createFoyer, getFoyerId, isLegacyFoyer } from '@/lib/foyer'
import { useFoyerPresence } from '@/hooks/useFoyerPresence'
import { showToast } from '@/lib/toast'

/**
 * Carte « Foyer » : identité du foyer courant, lien d'invitation, et sortie
 * du foyer partagé par défaut.
 *
 * Le foyer historique est commun à toute personne qui ouvre l'app sans lien
 * d'invitation : ses données ne sont donc privées pour personne. On le signale
 * et on propose d'en créer un à soi.
 */
export default function FoyerCard() {
  const onlineCount = useFoyerPresence()
  const [confirming, setConfirming] = useState(false)
  const legacy = isLegacyFoyer()
  const foyerId = getFoyerId()

  const handleCreate = () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    createFoyer()
    showToast('Nouveau foyer créé, rechargement…')
    setTimeout(() => window.location.reload(), 900)
  }

  return (
    <div className="flex flex-col gap-4">
      <InviteCard onlineCount={onlineCount} />

      <div className="bg-card rounded-2xl border-[1.5px] border-border p-4">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted mb-2">
          Foyer
        </p>
        <p className="text-[11px] font-bold text-muted font-mono truncate mb-3">{foyerId}</p>

        {legacy && (
          <p className="text-xs text-text2 leading-snug mb-3">
            Ce foyer est celui par défaut : toute personne ouvrant l’app sans lien
            d’invitation y accède. Crée le tien pour que tes données restent privées.
          </p>
        )}

        <button
          onClick={handleCreate}
          className={`w-full px-3.5 py-2.5 text-xs font-extrabold rounded-xl active:scale-95 transition-transform ${
            confirming ? 'bg-danger text-white' : 'bg-bg text-text2 border border-border'
          }`}
        >
          {confirming ? 'Confirmer : repartir de zéro' : 'Créer un foyer privé'}
        </button>

        {confirming && (
          <p className="text-[11px] text-muted leading-snug mt-2">
            Le nouveau foyer démarre vide, avec les recettes par défaut. L’ancien
            reste accessible via son lien d’invitation.
          </p>
        )}
      </div>
    </div>
  )
}
