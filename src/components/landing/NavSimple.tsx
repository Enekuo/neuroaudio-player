import { Link } from 'react-router-dom'

/**
 * Menú de las páginas secundarias de la landing (/legal/*, /contacto): el
 * logo vuelve a la portada y, a la derecha, «Iniciar sesión» y «Crear cuenta».
 */
function NavSimple() {
  return (
    <nav className="na-nav">
      <Link to="/" className="na-nav__logo" aria-label="NeuroAudio, inicio">
        <img src="/images/logo_1.png" alt="NeuroAudio" />
      </Link>
      <div className="na-nav__actions">
        <Link to="/login" className="na-login">
          Iniciar sesión
        </Link>
        <Link to="/login" className="na-btn-primary">
          Crear cuenta
        </Link>
      </div>
    </nav>
  )
}

export default NavSimple
