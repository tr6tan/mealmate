import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getInviteUrl } from '@/lib/foyer'
import { showToast } from '@/components/ui/Toast'

interface InviteCardProps {
  onlineCount: number
}

export default function InviteCard({ onlineCount }: InviteCardProps) {
  const url = getInviteUrl()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    showToast('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card rounded-2xl border-[1.5px] border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-extrabold tracking-[0.08em] uppercase text-muted">
          Rejoindre ce foyer
        </p>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
          onlineCount > 0 ? 'bg-[#E8F5E9]' : 'bg-sep'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            onlineCount > 0 ? 'bg-[#4CAF50] animate-pulse' : 'bg-muted'
          }`} />
          <span className={`text-[10px] font-extrabold ${
            onlineCount > 0 ? 'text-[#2E7D32]' : 'text-muted'
          }`}>
            {onlineCount > 0 ? 'Partenaire connecté' : 'Seul sur ce foyer'}
          </span>
        </div>
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-card border border-sep">
          <QRCodeSVG
            value={url}
            size={160}
            fgColor="#2D2A26"
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
        <p className="text-xs text-muted font-semibold text-center max-w-[220px] leading-snug">
          Scanne ce QR code pour rejoindre et modifier le planning ensemble
        </p>
      </div>

      {/* Lien */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2.5 bg-sep rounded-xl border border-border overflow-hidden">
          <p className="text-[11px] font-bold text-muted truncate">{url}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 px-3.5 py-2.5 bg-terra text-white text-xs font-extrabold rounded-xl active:scale-95 transition-transform shadow-terra-sm"
        >
          {copied ? '✓ Copié' : 'Copier'}
        </button>
      </div>
    </div>
  )
}
