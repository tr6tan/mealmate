import type { EtapeAccueil } from './etapes'

/**
 * Les dessins de l'accueil.
 *
 * En SVG et non en illustrations importées : quatre images auraient pesé plus
 * que tout le reste de l'écran, et une PWA qui montre des cadres vides le
 * temps du téléchargement rate son premier contact. Ils reprennent les jetons
 * de couleur de l'app, donc suivent le thème et le mode sombre.
 */
export default function Dessin({ nom }: { nom: EtapeAccueil['dessin'] }) {
  return (
    <div className="w-full flex items-center justify-center" aria-hidden>
      <svg viewBox="0 0 200 150" className="w-full max-w-[260px] h-auto">
        {nom === 'foyer' && <Foyer />}
        {nom === 'semaine' && <Semaine />}
        {nom === 'courses' && <Courses />}
        {nom === 'photo' && <Photo />}
      </svg>
    </div>
  )
}

const TERRA = 'rgb(var(--c-terra))'
const TERRA_PALE = 'rgb(var(--c-terra) / 0.14)'
const SAGE = 'rgb(var(--c-sage))'
const MORNING = 'rgb(var(--c-morning))'
const TRAIT = 'rgb(var(--c-text2) / 0.28)'
const CARTE = 'rgb(var(--c-card))'

/** Deux téléphones, un même contenu : le foyer partagé. */
function Foyer() {
  return (
    <>
      {[36, 116].map((x, i) => (
        <g key={x}>
          <rect x={x} y={28} width={48} height={82} rx={9} fill={CARTE} stroke={TRAIT} strokeWidth={2} />
          <rect x={x + 8} y={40} width={32} height={5} rx={2.5} fill={TERRA} opacity={0.85} />
          <rect x={x + 8} y={53} width={24} height={4} rx={2} fill={TRAIT} />
          <rect x={x + 8} y={64} width={32} height={12} rx={4} fill={TERRA_PALE} />
          <rect x={x + 8} y={82} width={32} height={12} rx={4} fill={i === 0 ? TERRA_PALE : TERRA_PALE} />
        </g>
      ))}
      {/* La synchronisation, deux flèches entre les deux */}
      <path d="M92 60 h16 m-4 -4 l4 4 -4 4" fill="none" stroke={SAGE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M108 80 h-16 m4 -4 l-4 4 4 4" fill="none" stroke={SAGE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** Une semaine dont un créneau se remplit. */
function Semaine() {
  return (
    <>
      {[0, 1, 2].map((i) => {
        // Décalage porté par un groupe translaté : les coordonnées du « + »
        // étaient absolues, il se dessinait donc sur la première ligne au
        // lieu du créneau qu'il désigne.
        const y = i * 34
        return (
          <g key={i} transform={`translate(0 ${y})`}>
            <rect x={30} y={26} width={140} height={26} rx={8} fill={CARTE} stroke={TRAIT} strokeWidth={1.6} />
            <rect x={40} y={35} width={20} height={4} rx={2} fill={TRAIT} />
            {i < 2 ? (
              <rect x={70} y={33} width={60} height={8} rx={4} fill={TERRA_PALE} />
            ) : (
              <>
                <rect x={70} y={31} width={64} height={16} rx={8} fill={TERRA} />
                <path d="M96 39 h12 M102 33 v12" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
              </>
            )}
          </g>
        )
      })}
      {/* Le doigt qui touche le créneau vide */}
      <circle cx={102} cy={131} r={9} fill={TERRA} opacity={0.16} />
      <circle cx={102} cy={131} r={4} fill={TERRA} />
    </>
  )
}

/** Le menu qui devient une liste rangée par rayon. */
function Courses() {
  return (
    <>
      <rect x={18} y={34} width={62} height={70} rx={9} fill={CARTE} stroke={TRAIT} strokeWidth={1.8} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={27} y={45 + i * 18} width={44} height={9} rx={4.5} fill={TERRA_PALE} />
      ))}
      <path d="M88 69 h22 m-6 -6 l6 6 -6 6" fill="none" stroke={SAGE} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={120} y={34} width={62} height={70} rx={9} fill={CARTE} stroke={TRAIT} strokeWidth={1.8} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={129} y={44 + i * 15} width={9} height={9} rx={2.5} fill={i < 2 ? SAGE : 'none'} stroke={i < 2 ? SAGE : TRAIT} strokeWidth={1.6} />
          {i < 2 && <path d={`M131.5 ${48.5 + i * 15} l2 2 3.5 -4`} stroke="#fff" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x={143} y={46 + i * 15} width={30} height={5} rx={2.5} fill={TRAIT} />
        </g>
      ))}
    </>
  )
}

/** Un appareil photo devant une page, et la fiche qui se remplit. */
function Photo() {
  return (
    <>
      <rect x={24} y={26} width={64} height={84} rx={7} fill={CARTE} stroke={TRAIT} strokeWidth={1.8} />
      <rect x={33} y={36} width={40} height={6} rx={3} fill={TRAIT} />
      <rect x={33} y={49} width={46} height={26} rx={4} fill={MORNING} opacity={0.5} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={33} y={82 + i * 9} width={i === 2 ? 28 : 46} height={4} rx={2} fill={TRAIT} />
      ))}
      {/* L'objectif */}
      <rect x={92} y={56} width={26} height={20} rx={5} fill={TERRA} />
      <circle cx={105} cy={66} r={6} fill="#fff" opacity={0.9} />
      <circle cx={105} cy={66} r={3} fill={TERRA} />
      <rect x={99} y={51} width={12} height={5} rx={2.5} fill={TERRA} />
      {/* La fiche remplie */}
      <rect x={128} y={26} width={52} height={84} rx={7} fill={CARTE} stroke={TRAIT} strokeWidth={1.8} />
      <rect x={136} y={35} width={30} height={5} rx={2.5} fill={TERRA} opacity={0.85} />
      <rect x={136} y={46} width={36} height={18} rx={4} fill={MORNING} opacity={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={139} cy={74 + i * 9} r={2.4} fill={SAGE} />
          <rect x={146} y={72 + i * 9} width={26} height={4} rx={2} fill={TRAIT} />
        </g>
      ))}
    </>
  )
}
