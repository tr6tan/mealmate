import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import SplashScreen from '@/components/ui/SplashScreen'
import OnboardingPage from '@/components/ui/OnboardingPage'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { useAppStore } from '@/store/useAppStore'
import { getTodayIndex, getWeekMonday } from '@/lib/utils'
import { useFoyerSync } from '@/hooks/useFoyerSync'
import { hasFoyer } from '@/lib/foyer'
import AppShell from '@/components/layout/AppShell'
import Toast from '@/components/ui/Toast'
import SyncBanner from '@/components/ui/SyncBanner'
// Pages : import statique → navigation instantanée (bundle PWA mis en cache de toute façon)
import PlanningPage  from '@/components/planning/PlanningPage'
import RecipesPage   from '@/components/recipes/RecipesPage'
import ShoppingPage  from '@/components/shopping/ShoppingPage'
import SettingsPage  from '@/components/settings/SettingsPage'
// Sheets : lazy car rarement ouvertes
const AddMealSheet      = lazy(() => import('@/components/sheets/AddMealSheet'))
const MealActionsSheet  = lazy(() => import('@/components/sheets/MealActionsSheet'))
const RecipeDetailSheet = lazy(() => import('@/components/sheets/RecipeDetailSheet'))
const PickDaySheet      = lazy(() => import('@/components/sheets/PickDaySheet'))
const AddItemSheet      = lazy(() => import('@/components/sheets/AddItemSheet'))
const NewRecipeSheet    = lazy(() => import('@/components/sheets/NewRecipeSheet'))
const EditRecipeSheet   = lazy(() => import('@/components/sheets/EditRecipeSheet'))

/** Gate : si aucun foyer n'est associé à cet appareil, affiche l'onboarding. */
export default function App() {
  if (!hasFoyer()) return <OnboardingPage />
  return <MainApp />
}

function MainApp() {
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
    <ErrorBoundary>
    <>
      {showSplash && <SplashScreen onDone={hideSplash} />}
      <AppShell
      nav={
        <>
          <TabPanel active={activeTab === 'planning'}><PlanningPage /></TabPanel>
          <TabPanel active={activeTab === 'recettes'}><RecipesPage /></TabPanel>
          <TabPanel active={activeTab === 'courses'}><ShoppingPage /></TabPanel>
          <TabPanel active={activeTab === 'settings'}><SettingsPage /></TabPanel>
        </>
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
    </ErrorBoundary>
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
