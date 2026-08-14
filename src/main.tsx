import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './features/auth/context/AuthContext'
import { UserPlanProvider } from './features/dashboard/context/UserPlanContext'
import { PlayerProvider } from './features/player/context/PlayerContext'
import './styles/global.css'

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
