/**
 * Fleuron : l'ornement qui sépare deux sections d'une page de livre.
 *
 * Un simple intertitre suffirait, mais c'est le filet interrompu par un motif
 * central qui fait lire la page comme un livre et non comme une fiche. Dessiné
 * en SVG plutôt qu'écrit avec le caractère ❦ : le rendu de ce glyphe dépend
 * trop de la fonte installée, et il manque à la plupart.
 */
export default function Fleuron({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6" aria-hidden={!label}>
      <span className="flex-1 h-px bg-text2/25" />
      {label ? (
        <span className="font-book capitales text-[11px] text-text2 px-1">{label}</span>
      ) : (
        <Motif />
      )}
      <span className="flex-1 h-px bg-text2/25" />
    </div>
  )
}

/** Losange à trois lobes, motif de fleuron le plus courant en typographie. */
function Motif() {
  return (
    <svg
      width="17"
      height="9"
      viewBox="0 0 17 9"
      fill="none"
      className="flex-shrink-0 text-evening/55"
      aria-hidden
    >
      <path
        d="M8.5 0.9 L10.6 4.5 L8.5 8.1 L6.4 4.5 Z"
        fill="currentColor"
      />
      <circle cx="1.7" cy="4.5" r="1.35" fill="currentColor" opacity="0.62" />
      <circle cx="15.3" cy="4.5" r="1.35" fill="currentColor" opacity="0.62" />
    </svg>
  )
}
