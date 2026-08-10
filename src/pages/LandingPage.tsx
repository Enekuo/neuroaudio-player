import Header from '../components/landing/Header'
import HeroSection from '../components/landing/HeroSection'
import TrustedBar from '../components/landing/TrustedBar'
import PlansSection from '../components/landing/PlansSection'
import Footer from '../components/landing/Footer'

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <main className="landing-page__content">
        <HeroSection />
        <TrustedBar />
        <PlansSection />
      </main>
      <Footer />
    </div>
  )
}

export default LandingPage
