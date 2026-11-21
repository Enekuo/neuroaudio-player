import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './features/auth/components/ProtectedRoute'
import SoloProfesionales from './features/cuenta/SoloProfesionales'
import LoginPage from './features/cuenta/pages/LoginPage'
import RegistroProfesionalPage from './features/cuenta/pages/RegistroProfesionalPage'
import RegistroOyentePage from './features/cuenta/pages/RegistroOyentePage'
import EleccionPage from './features/cuenta/pages/EleccionPage'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import LegalPage from './pages/LegalPage'
import ContactoPage from './pages/ContactoPage'
import LibraryPage from './features/library/pages/LibraryPage'
import ListaDetallePage from './features/library/pages/ListaDetallePage'
import AudiosConjuntosPage from './pages/AudiosConjuntosPage'
import DashboardHomePage from './features/dashboard/pages/DashboardHomePage'
import FavoritosPage from './pages/FavoritosPage'
import PremiumPage from './pages/PremiumPage'
import HabitosPage from './pages/HabitosPage'
import PerfilProfesionalOyentePage from './features/perfilProfesional/pages/PerfilProfesionalOyentePage'
import TodosLosProfesionalesPage from './features/perfilProfesional/pages/TodosLosProfesionalesPage'
import ListaProfesionalOyentePage from './features/perfilProfesional/pages/ListaProfesionalOyentePage'
import ProgramaOyentePage from './features/perfilProfesional/pages/ProgramaOyentePage'

// Panel de profesional: se carga bajo demanda para que Material UI (que solo
// usa el panel) no entre en el bundle de la parte de usuario.
const ProfesionalApp = lazy(() => import('./features/profesional/ProfesionalApp'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro/profesional" element={<RegistroProfesionalPage />} />
      <Route path="/registro/oyente" element={<RegistroOyentePage />} />
      <Route path="/registro/elegir" element={<EleccionPage />} />
      <Route path="/legal/:documento" element={<LegalPage />} />
      <Route path="/contacto" element={<ContactoPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/app" element={<DashboardHomePage />} />
          <Route path="/app/biblioteca" element={<LibraryPage />} />
          <Route path="/app/listas/:folderKey" element={<ListaDetallePage />} />
          <Route path="/app/audios-conjuntos" element={<AudiosConjuntosPage />} />
          <Route path="/app/favoritos" element={<FavoritosPage />} />
          <Route path="/app/premium" element={<PremiumPage />} />
          <Route path="/app/habitos" element={<HabitosPage />} />
          <Route path="/app/profesionales" element={<TodosLosProfesionalesPage />} />
          <Route path="/app/profesional/:uid" element={<PerfilProfesionalOyentePage />} />
          <Route path="/app/profesional/:uid/lista/:listaId" element={<ListaProfesionalOyentePage />} />
          <Route path="/app/profesional/:uid/programa/:programaId" element={<ProgramaOyentePage />} />
        </Route>

        {/* Panel de profesional: solo cuentas con tipoCuenta 'profesional'
            (un oyente va a /app). Sus rutas internas viven en ProfesionalApp. */}
        <Route
          path="/profesional/*"
          element={
            <SoloProfesionales>
              <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#f8f9fa' }} />}>
                <ProfesionalApp />
              </Suspense>
            </SoloProfesionales>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
