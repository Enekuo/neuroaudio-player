function BarraReproductor() {
  return (
    <footer className="library-player-bar">
      <div className="library-player-bar__track">
        <div className="library-player-bar__thumb" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4" />
            <path d="M8 8h3v8H8z" />
            <path d="M13 6h3a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-3" />
          </svg>
        </div>
        <div>
          <h4>Meditación guiada para soltar el día</h4>
          <p>Para dormir</p>
        </div>
      </div>

      <div className="library-player-bar__controls" aria-label="Controles de reproducción">
        <button type="button" aria-label="Anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 7L5 12l6 5" />
            <path d="M19 7v10" />
          </svg>
        </button>
        <button type="button" aria-label="Play/Pausa" className="is-primary">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6.5v11l9-5.5-9-5.5z" />
          </svg>
        </button>
        <button type="button" aria-label="Siguiente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 7l6 5-6 5" />
            <path d="M5 7v10" />
          </svg>
        </button>
      </div>

      <button type="button" className="library-player-bar__timer" aria-label="Temporizador">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
    </footer>
  )
}

export default BarraReproductor
