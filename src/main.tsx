import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './features/auth/context/AuthContext'
import { UserPlanProvider } from './features/dashboard/context/UserPlanContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UserPlanProvider>
          <App />
        </UserPlanProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
