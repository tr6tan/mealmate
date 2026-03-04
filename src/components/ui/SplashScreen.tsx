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
        {/* Bowl outline SVG — même style que le favicon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
             width="120" height="120">
          <path d="M 88,294 Q 82,448 256,456 Q 430,448 424,294"
                fill="none" stroke="#F8EECB" strokeWidth="22"
                strokeLinecap="round" strokeLinejoin="round"/>
          <ellipse cx="256" cy="294" rx="168" ry="26"
                   fill="#D23D2D" stroke="#F8EECB" strokeWidth="22"/>
          <path d="M 208,358 Q 204,308 256,304 Q 308,308 304,358 Z"
                fill="none" stroke="#F8EECB" strokeWidth="16" strokeLinejoin="round"/>
          <path d="M 240,356 L 240,388 Q 240,398 256,398 Q 272,398 272,388 L 272,356"
                fill="none" stroke="#F8EECB" strokeWidth="16"
                strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="164" cy="382" r="18" fill="none" stroke="#F8EECB" strokeWidth="14"/>
          <circle cx="348" cy="374" r="15" fill="none" stroke="#F8EECB" strokeWidth="14"/>
          <path d="M 145,342 Q 172,318 195,342"
                fill="none" stroke="#F8EECB" strokeWidth="13" strokeLinecap="round"/>
          <path d="M 174,292 C 168,240 158,200 140,162"
                fill="none" stroke="#F8EECB" strokeWidth="16" strokeLinecap="round"/>
          <path d="M 161,218 C 130,205 110,178 112,150 C 138,158 158,182 161,218 Z"
                fill="none" stroke="#F8EECB" strokeWidth="13" strokeLinejoin="round"/>
          <path d="M 220,290 C 218,230 222,180 228,138"
                fill="none" stroke="#F8EECB" strokeWidth="16" strokeLinecap="round"/>
          <path d="M 220,202 C 192,188 178,162 184,136 C 208,148 222,174 220,202 Z"
                fill="none" stroke="#F8EECB" strokeWidth="13" strokeLinejoin="round"/>
          <path d="M 300,290 C 308,240 318,190 322,148"
                fill="none" stroke="#F8EECB" strokeWidth="16" strokeLinecap="round"/>
          <path d="M 322,148 C 316,132 310,124 322,114 C 334,124 328,132 322,148"
                fill="none" stroke="#F8EECB" strokeWidth="13" strokeLinejoin="round"/>
          <path d="M 338,292 C 350,256 362,222 368,190"
                fill="none" stroke="#F8EECB" strokeWidth="14" strokeLinecap="round"/>
          <path d="M 364,210 C 382,196 396,196 398,178 C 378,174 362,186 364,210 Z"
                fill="none" stroke="#F8EECB" strokeWidth="12" strokeLinejoin="round"/>
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
