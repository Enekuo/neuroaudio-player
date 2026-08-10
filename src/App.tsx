import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import LibraryPage from './pages/LibraryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<MainLayout />}>
        <Route path="/app" element={<HomePage />} />
        <Route path="/app/explorar" element={<ExplorePage />} />
        <Route path="/app/biblioteca" element={<LibraryPage />} />
      </Route>
    </Routes>
  )
}

export default App
