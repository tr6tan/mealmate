import { useEffect, useState } from 'react'

/**
 * Splash screen minimaliste premium.
 * Fond = couleur bg de l'app -> sortie totalement seamless.
 * Animation principale : trace SVG (stroke-dashoffset) + fade-in du wordmark.
 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  // 0 = invisible  1 = anime  2 = sortie

  useEffect(() => {
    const t0 = setTimeout(() => setStage(1), 50)   // demarrer l'animation
    const t1 = setTimeout(() => setStage(2), 1800)  // commencer la sortie
    const t2 = setTimeout(() => onDone(), 2150)      // demonter
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes draw {
          from { stroke-dashoffset: 314; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes draw-detail {
          from { stroke-dashoffset: 80; }
          to   { stroke-dashoffset: 0;  }
        }
        .splash-circle {
          stroke-dasharray: 314;
          stroke-dashoffset: 314;
          animation: draw 0.85s cubic-bezier(0.4,0,0.2,1) 0.05s forwards;
        }
        .splash-fork {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: draw-detail 0.5s cubic-bezier(0.4,0,0.2,1) 0.65s forwards;
        }
        .splash-knife {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: draw-detail 0.5s cubic-bezier(0.4,0,0.2,1) 0.85s forwards;
        }
      `}</style>

      <div
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        9999,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          justifyContent:'center',
          background:    '#FAFAF7',
          opacity:       stage === 2 ? 0 : stage === 1 ? 1 : 0,
          transition:    stage === 2
            ? 'opacity 320ms ease-in'
            : 'opacity 200ms ease-out',
          pointerEvents: stage === 2 ? 'none' : 'auto',
        }}
      >
        {/* Icone SVG */}
        <div
          style={{
            opacity:   stage === 1 ? 1 : 0,
            transform: stage === 1 ? 'translateY(0)' : 'translateY(8px)',
            transition:'opacity 300ms ease-out, transform 300ms ease-out',
          }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cercle */}
            <circle
              className="splash-circle"
              cx="36" cy="36" r="30"
              stroke="#E07B54"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Fourchette */}
            <path
              className="splash-fork"
              d="M28 23 L28 30 M25 23 L25 28 M31 23 L31 28 M27.5 30 L27.5 49"
              stroke="#E07B54"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Couteau */}
            <path
              className="splash-knife"
              d="M44 23 C44 23 47 26 47 30 C47 34 44 35.5 44 35.5 L44 49"
              stroke="#E07B54"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            marginTop:  18,
            opacity:    stage === 1 ? 1 : 0,
            transform:  stage === 1 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 500ms ease-out 700ms, transform 500ms ease-out 700ms',
          }}
        >
          <span
            style={{
              fontFamily:    'system-ui, -apple-system, sans-serif',
              fontSize:      '1.45rem',
              fontWeight:    700,
              letterSpacing: '-0.03em',
              color:         '#1C1C1E',
            }}
          >
            Meal<span style={{ color: '#E07B54' }}>Mate</span>
          </span>
        </div>
      </div>
    </>
  )
}
