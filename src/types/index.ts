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
  | 'maison'

export interface Meal {
  name: string
  emoji: string
  time: string
  fav: boolean
  photo?: string
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
}

export type ActiveTab = 'planning' | 'recettes' | 'courses' | 'settings'

export interface AppSettings {
  personnes: number
  nomFoyer: string
  darkMode?: boolean
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
  | null

export interface SheetState {
  sheet: SheetName
  // context
  mealContext?: { dayIdx: number; slotKey: SlotKey }
  actionContext?: { dayIdx: number; slotKey: SlotKey; meal: Meal }
  recipeContext?: Recipe
  pickDayContext?: { recipe: Recipe; moveFrom?: { dayIdx: number; slotKey: SlotKey } }
  addMealPeriod?: Period
}

/** Données partagées dans Firestore (un doc par foyer) */
export interface FoyerData {
  weekPlans: WeekPlans
  recipes: Recipe[]
  shoppingItems: ShoppingItem[]
  settings: AppSettings
}
