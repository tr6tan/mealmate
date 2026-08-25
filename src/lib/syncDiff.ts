/**
 * Calcul des écritures minimales à envoyer à Firestore.
 *
 * Deux problèmes se règlent ici, tous deux dus au fait que la couche de sync
 * renvoyait des champs entiers depuis l'état local :
 *
 * 1. **Perte en édition simultanée.** Envoyer `weekPlans` complet écrase le
 *    travail de l'autre membre du foyer : si A ajoute un repas lundi pendant
 *    que B en ajoute un mardi, le dernier à écrire gagne, parce qu'il envoie
 *    une structure complète qui ne contient pas encore la modification de
 *    l'autre. `merge: true` n'y change rien. En écrivant des *chemins de
 *    champs* précis, c'est Firestore qui fusionne, côté serveur.
 *
 * 2. **Volume.** Le carnet de recettes pèse ~72 Ko et repartait en entier à
 *    chaque clic sur un cœur. Seul le delta par rapport aux recettes livrées
 *    avec l'app a besoin d'être stocké.
 */
import { deleteField, type FieldValue } from 'firebase/firestore'
import type { DayPlan, Meal, Recipe, ShoppingItem, SlotKey, WeekPlans } from '@/types'

/** Les sept créneaux d'une journée, dans l'ordre du modèle. */
const SLOTS: SlotKey[] = [
  'pdej',
  'midi',
  'midi_entree',
  'midi_dessert',
  'soir',
  'soir_entree',
  'soir_dessert',
]

/** Une écriture Firestore : chemin de champ pointé → valeur (ou suppression). */
export type FieldWrites = Record<string, unknown | FieldValue>

/**
 * Sérialisation stable, insensible à l'ordre des clés.
 *
 * Firestore renvoie les objets avec des clés réordonnées : un
 * `JSON.stringify` naïf conclut que tout a changé (mesuré : 100 recettes
 * « modifiées » alors que 71 étaient identiques).
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v as object)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (v as Record<string, unknown>)[k]
          return acc
        }, {})
    }
    return v
  })
}

function sameValue(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

/**
 * Chemins de champs à écrire pour passer de `avant` à `apres`.
 *
 * Granularité : un créneau de repas (`weekPlans.2026-08-24.1.midi`). C'est le
 * plus petit élément qu'un membre du foyer modifie d'un geste, donc le bon
 * niveau pour que deux modifications concurrentes ne s'écrasent pas.
 */
export function diffWeekPlans(avant: WeekPlans, apres: WeekPlans): FieldWrites {
  const writes: FieldWrites = {}

  for (const [weekKey, semaineApres] of Object.entries(apres)) {
    const semaineAvant = avant[weekKey]

    // Semaine entièrement nouvelle : un seul chemin suffit.
    if (!semaineAvant) {
      writes[`weekPlans.${weekKey}`] = semaineApres
      continue
    }

    for (let jour = 0; jour < 7; jour++) {
      const jourApres = semaineApres[jour] as DayPlan | undefined
      const jourAvant = semaineAvant[jour] as DayPlan | undefined
      if (!jourApres) continue

      if (!jourAvant) {
        writes[`weekPlans.${weekKey}.${jour}`] = jourApres
        continue
      }

      for (const slot of SLOTS) {
        const valeurApres = (jourApres[slot] ?? null) as Meal | null
        const valeurAvant = (jourAvant[slot] ?? null) as Meal | null
        if (!sameValue(valeurAvant, valeurApres)) {
          writes[`weekPlans.${weekKey}.${jour}.${slot}`] = valeurApres
        }
      }
    }
  }

  // Semaines disparues (purge des semaines anciennes).
  for (const weekKey of Object.keys(avant)) {
    if (!(weekKey in apres)) writes[`weekPlans.${weekKey}`] = deleteField()
  }

  return writes
}

// ── Recettes : delta par rapport aux recettes livrées avec l'app ────────────

/** Champs d'une recette susceptibles d'être personnalisés par le foyer. */
type RecipePatch = Partial<Omit<Recipe, 'id'>>

export interface RecipesDelta {
  /** Recettes créées par le foyer, absentes du jeu livré. */
  custom: Recipe[]
  /** id d'une recette livrée → seuls les champs qui diffèrent. */
  overrides: Record<string, RecipePatch>
}

