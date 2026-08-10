const brands = ['Luna', 'North', 'Aural', 'Mira']

function TrustedBar() {
  return (
    <section className="landing-trust" aria-label="Marcas de confianza">
      <p>Confían en una experiencia calmada y consistente</p>
      <div className="landing-trust__list">
        {brands.map((brand) => (
          <span key={brand} className="landing-trust__pill">
            {brand}
          </span>
        ))}
      </div>
    </section>
  )
}

export default TrustedBar
