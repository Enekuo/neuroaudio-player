import HeroSection from '../components/landing/HeroSection'
import Faq from '../components/landing/Faq'
import Pricing from '../components/landing/Pricing'
import Footer from '../components/landing/Footer'

function LandingPage() {
  return (
    <div className="landing-root">
      <HeroSection />
      <Faq />
      <Pricing />
      <Footer />
    </div>
  )
}

export default LandingPage
