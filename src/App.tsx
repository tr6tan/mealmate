import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import SplashScreen from '@/components/ui/SplashScreen'
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
const EditRecipeSheet   = lazy(() => import('@/components/sheets/EditRecipeSheet'))

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const hideSplash = useCallback(() => setShowSplash(false), [])

  const activeTab = useAppStore((s) => s.activeTab)
  const setCurrentDayIdx = useAppStore((s) => s.setCurrentDayIdx)
  const darkMode = useAppStore((s) => s.settings.darkMode)

  // Appliquer/retirer la classe dark sur <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Synchronisation Firestore ↔ store
  useFoyerSync()

  // Initialise le jour courant au montage
  useEffect(() => {
    const monday = getWeekMonday()
    const idx = getTodayIndex(monday)
    setCurrentDayIdx(idx >= 0 ? idx : 0)
  }, [setCurrentDayIdx])

  return (
    <>
      {showSplash && <SplashScreen onDone={hideSplash} />}
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
        <EditRecipeSheet />
      </Suspense>
      {/* Toast */}
      <Toast />
      <SyncBanner />
    </AppShell>
    </>
  )
}

function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  // Monte le contenu seulement au premier affichage (lazy), le garde ensuite en DOM
  const hasMountedRef = useRef(false)
  if (active) hasMountedRef.current = true
  if (!hasMountedRef.current) return null
  return (
    <div className={active ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
      {children}
    </div>
  )
}
