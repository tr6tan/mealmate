export default function OnboardingPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-8 bg-bg px-6">
      {/* Logo */}
      <img src="/favicon.svg" alt="MealMate" className="w-24 h-24 rounded-2xl shadow-card" />

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
