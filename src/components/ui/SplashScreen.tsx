import { useEffect, useState } from 'react'

/** Durées de l'animation (ms) */
const T_SHOW   = 60    // délai avant d'afficher le contenu
const T_FADEOUT = 1700  // début du fade-out
const T_DONE   = 2100  // appel onDone

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  // 0 = caché  1 = visible (animations in)  2 = fade-out

  useEffect(() => {
    document.documentElement.style.backgroundColor = '#D23D2D'
    const t0 = setTimeout(() => setStage(1), T_SHOW)
    const t1 = setTimeout(() => {
      setStage(2)
      document.documentElement.style.backgroundColor = ''
    }, T_FADEOUT)
    const t2 = setTimeout(() => onDone(), T_DONE)
    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2)
      document.documentElement.style.backgroundColor = ''
    }
  }, [onDone])

  const visible = stage === 1

  return (
    <div style={{
      position:      'fixed',
      inset:         0,
      zIndex:        9999,
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      justifyContent:'center',
      background:    '#D23D2D',
      opacity:       stage === 2 ? 0 : 1,
      transition:    stage === 2 ? 'opacity 400ms cubic-bezier(0.4,0,1,1)' : 'none',
      pointerEvents: stage === 2 ? 'none' : 'auto',
    }}>

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div style={{
        transform:  visible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(24px)',
        opacity:    visible ? 1 : 0,
        transition: visible
          ? 'transform 700ms cubic-bezier(0.34,1.56,0.64,1), opacity 500ms ease-out'
          : 'none',
        willChange: 'transform, opacity',
        marginBottom: 28,
      }}>
        {/* Sandwich SVG — même style que le favicon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
             width="120" height="120">
          <g stroke="#F8EECB" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 122,212 L 120,178 C 120,158 186,140 256,138 C 326,140 392,158 392,178
                     L 390,212 C 368,228 340,238 310,230 C 290,224 272,234 256,234
                     C 240,234 222,224 202,230 C 172,238 144,228 122,212 Z"
                  strokeWidth="22" fill="#D23D2D"/>
            <path d="M 80,300 L 90,248 L 134,272 Z"
                  strokeWidth="19" fill="#D23D2D"/>
            <path d="M 432,292 L 422,240 L 378,264 Z"
                  strokeWidth="19" fill="#D23D2D"/>
            <path d="M 90,252 C 114,280 138,296 168,278 C 196,262 222,278 256,278
                     C 290,278 316,262 344,278 C 374,296 398,280 422,244"
                  strokeWidth="19" fill="none"/>
            <path d="M 80,312 C 108,338 140,354 174,336 C 202,320 226,336 256,336
                     C 286,336 310,320 338,336 C 372,354 404,338 432,308"
                  strokeWidth="19" fill="none"/>
            <path d="M 78,364 C 106,386 148,400 200,394 C 226,390 244,380 256,380
                     C 268,380 286,390 312,394 C 364,400 406,386 434,364
                     L 432,402 C 432,422 346,438 256,438
                     C 166,438 80,422 80,402 Z"
                  strokeWidth="22" fill="#D23D2D"/>
          </g>
        </svg>
      </div>

      {/* ── Nom de l'app ──────────────────────────────────────────────── */}
      <div style={{
        transform:  visible ? 'translateY(0)' : 'translateY(20px)',
        opacity:    visible ? 1 : 0,
        transition: visible
          ? 'transform 600ms 200ms cubic-bezier(0.22,1,0.36,1), opacity 500ms 200ms ease-out'
          : 'none',
        color:       '#F8EECB',
        fontSize:    36,
        fontWeight:  900,
        fontFamily:  'Nunito, sans-serif',
        letterSpacing: '-0.5px',
        lineHeight:  1,
      }}>
        MealMate
      </div>

      {/* ── Version ───────────────────────────────────────────────────── */}
      <div style={{
        transform:  visible ? 'translateY(0)' : 'translateY(12px)',
        opacity:    visible ? 0.55 : 0,
        transition: visible
          ? 'transform 500ms 400ms cubic-bezier(0.22,1,0.36,1), opacity 400ms 400ms ease-out'
          : 'none',
        color:       '#F8EECB',
        fontSize:    13,
        fontWeight:  700,
        fontFamily:  'Nunito, sans-serif',
        marginTop:   10,
        letterSpacing: '0.5px',
      }}>
        v{__APP_VERSION__}
      </div>

    </div>
  )
}
