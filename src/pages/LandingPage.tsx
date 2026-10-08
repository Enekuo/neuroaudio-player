import HeroSection from '../components/landing/HeroSection'
import ProfessionalsSection from '../components/landing/ProfessionalsSection'
import Faq from '../components/landing/Faq'
import Pricing from '../components/landing/Pricing'
import Footer from '../components/landing/Footer'

function LandingPage() {
  return (
    <div className="landing-root">
      <HeroSection />
      <ProfessionalsSection />
      <Faq />
      <Pricing />
      <Footer />
    </div>
  )
}

export default LandingPage
