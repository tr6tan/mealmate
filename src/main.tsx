import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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
