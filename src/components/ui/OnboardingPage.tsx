export default function OnboardingPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-8 bg-bg px-6">
      {/* Logo – liquid glass */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Glow derrière */}
        <div className="absolute inset-0 rounded-[26px] bg-terra/30 blur-xl scale-110" />
        {/* Glass container */}
        <div className="relative w-24 h-24 rounded-[22px] bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-center overflow-hidden">
          {/* Reflet brillant */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent rounded-t-[22px] pointer-events-none" />
          <img src="/logo-source.png" alt="MealMate" className="relative w-[72px] h-[72px] drop-shadow-sm" />
        </div>
      </div>

      {/* Titre */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-text1">MealMate</h1>
        <p className="mt-2 text-text2 text-sm">Votre planning repas partagé</p>
      </div>

      {/* Action principale */}
      <button
        onClick={() => {}}
        className="w-full max-w-xs py-4 rounded-xl bg-terra text-white font-bold text-base shadow-card active:scale-95 transition-transform"
      >
        Créer mon foyer
      </button>

      {/* Hint pour les invités */}
      <p className="text-muted text-xs text-center max-w-xs">
        Pour rejoindre le foyer de quelqu'un, ouvrez le lien de partage qu'il vous a envoyé.
      </p>
    </div>
  )
}
