import { useEffect, useRef } from 'react'
import { lireDuree } from '@/lib/dureeEtape'

/**
 * Saisie de la préparation.
 *
 * La version précédente offrait le minimum : une zone de deux lignes fixes par
 * étape et une croix pour l'effacer. Quatre manques se payaient à chaque
 * recette un peu longue :
 *
 *  — le texte au-delà de deux lignes défilait dans un champ de 40px, donc on
 *    ne relisait jamais l'étape en entier ;
 *  — aucun moyen de réordonner : une étape oubliée au milieu obligeait à
 *    retaper tout ce qui suivait ;
 *  — aucun moyen d'insérer, pour la même raison ;
 *  — la durée écrite dans l'étape n'était pas relevée, alors que le mode
 *    cuisine sait la lire et proposer un minuteur. On la montre donc pendant
 *    la saisie : ce qui est reconnu ici sera proposé là-bas.
 */

interface Props {
  steps: string[]
  onChange: (steps: string[]) => void
}

export default function StepsEditor({ steps, onChange }: Props) {
  const maj = (idx: number, valeur: string) =>
    onChange(steps.map((s, i) => (i === idx ? valeur : s)))

  const retirer = (idx: number) => {
    // Toujours garder une ligne : un formulaire sans champ n'invite à rien.
    const suivant = steps.filter((_, i) => i !== idx)
    onChange(suivant.length ? suivant : [''])
  }

  const deplacer = (idx: number, sens: -1 | 1) => {
    const cible = idx + sens
    if (cible < 0 || cible >= steps.length) return
    const suivant = [...steps]
    ;[suivant[idx], suivant[cible]] = [suivant[cible], suivant[idx]]
    onChange(suivant)
  }

  const insererApres = (idx: number) => {
    const suivant = [...steps]
    suivant.splice(idx + 1, 0, '')
    onChange(suivant)
  }

  return (
    <div>
      <ol>
        {steps.map((step, idx) => (
          <Etape
            key={idx}
            numero={idx + 1}
            valeur={step}
            premiere={idx === 0}
            derniere={idx === steps.length - 1}
            seule={steps.length === 1}
            onChange={(v) => maj(idx, v)}
            onRetirer={() => retirer(idx)}
            onMonter={() => deplacer(idx, -1)}
            onDescendre={() => deplacer(idx, 1)}
            onInserer={() => insererApres(idx)}
          />
        ))}
      </ol>

      <button
        type="button"
        onClick={() => onChange([...steps, ''])}
        className="w-full mt-2 h-12 rounded-2xl bg-black/[0.045] text-[14px] font-semibold text-text2 active:scale-[0.98] transition-transform"
      >
        + Ajouter une étape
      </button>
    </div>
  )
}

interface EtapeProps {
  numero: number
  valeur: string
  premiere: boolean
  derniere: boolean
  seule: boolean
  onChange: (v: string) => void
  onRetirer: () => void
  onMonter: () => void
  onDescendre: () => void
  onInserer: () => void
}

function Etape({
  numero, valeur, premiere, derniere, seule,
  onChange, onRetirer, onMonter, onDescendre, onInserer,
}: EtapeProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /*
   * Hauteur suivie sur le contenu. `rows` fixe coupait le texte : on relisait
   * une étape de cinq lignes par une fenêtre de deux, en faisant défiler un
   * champ à l'intérieur d'une page qui défile déjà.
   */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [valeur])

  const duree = lireDuree(valeur)

  return (
    <li className="relative pl-8 pb-3">
      {/* Même repère que sur la fiche : un grand chiffre pâle, pas de
          pastille colorée. */}
      <span
        className="absolute left-0 top-[0.1em] text-[19px] font-extrabold tabular-nums w-6 text-right"
        style={{ color: 'rgb(var(--c-terra) / 0.3)' }}
        aria-hidden
      >
        {numero}
      </span>

      <textarea
        ref={ref}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={premiere ? 'Préchauffer le four à 180°C…' : 'Et ensuite…'}
        rows={1}
        aria-label={`Étape ${numero}`}
        className="w-full bg-transparent border-b border-sep focus:border-terra outline-none resize-none overflow-hidden text-[15px] text-text1 placeholder:text-muted leading-[1.55] pb-1.5 transition-colors"
      />

      <div className="flex items-center gap-1 mt-1">
        {/* La durée reconnue, montrée pendant la saisie : c'est celle que le
            mode cuisine proposera en minuteur. */}
        {duree && (
          <span className="text-[12px] font-semibold text-sage mr-auto whitespace-nowrap">
            Minuteur {duree.libelle}
          </span>
        )}
        {!duree && <span className="mr-auto" />}

        <Bouton label={`Monter l'étape ${numero}`} disabled={premiere} onClick={onMonter}>
          <path d="M6 15l6-6 6 6" />
        </Bouton>
        <Bouton label={`Descendre l'étape ${numero}`} disabled={derniere} onClick={onDescendre}>
          <path d="M6 9l6 6 6-6" />
        </Bouton>
        <Bouton label={`Insérer une étape après la ${numero}`} onClick={onInserer}>
          <path d="M12 5v14M5 12h14" />
        </Bouton>
        <Bouton label={`Supprimer l'étape ${numero}`} disabled={seule && !valeur} onClick={onRetirer}>
          <path d="M18 6L6 18M6 6l12 12" />
        </Bouton>
      </div>
    </li>
  )
}

function Bouton({
  label, onClick, disabled, children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-11 h-11 flex items-center justify-center text-text2 disabled:opacity-25 active:scale-90 transition-transform"
    >
      <svg
        className="w-[17px] h-[17px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}
