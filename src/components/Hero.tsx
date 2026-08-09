function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__content">
        <p className="hero__eyebrow">Bienestar mental y calma</p>
        <h1 id="hero-title">NeuroAudio</h1>
        <p className="hero__subtitle">
          Audios para reprogramar tu mente mientras descansas.
        </p>
        <button className="hero__button" type="button">
          Explorar audios
        </button>
      </div>
    </section>
  )
}

export default Hero
