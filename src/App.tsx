import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getTodayIndex, getWeekMonday } from '@/lib/utils'
import { useFoyerSync } from '@/hooks/useFoyerSync'
import AppShell from '@/components/layout/AppShell'
import Toast from '@/components/ui/Toast'
import SyncBanner from '@/components/ui/SyncBanner'

const PlanningPage      = lazy(() => import('@/components/planning/PlanningPage'))
const RecipesPage       = lazy(() => import('@/components/recipes/RecipesPage'))
const ShoppingPage      = lazy(() => import('@/components/shopping/ShoppingPage'))
const SettingsPage      = lazy(() => import('@/components/settings/SettingsPage'))
const AddMealSheet      = lazy(() => import('@/components/sheets/AddMealSheet'))
const MealActionsSheet  = lazy(() => import('@/components/sheets/MealActionsSheet'))
const RecipeDetailSheet = lazy(() => import('@/components/sheets/RecipeDetailSheet'))
const PickDaySheet      = lazy(() => import('@/components/sheets/PickDaySheet'))
const AddItemSheet      = lazy(() => import('@/components/sheets/AddItemSheet'))
const NewRecipeSheet    = lazy(() => import('@/components/sheets/NewRecipeSheet'))

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)

  // Synchronisation Firestore ↔ store
  useFoyerSync()

  // Initialise le jour courant au montage
  useEffect(() => {
    const monday = getWeekMonday()
    const idx = getTodayIndex(monday)
    setCurrentDayIdx(idx >= 0 ? idx : 0)
  }, [setCurrentDayIdx])

  return (
    <AppShell
      nav={
        <Suspense fallback={null}>
          <TabPanel active={activeTab === 'planning'}><PlanningPage /></TabPanel>
          <TabPanel active={activeTab === 'recettes'}><RecipesPage /></TabPanel>
          <TabPanel active={activeTab === 'courses'}><ShoppingPage /></TabPanel>
          <TabPanel active={activeTab === 'settings'}><SettingsPage /></TabPanel>
        </Suspense>
      }
    >
      {/* Sheets */}
      <Suspense fallback={null}>
        <AddMealSheet />
        <MealActionsSheet />
        <RecipeDetailSheet />
        <PickDaySheet />
        <AddItemSheet />
        <NewRecipeSheet />
      </Suspense>
      {/* Toast */}
      <Toast />
      <SyncBanner />
    </AppShell>
  )
}

function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  // Monte le contenu seulement au premier affichage (lazy), le garde ensuite en DOM
  const hasMountedRef = useRef(false)
  if (active) hasMountedRef.current = true
  if (!hasMountedRef.current) return null
  return (
    <div className={active ? 'block' : 'hidden'}>
      {children}
    </div>
  )
}
