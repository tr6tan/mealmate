import { useEffect, useRef, useState } from 'react'
import { cn, haptic } from '@/lib/utils'
import { ETAPES, marquerAccueilVu } from './etapes'
import Dessin from './Dessin'

/**
 * Accueil au premier lancement.
 *
 * Plein écran et non une feuille : c'est le premier contact, il ne doit pas
 * laisser croire qu'on peut le contourner par mégarde en touchant à côté.
 * Mais il reste passable en un appui, parce qu'un accueil dont on ne peut pas
 * sortir est une porte fermée.
 *
 * Se balaye au doigt, s'avance au bouton, et se rouvre depuis les réglages :
 * personne ne retient quatre écrans vus une fois.
 */

interface Props {
  /** Appelé à la fermeture, quelle qu'en soit la façon. */
  onFermer: () => void
  /** Ouvert depuis les réglages : on ne réécrit pas le marqueur, déja posé. */
  relecture?: boolean
}

export default function Onboarding({ onFermer, relecture }: Props) {
  const [i, setI] = useState(0)
  const depart = useRef<number | null>(null)
  const derniere = ETAPES.length - 1

  const fermer = () => {
    if (!relecture) marquerAccueilVu()
    onFermer()
  }

  const avancer = () => {
    if (i < derniere) {
      haptic(8)
      setI(i + 1)
    } else {
      fermer()
    }
  }

  const reculer = () => i > 0 && setI(i - 1)

  // Les flèches du clavier pour qui n'a pas d'écran tactile.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') avancer()
      if (e.key === 'ArrowLeft') reculer()
      if (e.key === 'Escape') fermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const etape = ETAPES[i]

  return (
    <div
      className="fixed inset-0 z-[60] bg-bg flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue dans MealMate"
      onTouchStart={(e) => { depart.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (depart.current === null) return
        const ecart = e.changedTouches[0].clientX - depart.current
        depart.current = null
        // 50px : en dessous, c'est un appui qui a glissé, pas un balayage.
        if (ecart < -50) avancer()
        else if (ecart > 50) reculer()
      }}
    >
      <div className="flex-shrink-0 pt-safe" />

      {/* Passer, en haut à droite : visible sans être la première chose lue. */}
      <div className="flex justify-end px-4 pt-2">
        <button
          onClick={fermer}
          className="min-h-[44px] px-3 text-[14px] font-semibold text-muted active:opacity-60 transition-opacity"
        >
          {relecture ? 'Fermer' : 'Passer'}
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-center px-7 pb-4">
        <Dessin nom={etape.dessin} />

        <h1 className="mt-9 text-[27px] font-extrabold text-text1 tracking-[-0.03em] leading-tight">
          {etape.titre}
        </h1>
        <p className="mt-3 text-[16px] text-text2 leading-relaxed">{etape.texte}</p>
      </div>

      <div className="flex-shrink-0 px-7 pb-safe">
        {/* Les points : où on en est, et combien il reste. */}
        <div className="flex justify-center gap-2 mb-6" role="group" aria-label="Progression">
          {ETAPES.map((_, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              aria-label={`Écran ${n + 1} sur ${ETAPES.length}`}
              aria-current={n === i ? 'step' : undefined}
              className="h-11 flex items-center"
            >
              <span
                className={cn(
                  'block rounded-full transition-all',
                  n === i ? 'w-6 h-2 bg-terra' : 'w-2 h-2 bg-text2/25',
                )}
              />
            </button>
          ))}
        </div>

        <button onClick={avancer} className="btn-primary w-full min-h-[52px] mb-4">
          {i < derniere ? 'Suivant' : 'C’est parti'}
        </button>
      </div>
    </div>
  )
}
