import { useState } from 'react'
import type { Recipe } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import FoodSticker from '@/components/ui/FoodSticker'

/**
 * Une entrée du sommaire.
 *
 * La carte précédente était une fiche produit : vignette de 86px, nom en sans,
 * ligne de méta, le tout dans une carte de verre. Ici la liste se lit comme le
 * sommaire d'un livre — nom en Garamond, points de conduite jusqu'à la durée,
 * et l'image réduite à une planche encadrée d'un filet.
 *
 * La planche est conservée contre la convention du sommaire, qui n'a pas
 * d'images : les cent recettes livrées ont une photo, et on reconnaît un plat
 * à son image bien plus vite qu'à son nom. Elle passe de 86 à 46px, assez
 * petite pour lire comme une vignette de marge.
 */

interface Props {
  recipe: Recipe
  onClick: () => void
  planCount?: number
}

/** Teinte de repli, par moment du repas, quand la recette n'a pas de photo. */
const TEINTE = {
  pdej: 'rgb(var(--c-morning) / 0.22)',
  midi: 'rgb(var(--c-terra) / 0.10)',
  soir: 'rgb(var(--c-evening) / 0.16)',
} as const

export default function RecipeCard({ recipe, onClick, planCount = 0 }: Props) {
  // Photo prise par le foyer, sinon celle livrée avec la recette.
  const photoLocale = useAppStore((s) => s.photos[recipe.id])
  // Certaines photos livrées pointent vers des URL distantes désormais mortes :
  // sans repli, la vignette affichait l'icône d'image cassée du navigateur.
  const [photoCassee, setPhotoCassee] = useState(false)
  const photo = photoCassee ? undefined : (photoLocale ?? recipe.photo)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-end gap-3 text-left py-2.5 cursor-pointer select-none active:opacity-60 transition-opacity"
      style={{
        /*
         * Le navigateur saute la mise en page et le dessin des lignes hors
         * écran, et réserve leur hauteur pour ne pas fausser la barre de
         * défilement. Sans effet là où la propriété n'existe pas, sans casse.
         */
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 66px',
      }}
    >
      {/* La planche : coins peu arrondis et filet, comme une gravure encartée. */}
      <span
        className="w-[46px] h-[46px] rounded-[7px] overflow-hidden flex-shrink-0 self-center flex items-center justify-center border border-text2/20"
        style={photo ? undefined : { background: TEINTE[recipe.period] ?? TEINTE.midi }}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPhotoCassee(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <FoodSticker
            name={recipe.name}
            size={30}
            fallback={<span className="text-[22px] leading-none">{recipe.emoji}</span>}
          />
        )}
      </span>

      <span className="font-book text-[17px] text-text1 leading-snug">
        {recipe.name}
        {recipe.fav && (
          <span className="text-accent ml-1.5 text-[13px]" role="img" aria-label="Favori">
            ♥
          </span>
        )}
      </span>

      <span className="conduite-bas" aria-hidden />

      <span className="font-book elzevir text-[15.5px] text-text2 flex-shrink-0 whitespace-nowrap">
        {planCount > 0 && (
          <span className="italic text-accent mr-1.5">{planCount}×</span>
        )}
        {recipe.time}
      </span>
    </button>
  )
}
