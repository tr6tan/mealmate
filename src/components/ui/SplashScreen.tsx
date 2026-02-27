import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'show' | 'out'>('in')

  useEffect(() => {
    // Légère pause pour forcer le reflow avant la transition d'entrée
    const t1 = setTimeout(() => setPhase('show'), 60)
    // Début du fade-out après 2s
    const t2 = setTimeout(() => setPhase('out'), 2000)
    // Démontage après la fin de la sortie
    const t3 = setTimeout(() => onDone(), 2550)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  const isShow = phase === 'show'
  const isOut = phase === 'out'

  return (
    <>
      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.25; }
          50%       { transform: scale(1.12); opacity: 0.35; }
        }
        @keyframes splash-pulse2 {
          0%, 100% { transform: scale(1);   opacity: 0.18; }
          50%       { transform: scale(1.08); opacity: 0.28; }
        }
        @keyframes bounce-logo {
          0%, 100% { transform: translateY(0px) scale(1);    }
          40%       { transform: translateY(-10px) scale(1.06); }
          60%       { transform: translateY(-6px) scale(1.03);  }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.5; }
          40%            { transform: translateY(-6px); opacity: 1;   }
        }
      `}</style>

      {/* Conteneur principal */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #E07B54 0%, #C4623C 55%, #9B5EA0 100%)',
          opacity:    isOut ? 0 : isShow ? 1 : 0,
          transform:  isOut ? 'scale(1.06)' : isShow ? 'scale(1)' : 'scale(0.94)',
          transition: isOut
            ? 'opacity 480ms ease-in, transform 480ms ease-in'
            : 'opacity 600ms ease-out, transform 600ms ease-out',
        }}
      >
        {/* Blob décoratif haut-gauche */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.12)',
            animation: 'splash-pulse 3.5s ease-in-out infinite',
          }}
        />
        {/* Blob décoratif bas-droite */}
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.10)',
            animation: 'splash-pulse2 4s ease-in-out infinite 0.8s',
          }}
        />
        {/* Cercle subtil au centre-haut */}
        <div
          className="absolute top-10 right-10 w-32 h-32 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />

        {/* Contenu central */}
        <div
          className="flex flex-col items-center gap-3 relative z-10"
          style={{
            opacity:   isShow ? 1 : 0,
            transform: isShow ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 700ms ease-out 100ms, transform 700ms ease-out 100ms',
          }}
        >
          {/* Emoji animé */}
          <div
            style={{
              fontSize: '5rem',
              lineHeight: 1,
              animation: isShow ? 'bounce-logo 1.8s ease-in-out infinite' : 'none',
            }}
          >
            🍽️
          </div>

          {/* Nom de l'app */}
          <div
            style={{
              opacity:   isShow ? 1 : 0,
              transform: isShow ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 600ms ease-out 350ms, transform 600ms ease-out 350ms',
            }}
          >
            <h1
              className="text-white font-bold text-center"
              style={{
                fontSize: '2.6rem',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 16px rgba(0,0,0,0.15)',
              }}
            >
              MealMate
            </h1>
          </div>

          {/* Tagline */}
          <div
            style={{
              opacity:   isShow ? 1 : 0,
              transform: isShow ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 600ms ease-out 550ms, transform 600ms ease-out 550ms',
            }}
          >
            <p
              className="text-white/70 text-center"
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Plan · Cuisiner · Savourer
            </p>
          </div>
        </div>

        {/* Loader dots — apparaît en dernier */}
        <div
          className="absolute bottom-14 flex gap-2"
          style={{
            opacity:   isShow ? 1 : 0,
            transition: 'opacity 400ms ease-out 900ms',
          }}
        >
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-white/60"
              style={{ animation: `dot-bounce 1.2s ease-in-out ${delay}ms infinite` }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
