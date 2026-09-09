import { Link } from 'react-router-dom'

function CrownGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 16h14l1.24-8.53a.62.62 0 0 0-1.03-.55l-3.4 3.19a.62.62 0 0 1-.94-.11L12.52 5a.62.62 0 0 0-1.04 0L9.13 10a.62.62 0 0 1-.94.11l-3.4-3.19a.62.62 0 0 0-1.03.55L5 16Z" />
      <path d="M5.2 18.6h13.6a1 1 0 0 0 0-2H5.2a1 1 0 0 0 0 2Z" />
    </svg>
  )
}

function PremiumPage() {
  return (
    <section className="page page--simple" aria-label="NeuroAudio Premium">
      <div className="premium-page">
        <header className="premium-page__header">
          <span className="premium-page__badge" aria-hidden="true">
            <CrownGlyph />
          </span>
          <h1 className="page__title">NeuroAudio Premium</h1>
          <p className="premium-page__subtitle">
            Desbloquea todo NeuroAudio: más audios sonando a la vez, descargas y funciones
            avanzadas.
          </p>
        </header>

        {/* Espacio preparado para los planes / precios (se rellenará más adelante). */}
        <div className="premium-page__plans" aria-label="Planes de suscripción">
          <p className="premium-page__plans-note">
            Los planes y precios estarán disponibles aquí muy pronto.
          </p>
        </div>

        <Link to="/app" className="premium-page__back">
          Volver al inicio
        </Link>
      </div>
    </section>
  )
}

export default PremiumPage
