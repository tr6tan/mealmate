import { useState } from 'react'
import type { Recipe } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import FoodSticker from '@/components/ui/FoodSticker'

/**
 * Une ligne de la liste des recettes.
 *
 * Sans carte ni verre : sur cent lignes, cent cadres et cent ombres portées
 * font plus de bruit que d'information. Un filet fin posé sous le texte suffit
 * à séparer deux entrées, et il s'arrête au bord de la vignette pour que l'œil
 * suive la colonne de texte — la convention des listes iOS.
 */

interface Props {
  recipe: Recipe
  onClick: () => void
  planCount?: number
  /** Dernière ligne d'une section : pas de filet, la section le porte. */
  derniere?: boolean
}

/** Teinte de repli, par moment du repas, quand la recette n'a pas de photo. */
const TEINTE = {
  pdej: 'rgb(var(--c-morning) / 0.20)',
  midi: 'rgb(var(--c-terra) / 0.08)',
  soir: 'rgb(var(--c-evening) / 0.14)',
} as const

export default function RecipeCard({ recipe, onClick, planCount = 0, derniere }: Props) {
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
      className="w-full flex items-center gap-3.5 text-left pl-0 pr-1 active:opacity-55 transition-opacity"
      style={{
        /*
         * Le navigateur saute la mise en page et le dessin des lignes hors
         * écran, et réserve leur hauteur pour ne pas fausser la barre de
         * défilement. Sans effet là où la propriété n'existe pas, sans casse.
         */
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 68px',
      }}
    >
      <span
        className="w-[52px] h-[52px] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
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
            size={34}
            fallback={<span className="text-[24px] leading-none">{recipe.emoji}</span>}
          />
        )}
      </span>

      {/* Le filet part du texte, pas du bord : la vignette n'est pas coupée. */}
      <span
        className={`flex-1 min-w-0 flex items-center gap-3 py-3.5 ${
          derniere ? '' : 'border-b border-sep'
        }`}
      >
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-[16px] font-semibold text-text1 tracking-[-0.01em] leading-snug line-clamp-2">
              {recipe.name}
            </span>
            {recipe.fav && (
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="rgb(var(--c-accent))" role="img" aria-label="Favori">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
          </span>
          <span className="block mt-0.5 text-[13px] text-muted tabular-nums">
            {recipe.time}
            {nbIngredients > 0 && ` · ${nbIngredients} ingrédients`}
            {planCount > 0 && (
              <span className="text-accent font-semibold"> · {planCount}× au menu</span>
            )}
          </span>
        </span>

        <svg className="w-4 h-4 text-muted/45 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </button>
  )
}