/**
 * Réduit le carnet à ce qui n'est pas déjà dans le code.
 *
 * Sur un foyer réel : 71 recettes sur 100 strictement identiques au jeu
 * livré, 29 ne différant que par le booléen `fav`. Résultat, 72 Ko stockés
 * pour moins de 1 Ko d'information réelle.
 */
export function diffRecipes(recipes: Recipe[], defaults: Recipe[]): RecipesDelta {
  const parDefaut = new Map(defaults.map((r) => [r.id, r]))
  const custom: Recipe[] = []
  const overrides: Record<string, RecipePatch> = {}

  for (const recette of recipes) {
    const reference = parDefaut.get(recette.id)
    if (!reference) {
      custom.push(recette)
      continue
    }
    const patch: RecipePatch = {}
    const clefs = new Set([
      ...Object.keys(recette),
      ...Object.keys(reference),
    ]) as Set<keyof Recipe>
    for (const clef of clefs) {
      if (clef === 'id') continue
      if (!sameValue(recette[clef], reference[clef])) {
        // `undefined` est refusé par Firestore : on le remplace par null pour
        // signifier « ce champ a été vidé par le foyer ».
        ;(patch as Record<string, unknown>)[clef] =
          recette[clef] === undefined ? null : recette[clef]
      }
    }
    if (Object.keys(patch).length > 0) overrides[recette.id] = patch
  }

  return { custom, overrides }
}

/**
 * Recompose le carnet complet : recettes livrées (patchées, moins les
 * supprimées) puis recettes du foyer, dans l'ordre d'ajout.
 */
export function mergeRecipes(
  defaults: Recipe[],
  delta: RecipesDelta,
  deletedDefaults: string[] = [],
): Recipe[] {
  const supprimees = new Set(deletedDefaults)
  const base = defaults
    .filter((r) => !supprimees.has(r.id))
    .map((r) => {
      const patch = delta.overrides[r.id]
      if (!patch) return r
      const fusionnee = { ...r } as Record<string, unknown>
      for (const [clef, valeur] of Object.entries(patch)) {
        // null signifie « champ vidé » : on retire la valeur d'origine.
        if (valeur === null) delete fusionnee[clef]
        else fusionnee[clef] = valeur
      }
      return fusionnee as unknown as Recipe
    })

  // Une recette custom portant l'id d'une recette livrée ne doit pas
  // apparaître deux fois.
  const idsBase = new Set(base.map((r) => r.id))
  return [...base, ...delta.custom.filter((r) => !idsBase.has(r.id))]
}

// ── Liste de courses ────────────────────────────────────────────────────────

/**
 * La liste était écrite en entier à chaque coche : deux personnes en train de
 * faire les courses ensemble s'écrasaient mutuellement. Firestore la stocke
 * désormais en map indexée par id, ce qui permet d'adresser un seul article.
 */
export function diffShoppingItems(
  avant: ShoppingItem[],
  apres: ShoppingItem[],
): FieldWrites {
  const writes: FieldWrites = {}
  const avantParId = new Map(avant.map((i) => [i.id, i]))
  const apresParId = new Map(apres.map((i) => [i.id, i]))

  for (const item of apres) {
    const precedent = avantParId.get(item.id)
    if (!precedent || !sameValue(precedent, item)) {
      writes[`shoppingItems.${item.id}`] = item
    }
  }
  for (const item of avant) {
    if (!apresParId.has(item.id)) writes[`shoppingItems.${item.id}`] = deleteField()
  }
  return writes
}

/**
 * Lit la liste quel que soit son format de stockage.
 * L'ordre d'affichage vient de `addedAt` (le plus récent en tête) : une map
 * Firestore n'a pas d'ordre garanti. Les articles antérieurs à ce champ
 * gardent l'ordre dans lequel ils arrivent.
 */
export function readShoppingItems(
  stored: Record<string, ShoppingItem> | ShoppingItem[] | undefined,
): ShoppingItem[] {
  if (!stored) return []
  const items = Array.isArray(stored) ? stored : Object.values(stored)
  return [...items]
    .filter((i) => i && typeof i.id === 'string')
    .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
}

/** Convertit la liste en map pour l'écriture initiale ou la migration. */
export function toShoppingMap(items: ShoppingItem[]): Record<string, ShoppingItem> {
  return Object.fromEntries(items.map((i) => [i.id, i]))
}
