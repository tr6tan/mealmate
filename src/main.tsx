import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { useAppStore } from './store/useAppStore'
import { auth } from './lib/firebase'
import './index.css'

// En développement, le store et la session sont inspectables depuis la console.
if (import.meta.env.DEV) {
  Object.assign(window, { __store: useAppStore, __auth: auth })
}

// Migration unique : purge l'ancien cache localStorage et force un hard reload
// pour que Firestore devienne la seule source de vérité.
if (localStorage.getItem('mealmate-store')) {
  localStorage.removeItem('mealmate-store')
  location.reload()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
