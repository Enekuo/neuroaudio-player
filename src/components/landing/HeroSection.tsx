import { Link } from 'react-router-dom'

function HeroSection() {
  return (
    <section className="na-hero">
      <div className="na-hero__glow" aria-hidden="true" />
      <img className="na-hero__art" src="/images/imagen_hero.png" alt="" aria-hidden="true" />

      <nav className="na-nav">
        <div className="na-nav__logo">
          <img src="/images/logo_1.png" alt="NeuroAudio" />
        </div>
        <ul className="na-nav__links">
          <li>Cómo funciona</li>
          <li>Profesionales</li>
          <li>Precios</li>
        </ul>
        <div className="na-nav__actions">
          <Link to="/login" className="na-login">
            Iniciar sesión
          </Link>
          <Link to="/login" className="na-btn-primary">
            Crear cuenta
          </Link>
        </div>
      </nav>

      <div className="na-hero__content">
        <h1 className="na-hero__title">
          Tus audios de bienestar,
          <br />
          <em>por fin en un solo lugar.</em>
        </h1>
        <p className="na-hero__lead">
          Guarda y organiza tus propios audios, o recibe los que tu profesional prepara para ti.
          Meditación, hipnosis, reprogramación... todo tuyo, sin anuncios.
        </p>
        <div className="na-hero__ctas">
          <Link to="/login" className="na-cta-primary">
            Crear mi cuenta
          </Link>
          <button type="button" className="na-cta-secondary">
            Soy profesional
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </button>
        </div>
        <div className="na-eyebrow">
          <span className="na-eyebrow__dot" />
          <span className="na-eyebrow__text">Disponible en web y móvil</span>
        </div>
        <div className="na-stats">
          <div className="na-stat">
            <div className="na-stat__value">Sin anuncios</div>
            <div className="na-stat__label">Nunca los tendrás</div>
          </div>
          <div className="na-stat">
            <div className="na-stat__value">Multiplataforma</div>
            <div className="na-stat__label">Móvil y ordenador</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
