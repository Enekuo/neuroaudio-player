function FloatingCards() {
  return (
    <div className="landing-hero__visual" aria-label="Vista previa del reproductor de audio">
      <div className="landing-hero__card landing-hero__card--main">
        <div className="landing-hero__art" />
        <div className="landing-hero__track-info">
          <p className="landing-hero__track-label">Audio recomendado</p>
          <h3>Sombras del alba</h3>
          <div className="landing-hero__wave" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="landing-hero__progress" />
        </div>
        <button className="landing-hero__play" type="button" aria-label="Reproducir audio">
          ▶
        </button>
      </div>

      <div className="landing-hero__card landing-hero__card--mini landing-hero__card--status">
        <span className="landing-hero__dot" />
        <div>
          <p>En reproducción</p>
          <strong>Respira profundo</strong>
        </div>
      </div>

      <div className="landing-hero__card landing-hero__card--mini landing-hero__card--track">
        <div className="landing-hero__mini-wave" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="landing-hero__pill landing-hero__pill--strong">12 min</span>
      </div>

      <div className="landing-hero__card landing-hero__card--mini landing-hero__card--time">
        <span className="landing-hero__pill">03:24</span>
      </div>
    </div>
  )
}

export default FloatingCards
