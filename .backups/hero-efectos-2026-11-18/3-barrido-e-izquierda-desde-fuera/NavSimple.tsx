import { Link } from 'react-router-dom'

/**
 * Menú de las páginas secundarias de la landing (/legal/*, /contacto): el
 * logo vuelve a la portada y, a la derecha, «Iniciar sesión» y «Empezar gratis».
 * Con `claro`, el logo para fondo claro (letras oscuras).
 */
function NavSimple({ claro = false }: { claro?: boolean }) {
  return (
    <nav className="na-nav">
      <Link to="/" className="na-nav__logo" aria-label="NeuroAudio, inicio">
        <img
          src={claro ? '/images/logo_claro.png' : '/images/logo_1.png'}
          alt="NeuroAudio"
        />
      </Link>
      <div className="na-nav__actions">
        <Link to="/login" className="na-login">
          Iniciar sesión
        </Link>
        <Link to="/login" className="na-btn-primary">
          Empezar gratis
        </Link>
      </div>
    </nav>
  )
}

export default NavSimple
