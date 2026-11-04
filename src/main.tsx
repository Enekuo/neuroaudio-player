import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './features/auth/context/AuthContext'
import { UserPlanProvider } from './features/dashboard/context/UserPlanContext'
import { PlayerProvider } from './features/player/context/PlayerContext'
import { applyReducedMotion, getStoredReducedMotion } from './features/settings/utils/reducedMotion'
// Instrument Serif (cursiva) para el calendario de Hábitos, alojada en el
// proyecto en lugar de en Google.
import '@fontsource/instrument-serif/400-italic.css'
import './styles/global.css'

applyReducedMotion(getStoredReducedMotion())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserPlanProvider>
          <PlayerProvider>
            <App />
          </PlayerProvider>
        </UserPlanProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
