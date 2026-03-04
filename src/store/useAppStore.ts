import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ActiveTab,
  AppSettings,
  DayPlan,
  FoyerData,
  Meal,
  Period,
  Recipe,
  SheetState,
  ShoppingCategory,
  ShoppingItem,
  SlotKey,
  WeekPlan,
  WeekPlans,
} from '@/types'
import { DEFAULT_RECIPES } from '@/data/defaultRecipes'
import { emptyDay, getMondayByOffset, getWeekKey } from '@/lib/utils'
import { nanoid } from '@/lib/nanoid'

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildInitialWeek(): WeekPlan {
  const plan: WeekPlan = {}
  for (let i = 0; i < 7; i++) plan[i] = emptyDay()
  return plan
}

// Référence stable pour une semaine vide (évite les re-renders infinis)
const EMPTY_WEEK: WeekPlan = buildInitialWeek()

// ── Store interface ───────────────────────────────────────────────────────────

interface AppState {
  // UI
  activeTab: ActiveTab
  currentDayIdx: number
  weekOffset: number           // 0 = semaine courante, -1 = passée, +1 = prochaine
  sheetState: SheetState
  syncStatus: 'connecting' | 'synced' | 'saving' | 'updated' | 'error'

  // Data
  weekPlans: WeekPlans
  recipes: Recipe[]
  shoppingItems: ShoppingItem[]
  settings: AppSettings

  // Actions — UI
  setActiveTab: (tab: ActiveTab) => void
  setCurrentDayIdx: (idx: number) => void
  setWeekOffset: (offset: number) => void
  openSheet: (state: SheetState) => void
  closeSheet: () => void
  setSyncStatus: (status: 'connecting' | 'synced' | 'saving' | 'updated' | 'error') => void

  // Actions — Planning
  setMeal: (dayIdx: number, slotKey: SlotKey, meal: Meal | null) => void
  clearWeek: () => void
  copyWeekFromOffset: (fromOffset: number) => void
  generateShoppingFromPlan: () => void

  // Actions — Recipes
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void
  deleteRecipe: (id: string) => void
  duplicateRecipe: (id: string) => void
  updateRecipe: (id: string, patch: Partial<Omit<Recipe, 'id'>>) => void
  toggleFav: (id: string) => void
  resetRecipes: () => void

  // Actions — Shopping
  addShoppingItem: (item: Omit<ShoppingItem, 'id'>) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  clearCheckedItems: () => void
  clearAllItems: () => void

  // Actions — Settings
  updateSettings: (patch: Partial<AppSettings>) => void

  // Action interne — hydratation depuis Firestore
  _hydrate: (data: FoyerData) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──
      activeTab: 'planning',
      currentDayIdx: -1,
      weekOffset: 0,
      sheetState: { sheet: null },
      syncStatus: 'connecting',

      weekPlans: {},
      recipes: DEFAULT_RECIPES,
      shoppingItems: [],
      settings: {
        personnes: 2,
        nomFoyer: 'Mon foyer',
        darkMode: false,
      },

      // ── UI ──
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentDayIdx: (idx) => set({ currentDayIdx: idx }),
      setWeekOffset: (offset) => set({ weekOffset: offset }),
      openSheet: (state) => set({ sheetState: state }),
      closeSheet: () => set({ sheetState: { sheet: null } }),
      setSyncStatus: (status) => set({ syncStatus: status }),

      // ── Planning ──
      setMeal: (dayIdx, slotKey, meal) =>
        set((s) => {
          const key = getWeekKey(getMondayByOffset(s.weekOffset))
          const currentWeek = s.weekPlans[key] ?? buildInitialWeek()
          const day = { ...currentWeek[dayIdx], [slotKey]: meal } as DayPlan
          return {
            weekPlans: { ...s.weekPlans, [key]: { ...currentWeek, [dayIdx]: day } },
          }
        }),

      clearWeek: () =>
        set((s) => {
          const key = getWeekKey(getMondayByOffset(s.weekOffset))
          return { weekPlans: { ...s.weekPlans, [key]: buildInitialWeek() } }
        }),

      copyWeekFromOffset: (fromOffset: number) =>
        set((s) => {
          const fromKey = getWeekKey(getMondayByOffset(fromOffset))
          const toKey = getWeekKey(getMondayByOffset(s.weekOffset))
          const source = s.weekPlans[fromKey]
          if (!source) return {}
          // Deep copy de chaque jour
          const copy: WeekPlan = {}
          for (let i = 0; i < 7; i++) copy[i] = source[i] ? { ...source[i] } : emptyDay()
          return { weekPlans: { ...s.weekPlans, [toKey]: copy } }
        }),

