// Fuentes de la landing, alojadas en el proyecto (sin Google): solo los
// pesos que se usan. Sus reglas, en landing.css (solo dentro de la landing).
import '@fontsource/poppins/600.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '../styles/landing.css'
import '../styles/landing-claro.css'
import HeroSection from '../components/landing/HeroSection'
import ClienteAppSection from '../components/landing/ClienteAppSection'
import ParaProfesionalesSection from '../components/landing/ParaProfesionalesSection'
import Faq from '../components/landing/Faq'
import Pricing from '../components/landing/Pricing'
import CtaFinalSection from '../components/landing/CtaFinalSection'
import Footer from '../components/landing/Footer'

function LandingPage() {
  return (
    <div className="landing-root na-landing">
      <HeroSection />
      <ClienteAppSection />
      <ParaProfesionalesSection />
      <Faq />
      <Pricing />
      <CtaFinalSection />
      <Footer conBoton={false} />
    </div>
  )
}

export default LandingPage
