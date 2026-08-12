import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { UserPlanProvider } from './features/dashboard/context/UserPlanContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserPlanProvider>
        <App />
      </UserPlanProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
