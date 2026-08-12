import { Link } from 'react-router-dom'
import FloatingCards from './FloatingCards'

function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__content">
        <span className="landing-hero__badge">Bienestar mental</span>
        <h1>Reprograma tu mente mientras descansas.</h1>
        <p className="landing-hero__subtitle">
          NeuroAudio reúne meditaciones, mantras y audios guiados para cuidar tu
          calma, tu sueño y tu energía interior.
        </p>
        <div className="landing-hero__actions">
          <Link className="landing-hero__button landing-hero__button--primary" to="/login">
            Prueba gratis
          </Link>
          <a className="landing-hero__button landing-hero__button--secondary" href="#planes">
            Saber más
          </a>
        </div>
        <div className="landing-hero__social-proof">
          <div className="landing-hero__avatars" aria-hidden="true">
            <span>AL</span>
            <span>MR</span>
            <span>JS</span>
            <span>+8k</span>
          </div>
          <p>+10K personas duermen mejor cada semana.</p>
        </div>
      </div>

      <FloatingCards />
    </section>
  )
}

export default HeroSection
