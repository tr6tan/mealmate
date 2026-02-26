import { useEffect, type ReactNode } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getTodayIndex, getWeekMonday } from '@/lib/utils'
import { useFoyerSync } from '@/hooks/useFoyerSync'
import AppShell from '@/components/layout/AppShell'
import PlanningPage from '@/components/planning/PlanningPage'
import RecipesPage from '@/components/recipes/RecipesPage'
import ShoppingPage from '@/components/shopping/ShoppingPage'
import SettingsPage from '@/components/settings/SettingsPage'
// Sheets
import AddMealSheet from '@/components/sheets/AddMealSheet'
import MealActionsSheet from '@/components/sheets/MealActionsSheet'
import RecipeDetailSheet from '@/components/sheets/RecipeDetailSheet'
import PickDaySheet from '@/components/sheets/PickDaySheet'
import AddItemSheet from '@/components/sheets/AddItemSheet'
import NewRecipeSheet from '@/components/sheets/NewRecipeSheet'
import Toast from '@/components/ui/Toast'

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
        <>
          <TabPanel active={activeTab === 'planning'}><PlanningPage /></TabPanel>
          <TabPanel active={activeTab === 'recettes'}><RecipesPage /></TabPanel>
          <TabPanel active={activeTab === 'courses'}><ShoppingPage /></TabPanel>
          <TabPanel active={activeTab === 'settings'}><SettingsPage /></TabPanel>
        </>
      }
    >
      {/* Sheets */}
      <AddMealSheet />
      <MealActionsSheet />
      <RecipeDetailSheet />
      <PickDaySheet />
      <AddItemSheet />
      <NewRecipeSheet />
      {/* Toast */}
      <Toast />
    </AppShell>
  )
}

function TabPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className={active ? 'block' : 'hidden'}>
      {children}
    </div>
  )
}
