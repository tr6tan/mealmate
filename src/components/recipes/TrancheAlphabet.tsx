import { useCallback, useRef, useState } from 'react'
import { LETTRES } from '@/lib/initiale'

/**
 * Index alphabétique, en bord d'écran.
 *
 * Chercher une recette dans une liste de cent demandait de défiler longtemps
 * ou de connaître son nom d'avance :
 *
 *, un appui ouvre à la lettre ;
 *, un glissement du pouce fait défiler l'index en continu, avec la lettre
 *    survolée affichée en grand au centre, comme le répertoire d'un
 *    téléphone ;
 *, les lettres sans recette restent visibles mais pâles : leur absence est
 *    une information, et les retirer ferait sauter l'alignement de l'index à
 *    chaque changement de filtre.
 *
 * Le suivi passe par un `pointermove` unique plutôt que par 27 gestionnaires :
 * au pouce on glisse entre deux lettres bien plus souvent qu'on ne reste sur
 * une seule.
 */

interface Props {
  /** Lettres qui portent au moins une recette. */
  presentes: Set<string>
  /** Lettre de la section en cours de lecture. */
  courante: string | null
  onChoisir: (lettre: string) => void
}

export default function TrancheAlphabet({ presentes, courante, onChoisir }: Props) {
  const conteneur = useRef<HTMLDivElement>(null)
  const [glissee, setGlissee] = useState<string | null>(null)
  const derniere = useRef<string | null>(null)
  const enCours = useRef(false)

  /** Lettre sous le doigt, d'après sa position verticale. */
  const lettreSous = (clientY: number): string | null => {
    const el = conteneur.current
    if (!el) return null
    const boite = el.getBoundingClientRect()
    const ratio = (clientY - boite.top) / boite.height
    const idx = Math.floor(ratio * LETTRES.length)
    return LETTRES[Math.min(LETTRES.length - 1, Math.max(0, idx))] ?? null
  }

  /**
   * Lettre présente la plus proche d'un indice donné.
   *
   * Les lettres sans recette restent affichées pour que la tranche garde le
   * même alignement d'un filtre à l'autre, mais glisser dessus ne faisait
   * rien : sur ces cent recettes, dix lettres sont vides et le quart bas de
   * la tranche semblait mort sous le pouce. On accroche donc à la voisine.
   */
  const plusProchePresente = (idx: number): string | null => {
    for (let d = 0; d < LETTRES.length; d++) {
      const avant = LETTRES[idx - d]
      if (avant && presentes.has(avant)) return avant
      const apres = LETTRES[idx + d]
      if (apres && presentes.has(apres)) return apres
    }
    return null
  }

  const viser = (clientY: number) => {
    const brute = lettreSous(clientY)
    if (!brute) return
    const lettre = presentes.has(brute)
      ? brute
      : plusProchePresente(LETTRES.indexOf(brute))
    if (!lettre) return
    setGlissee(lettre)
    // Ne prévenir qu'au changement : sinon un glissement lent relance le
    // défilement à chaque pixel et l'index tremble.
    if (derniere.current !== lettre) {
      derniere.current = lettre
      onChoisir(lettre)
    }
  }

  const relacher = useCallback(() => {
    enCours.current = false
    setGlissee(null)
    derniere.current = null
  }, [])

  /*
   * Le suivi du doigt passe par la fenêtre, pas par la tranche.
   *
   * `setPointerCapture` semblait suffire, mais il échoue selon les
   * plateformes, et `hasPointerCapture` renvoyait alors faux : le glissement
   * ne faisait rien du tout, seuls les appuis répondaient. Des écouteurs
   * posés sur la fenêtre pendant le geste fonctionnent partout, et laissent
   * le doigt dériver hors de la tranche, ce qui arrive constamment sur une
   * bande de 24px de large.
   */
  const commencer = (clientY: number) => {
    enCours.current = true
    viser(clientY)

    const surMouvement = (e: PointerEvent) => {
      if (!enCours.current) return
      e.preventDefault()
      viser(e.clientY)
    }
    const surFin = () => {
      relacher()
      window.removeEventListener('pointermove', surMouvement)
      window.removeEventListener('pointerup', surFin)
      window.removeEventListener('pointercancel', surFin)
    }

    window.addEventListener('pointermove', surMouvement, { passive: false })
    window.addEventListener('pointerup', surFin)
    window.addEventListener('pointercancel', surFin)
  }

  return (
    <>
      {/* La lettre visée, en pastille : au pouce, l'index est masqué par la
          main. Assez petite pour ne pas couvrir la liste qu'on parcourt. */}
      {glissee && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
          aria-hidden
        >
          <span className="w-[76px] h-[76px] rounded-3xl bg-terra text-white text-[34px] font-bold tracking-[-0.02em] flex items-center justify-center shadow-lg">
            {glissee}
          </span>
        </div>
      )}

      <div
        ref={conteneur}
        role="group"
        aria-label="Index alphabétique"
        onPointerDown={(e) => commencer(e.clientY)}
        className="flex flex-col items-center justify-center select-none touch-none py-1"
      >
        {LETTRES.map((lettre) => {
          const active = presentes.has(lettre)
          const marquee = glissee === lettre || (!glissee && courante === lettre)
          return (
            <button
              key={lettre}
              type="button"
              // Le geste est porté par le conteneur ; le bouton sert au clavier
              // et aux lecteurs d'écran, où glisser n'a pas de sens.
              onClick={() => active && onChoisir(lettre)}
              disabled={!active}
              aria-label={`Ouvrir à la lettre ${lettre === '#' ? 'autres' : lettre}`}
              aria-current={marquee ? 'true' : undefined}
              tabIndex={active ? 0 : -1}
              className={
                'w-6 h-[18px] flex items-center justify-center text-[10.5px] font-bold leading-none tabular-nums transition-colors ' +
                (marquee
                  ? 'text-accent'
                  : active
                    ? 'text-muted'
                    : 'text-muted/30')
              }
            >
              {lettre}
            </button>
          )
        })}
      </div>
    </>
  )
}
