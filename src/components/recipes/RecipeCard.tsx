import { useState } from 'react'
import type { Recipe } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import FoodSticker from '@/components/ui/FoodSticker'

/**
 * Ligne de recette dans la liste.
 *
 * La version précédente ignorait la photo (que les 100 recettes livrées ont
 * pourtant) au profit d'un sticker en filigrane, doublé d'une rangée de
 * pastilles d'ingrédients qui disait la même chose. Chaque carte occupait
 * ~280px : trois recettes visibles sur cent.
 *
 * Ici : la photo à gauche, le texte à droite, une hauteur de ~96px. On en voit
 * six à huit d'un coup, et on reconnaît un plat à son image.
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
  const nbIngredients = recipe.ingredients?.length ?? 0

  return (
    <button
      onClick={onClick}
      className="w-full flex items-stretch gap-3.5 text-left glass rounded-3xl p-2.5 cursor-pointer select-none active:scale-[0.985] transition-transform"
      style={{
        /*
         * Le navigateur saute la mise en page et le dessin des lignes hors
         * écran, et réserve leur hauteur pour ne pas fausser la barre de
         * défilement. Sans effet là où la propriété n'existe pas, sans casse.
         */
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 96px',
      }}
    >
      {/* Vignette */}
      <div
        className="w-[86px] h-[86px] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
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
            size={52}
            fallback={<span className="text-[36px] leading-none">{recipe.emoji}</span>}
          />
        )}
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1 pr-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[16px] font-semibold text-text1 leading-snug line-clamp-2">
            {recipe.name}
          </p>
          {recipe.fav && (
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="rgb(var(--c-accent))"
              aria-label="Favori"
              role="img"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </div>

        {/* Une seule ligne de méta, en texte : les pastilles d'ingrédients
            répétaient l'information déjà portée par la vignette. */}
        <p className="mt-1 text-[12px] text-muted flex items-center gap-1.5 flex-wrap">
          <span>{recipe.time}</span>
          {nbIngredients > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{nbIngredients} ingrédients</span>
            </>
          )}
          {recipe.rapide && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-text1"
              style={{ background: 'rgb(var(--c-morning) / 0.25)' }}
            >
              Rapide
            </span>
          )}
          {planCount > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--c-terra) / 0.1)', color: 'rgb(var(--c-accent))' }}
            >
              {planCount}× planifié
            </span>
          )}
        </p>
      </div>
    </button>
  )
}
