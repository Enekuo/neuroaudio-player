// Fuentes de la landing, alojadas en el proyecto (sin Google): solo los
// pesos que se usan. Sus reglas, en landing.css (solo dentro de la landing).
import '@fontsource/poppins/600.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '../styles/landing.css'
import HeroSection from '../components/landing/HeroSection'
import ProfessionalsSection from '../components/landing/ProfessionalsSection'
import ClienteAppSection from '../components/landing/ClienteAppSection'
import ParaProfesionalesSection from '../components/landing/ParaProfesionalesSection'
import Faq from '../components/landing/Faq'
import Pricing from '../components/landing/Pricing'
import Footer from '../components/landing/Footer'

function LandingPage() {
  return (
    <div className="landing-root">
      <HeroSection />
      <ProfessionalsSection />
      <ClienteAppSection />
      <ParaProfesionalesSection />
      <Faq />
      <Pricing />
      <Footer />
    </div>
  )
}

export default LandingPage
