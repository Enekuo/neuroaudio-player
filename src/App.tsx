import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import ExplorePage from './pages/ExplorePage'
import LibraryPage from './features/library/pages/LibraryPage'
import AudiosConjuntosPage from './pages/AudiosConjuntosPage'
import DashboardHomePage from './features/dashboard/pages/DashboardHomePage'
import FavoritosPage from './pages/FavoritosPage'
import PremiumPage from './pages/PremiumPage'
import HabitosPage from './pages/HabitosPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/app" element={<DashboardHomePage />} />
          <Route path="/app/explorar" element={<ExplorePage />} />
          <Route path="/app/biblioteca" element={<LibraryPage />} />
          <Route path="/app/audios-conjuntos" element={<AudiosConjuntosPage />} />
          <Route path="/app/favoritos" element={<FavoritosPage />} />
          <Route path="/app/premium" element={<PremiumPage />} />
          <Route path="/app/habitos" element={<HabitosPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
