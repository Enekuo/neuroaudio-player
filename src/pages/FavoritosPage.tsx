function FavoritosPage() {
  return (
    <section className="page page--simple" aria-label="Favoritos">
      <div className="favorites-page">
        <h1 className="page__title">Favoritos</h1>

        <div className="library-empty-state" role="status">
          <div className="library-empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2>Aún no tienes favoritos</h2>
          <p>Marca los audios que más te gusten para encontrarlos aquí rápidamente.</p>
        </div>
      </div>
    </section>
  )
}

export default FavoritosPage
