function AudiosConjuntosPage() {
  return (
    <section className="page page--simple" aria-label="Audios conjuntos">
      <div className="favorites-page">
        <h1 className="page__title">Audios conjuntos</h1>

        <div className="library-empty-state" role="status">
          <div className="library-empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 8.5 12 14l10-5.5L12 3Z" />
              <path d="m2 15.5 10 5.5 10-5.5" />
              <path d="m2 12 10 5.5L22 12" />
            </svg>
          </div>
          <h2>Aún no tienes audios conjuntos</h2>
          <p>Pronto podrás combinar varios audios para reproducirlos a la vez.</p>
        </div>
      </div>
    </section>
  )
}

export default AudiosConjuntosPage
