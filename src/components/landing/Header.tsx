import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="landing-header">
      <div className="landing-header__left">
        <Link className="landing-header__brand" to="/">
          NeuroAudio
        </Link>
      </div>

      <nav className="landing-header__nav" aria-label="Navegación principal">
        <a href="#">Inicio</a>
        <a href="#planes">Planes</a>
        <a href="#">FAQ</a>
        <a href="#">Contacto</a>
      </nav>

      <div className="landing-header__actions">
        <Link className="landing-header__button landing-header__button--ghost" to="/login">
          Iniciar sesión
        </Link>
        <Link className="landing-header__button landing-header__button--primary" to="/login">
          Prueba gratis
        </Link>
      </div>
    </header>
  )
}

export default Header
