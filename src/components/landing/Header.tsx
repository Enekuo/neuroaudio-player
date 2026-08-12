function Header() {
  return (
    <header className="landing-header">
      <div className="landing-header__left">
        <a className="landing-header__brand" href="/">
          NeuroAudio
        </a>
      </div>

      <nav className="landing-header__nav" aria-label="Navegación principal">
        <a href="#">Inicio</a>
        <a href="#planes">Planes</a>
        <a href="#">FAQ</a>
        <a href="#">Contacto</a>
      </nav>

      <div className="landing-header__actions">
        <a className="landing-header__button landing-header__button--ghost" href="/app">
          Iniciar sesión
        </a>
        <a className="landing-header__button landing-header__button--primary" href="/app">
          Prueba gratis
        </a>
      </div>
    </header>
  )
}

export default Header
