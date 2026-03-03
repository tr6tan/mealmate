import { useEffect, useState } from 'react'

/**
 * Splash screen : ripple terra depuis le centre, remplit l'ecran, s'efface.
 * Pas de texte, pas d'icone. Duree totale ~1.2s.
 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  // 0 = init  1 = expand  2 = fade-out
  const [stage, setStage] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const t0 = setTimeout(() => setStage(1), 40)    // demarre l'expansion
    const t1 = setTimeout(() => setStage(2), 720)   // demarre le fade-out
    const t2 = setTimeout(() => onDone(), 1080)     // demonte
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        9999,
        overflow:      'hidden',
        background:    '#D23D2D',
        opacity:       stage === 2 ? 0 : 1,
        transition:    stage === 2 ? 'opacity 340ms ease-in' : 'none',
        pointerEvents: stage === 2 ? 'none' : 'auto',
      }}
    >
      {/* Cercle ripple — 200vmax couvre toujours l'ecran complet */}
      <div
        style={{
          position:     'absolute',
          left:         '50%',
          top:          '50%',
          width:        '200vmax',
          height:       '200vmax',
          borderRadius: '50%',
          background:   '#D23D2D',
          transform:    stage === 1
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0)',
          transition:   stage === 1
            ? 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none',
          willChange:   'transform',
        }}
      />
    </div>
  )
}
