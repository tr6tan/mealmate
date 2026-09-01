export type Period = 'pdej' | 'midi' | 'soir'
export type SlotKey =
  | 'pdej'
  | 'midi'
  | 'midi_entree'
  | 'midi_dessert'
  | 'soir'
  | 'soir_entree'
  | 'soir_dessert'

export type ShoppingCategory =
  | 'legumes'
  | 'viandes'
  | 'cremerie'
  | 'epicerie'
  | 'surgeles'
  | 'maison'

export interface Meal {
  name: string
  emoji: string
  time: string
  fav: boolean
  isRestaurant?: boolean
}

export interface DayPlan {
  pdej: Meal | null
  midi: Meal | null
  midi_entree: Meal | null
  midi_dessert: Meal | null
  soir: Meal | null
  soir_entree: Meal | null
  soir_dessert: Meal | null
}

export type WeekPlan  = Record<number, DayPlan>   // 0=Lun … 6=Dim
export type WeekPlans = Record<string, WeekPlan>  // weekKey (YYYY-MM-DD) → WeekPlan

export type DietaryTag = 'vegetarien' | 'vegan' | 'sans-gluten' | 'sans-lactose'

export interface Recipe {
  id: string
  name: string
  emoji: string
  period: Period
  time: string
  fav: boolean
  rapide: boolean
  photo?: string
  ingredients?: Ingredient[]
  steps?: string[]
  tags?: DietaryTag[]
  notes?: string
  rating?: number // 1-5
  /**
   * Nombre de convives auquel les quantités se rapportent. Absent sur les
   * recettes livrées, qui sont toutes écrites pour BASE_PORTIONS.
   */
  portions?: number
}

export interface Ingredient {
  name: string
  qty: string
  category: ShoppingCategory
}

export interface ShoppingItem {
  id: string
  name: string
  qty: string
  category: ShoppingCategory
  checked: boolean
  /**
   * Horodatage d'ajout. Firestore stocke la liste sous forme de map indexée
   * par id (pour que deux personnes puissent cocher en même temps sans
   * s'écraser) : l'ordre d'affichage ne peut donc plus venir du tableau.
   */
  addedAt?: number
}

export type ActiveTab = 'planning' | 'recettes' | 'courses' | 'settings'

export type ThemeName = 'classic' | 'ocean'

export type DietFilter = 'all' | 'vege' | 'vegan'

export interface AppSettings {
  personnes: number
  nomFoyer: string
  darkMode?: boolean
  theme?: ThemeName
  diet?: DietFilter
}

// Sheets
export type SheetName =
  | 'add-meal'
  | 'meal-actions'
  | 'recipe-detail'
  | 'pick-day'
  | 'add-item'
  | 'new-recipe'
  | 'edit-recipe'
  | 'cook-mode'
  | null

export interface SheetState {
  sheet: SheetName
  // context
  mealContext?: { dayIdx: number; slotKey: SlotKey }
  actionContext?: { dayIdx: number; slotKey: SlotKey; meal: Meal }
  recipeContext?: Recipe
  pickDayContext?: { recipe: Recipe; moveFrom?: { dayIdx: number; slotKey: SlotKey } }
  addMealPeriod?: Period
  /**
   * Création de recette lancée depuis la planification : le nom déjà tapé dans
   * la recherche sert d'amorce, et la recette créée est posée dans le créneau
   * d'où l'on vient. Sans cela il fallait fermer, changer d'onglet, créer,
   * revenir et rouvrir le jour et le créneau.
   */
  newRecipeContext?: { nomInitial?: string; planifier?: { dayIdx: number; slotKey: SlotKey } }
}

/** Données partagées dans Firestore (un doc par foyer) */
export interface FoyerData {
  weekPlans: WeekPlans
  /**
   * Map indexée par id, pour des écritures ciblées (`shoppingItems.{id}`).
   * Un tableau signale l'ancien format et déclenche la migration.
   */
  shoppingItems: Record<string, ShoppingItem> | ShoppingItem[]
  settings: AppSettings
  /** Ids de recettes par défaut supprimées par le foyer : on ne les remet pas. */
  deletedDefaults?: string[]

  // ── Carnet de recettes ────────────────────────────────────────────────────
  // Seul le delta par rapport aux recettes livrées avec l'app est stocké : le
  // carnet complet pesait ~72 Ko, dont 95 % de copies conformes du code, et
  // repartait en entier à chaque clic sur un cœur.

  /** Recettes créées par le foyer. */
  recipesCustom?: Recipe[]
  /** id d'une recette livrée → seuls les champs personnalisés. */
  recipesOverrides?: Record<string, Partial<Omit<Recipe, 'id'>>>

  /**
   * Ancien format : le carnet complet.
   * Lu puis migré vers `recipesCustom` / `recipesOverrides`, jamais réécrit.
   */
  recipes?: Recipe[]
}