      generateShoppingFromPlan: () => {
        const { weekPlans, weekOffset, recipes } = get()
        const key = getWeekKey(getMondayByOffset(weekOffset))
        const weekPlan = weekPlans[key] ?? buildInitialWeek()
        const recipeMap = new Map(recipes.map((r) => [r.name, r]))
        const items: ShoppingItem[] = []

        for (let day = 0; day < 7; day++) {
          const plan = weekPlan[day]
          if (!plan) continue
          const slots: (Meal | null)[] = [
            plan.pdej,
            plan.midi,
            plan.midi_entree,
            plan.midi_dessert,
            plan.soir,
            plan.soir_entree,
            plan.soir_dessert,
          ]
          slots.forEach((meal) => {
            if (!meal) return
            const recipe = recipeMap.get(meal.name)
            recipe?.ingredients?.forEach((ing) => {
              items.push({
                id: nanoid(),
                name: ing.name,
                qty: ing.qty,
                category: ing.category,
                checked: false,
              })
            })
          })
        }
        // Déduplication par nom (case-insensitive)
        const merged = new Map<string, ShoppingItem>()
        for (const item of items) {
          const itemKey = item.name.toLowerCase().trim()
          if (merged.has(itemKey)) {
            const existing = merged.get(itemKey)!
            if (item.qty && existing.qty) {
              existing.qty = `${existing.qty} + ${item.qty}`
            } else if (item.qty) {
              existing.qty = item.qty
            }
          } else {
            merged.set(itemKey, { ...item })
          }
        }
        // Conserver les articles manuels (sans ingrédients de recette) non encore présents
        const generatedNames = new Set(merged.keys())
        const existingManual = get().shoppingItems.filter(
          (i) => !generatedNames.has(i.name.toLowerCase().trim())
        )
        set({ shoppingItems: [...Array.from(merged.values()), ...existingManual] })
      },

      // ── Recipes ──
      addRecipe: (recipe) =>
        set((s) => ({
          recipes: [{ ...recipe, id: nanoid() }, ...s.recipes],
        })),

      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),

      duplicateRecipe: (id) =>
        set((s) => {
          const src = s.recipes.find((r) => r.id === id)
          if (!src) return {}
          const copy = { ...src, id: nanoid(), name: `${src.name} (copie)` }
          const idx = s.recipes.findIndex((r) => r.id === id)
          const next = [...s.recipes]
          next.splice(idx + 1, 0, copy)
          return { recipes: next }
        }),

      updateRecipe: (id, patch) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      toggleFav: (id) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, fav: !r.fav } : r)),
        })),

      resetRecipes: () => set({ recipes: DEFAULT_RECIPES }),

      // ── Shopping ──
      addShoppingItem: (item) =>
        set((s) => ({
          shoppingItems: [{ ...item, id: nanoid() }, ...s.shoppingItems],
        })),

      toggleShoppingItem: (id) =>
        set((s) => ({
          shoppingItems: s.shoppingItems.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i,
          ),
        })),

      removeShoppingItem: (id) =>
        set((s) => ({ shoppingItems: s.shoppingItems.filter((i) => i.id !== id) })),

      clearCheckedItems: () =>
        set((s) => ({ shoppingItems: s.shoppingItems.filter((i) => !i.checked) })),

      clearAllItems: () => set({ shoppingItems: [] }),

      // ── Settings ──
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      // ── Hydratation Firestore ──
      _hydrate: (data) => {
        // Migration : anciens docs Firestore avaient weekPlan (flat), nouveaux ont weekPlans
        let weekPlans = data.weekPlans ?? get().weekPlans
        if (!weekPlans || Object.keys(weekPlans).length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldWeekPlan = (data as any).weekPlan
          if (oldWeekPlan) {
            const key = getWeekKey(getMondayByOffset(0))
            weekPlans = { [key]: oldWeekPlan }
          }
        }
        // Purge des semaines > 4 semaines passées
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 28)
        cutoff.setHours(0, 0, 0, 0)
        weekPlans = Object.fromEntries(
          Object.entries(weekPlans).filter(([key]) => new Date(key) >= cutoff)
        )
        // darkMode est une préférence locale : on la préserve lors des mises à jour distantes
        const localDarkMode = get().settings.darkMode
        set({
          weekPlans,
          recipes:       data.recipes       ?? get().recipes,
          shoppingItems: data.shoppingItems ?? get().shoppingItems,
          settings: {
            ...(data.settings ?? get().settings),
            darkMode: localDarkMode,
          },
        })
      },
    }),
    {
      name: 'mealmate-store',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        // Sanitize recipes : assure que chaque recette a les champs obligatoires
        if (Array.isArray(state.recipes)) {
          state.recipes = state.recipes
            .filter((r: unknown) => r && typeof r === 'object')
            .map((r: Record<string, unknown>) => ({
              ...r,
              id:     r.id     ?? String(Math.random()),
              name:   typeof r.name === 'string' && r.name ? r.name : 'Recette sans nom',
              emoji:  r.emoji  ?? '🍽️',
              period: r.period === 'pdej' || r.period === 'midi' || r.period === 'soir' ? r.period : 'midi',
              time:   typeof r.time === 'string' ? r.time : '',
              fav:    Boolean(r.fav),
              rapide: Boolean(r.rapide),
            }))
        }
        return state
      },
      storage: createJSONStorage(() => localStorage),
      // Persister uniquement les données métier (pas l'UI)
      partialize: (s) => ({
        weekPlans:     s.weekPlans,
        recipes:       s.recipes,
        shoppingItems: s.shoppingItems,
        settings:      s.settings,
      }),
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectCurrentWeekPlan = (s: AppState): WeekPlan => {
  const key = getWeekKey(getMondayByOffset(s.weekOffset))
  return s.weekPlans[key] ?? EMPTY_WEEK
}

export const selectItemsByCategory = (category: ShoppingCategory) => (s: AppState) =>
  s.shoppingItems.filter((i) => i.category === category)

export const selectShoppingProgress = (s: AppState) => {
  const total = s.shoppingItems.length
  const checked = s.shoppingItems.filter((i) => i.checked).length
  return { total, checked, pct: total ? Math.round((checked / total) * 100) : 0 }
}

// Re-export Period to avoid unused-import warnings
export type { Period }
