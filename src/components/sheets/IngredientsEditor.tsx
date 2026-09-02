import { useMemo, useRef, useState } from 'react'
import FoodSticker from '@/components/ui/FoodSticker'
import { CATALOG } from '@/data/shoppingCatalog'
import { devinerCategorie } from '@/lib/categorieIngredient'
import { cn, ingredientEmoji } from '@/lib/utils'
import { CAT_OPTIONS, type IngredientForm } from './recipeFormOptions'

/**
 * Saisie des ingrédients.
 *
 * La version précédente demandait, pour chaque ingrédient, de taper le nom,
 * taper la quantité, puis viser une puce de rayon parmi cinq. Trois gestes par
 * ligne, la troisième pour dire qu'une tomate est un légume.
 *
 * Ici on part d'une barre d'ajout : on tape, les ingrédients courants du
 * catalogue apparaissent en pastilles illustrées, un appui les ajoute. La
 * quantité se remplit après, sur la ligne, et le rayon est deviné. Les puces
 * de rayon ne se montrent que sur la ligne en cours de saisie.
 */

interface Props {
  ingredients: IngredientForm[]
  onChange: (liste: IngredientForm[]) => void
}

/** Tous les ingrédients du catalogue, à plat, pour la recherche. */
const CATALOGUE_PLAT = CATALOG.flatMap((s) => s.items)

function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function IngredientsEditor({ ingredients, onChange }: Props) {
  const [saisie, setSaisie] = useState('')
  const [actif, setActif] = useState<number | null>(null)
  const champ = useRef<HTMLInputElement>(null)

  const dejaLa = useMemo(
    () => new Set(ingredients.map((i) => normaliser(i.name))),
    [ingredients],
  )

  /*
   * Sans frappe, on montre les ingrédients les plus courants plutôt qu'une
   * grille vide : la barre doit donner envie d'être touchée. Dès qu'on tape,
   * la liste se resserre sur ce qui correspond.
   */
  const suggestions = useMemo(() => {
    const q = normaliser(saisie.trim())
    const libres = CATALOGUE_PLAT.filter((i) => !dejaLa.has(normaliser(i.name)))
    if (!q) return libres.slice(0, 12)
    return libres.filter((i) => normaliser(i.name).includes(q)).slice(0, 12)
  }, [saisie, dejaLa])

  const ajouter = (nom: string) => {
    const propre = nom.trim()
    if (!propre) return
    if (dejaLa.has(normaliser(propre))) {
      setSaisie('')
      return
    }
    onChange([...ingredients, { name: propre, qty: '', category: devinerCategorie(propre) }])
    setSaisie('')
    // Le champ garde le focus : on ajoute rarement un seul ingrédient.
    champ.current?.focus()
  }

  const maj = (idx: number, patch: Partial<IngredientForm>) =>
    onChange(ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)))

  const majNom = (idx: number, nom: string) =>
    maj(idx, { name: nom, ...(ingredients[idx].categorieChoisie ? {} : { category: devinerCategorie(nom) }) })

  return (
    <div>
      {/* La liste, d'abord : c'est ce qu'on relit. */}
      {ingredients.length > 0 && (
        <ul className="mb-3">
          {ingredients.map((ing, idx) => (
            <li key={idx} className="border-b border-sep last:border-0">
              <div className="flex items-center gap-2.5 py-1.5">
                <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                  <FoodSticker
                    name={ing.name}
                    size={26}
                    shadow={false}
                    fallback={<span className="text-[19px] leading-none">{ingredientEmoji(ing.name)}</span>}
                  />
                </span>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => majNom(idx, e.target.value)}
                  onFocus={() => setActif(idx)}
                  aria-label={`Ingrédient ${idx + 1}`}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-medium text-text1"
                />
                <input
                  type="text"
                  value={ing.qty}
                  onChange={(e) => maj(idx, { qty: e.target.value })}
                  onFocus={() => setActif(idx)}
                  placeholder="Qté"
                  aria-label={`Quantité de ${ing.name || `l’ingrédient ${idx + 1}`}`}
                  className="w-[74px] flex-shrink-0 bg-transparent outline-none text-[15px] font-medium text-right text-text2 tabular-nums placeholder:text-muted placeholder:font-normal"
                />
                <button
                  type="button"
                  onClick={() => onChange(ingredients.filter((_, i) => i !== idx))}
                  aria-label={`Retirer ${ing.name || 'cet ingrédient'}`}
                  className="w-8 h-9 flex items-center justify-center text-muted flex-shrink-0 active:scale-90 transition-transform"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* Le rayon ne se montre que sur la ligne qu'on modifie : cinq
                  puces sous chacun des huit ingrédients faisaient quarante
                  boutons pour une information devinée juste presque toujours. */}
              {actif === idx && (
                <div className="flex gap-1 pb-2 pl-[42px] pr-8">
                  {CAT_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => maj(idx, { category: c.id, categorieChoisie: true })}
                      aria-pressed={ing.category === c.id}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors',
                        ing.category === c.id ? 'bg-sage/15 text-sage' : 'text-muted/70',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* La barre d'ajout */}
      <div className="flex items-center gap-2 h-11 px-3.5 rounded-2xl bg-black/[0.045]">
        <svg className="w-[17px] h-[17px] text-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <input
          ref={champ}
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            // Sans cela, la touche Entrée soumettait la feuille entière.
            e.preventDefault()
            ajouter(saisie)
          }}
          placeholder="Ajouter un ingrédient"
          aria-label="Ajouter un ingrédient"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-text1 placeholder:text-muted"
        />
        {saisie.trim() && (
          <button
            type="button"
            onClick={() => ajouter(saisie)}
            className="h-8 px-3 rounded-full bg-terra text-white text-[13px] font-semibold flex-shrink-0 active:scale-95 transition-transform"
          >
            Ajouter
          </button>
        )}
      </div>

      {/* Les pastilles illustrées : on reconnaît une tomate plus vite qu'on ne
          la tape. */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => ajouter(s.name)}
              className="flex items-center gap-1.5 h-9 pl-1.5 pr-3 rounded-full bg-black/[0.045] active:scale-95 transition-transform"
            >
              <FoodSticker
                name={s.name}
                size={22}
                shadow={false}
                fallback={<span className="text-[16px] leading-none">{ingredientEmoji(s.name)}</span>}
              />
              <span className="text-[13px] font-semibold text-text2">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
