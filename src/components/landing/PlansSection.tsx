const plans = [
  {
    name: 'Gratis',
    price: '0€',
    description: 'Perfecto para descubrir la experiencia.',
    features: ['Acceso a audios básicos', 'Sesiones limitadas', 'Soporte por email'],
    featured: false,
  },
  {
    name: 'Premium',
    price: '12€ / mes',
    description: 'La experiencia completa para tu rutina diaria.',
    features: ['Catalogo completo', 'Sesiones ilimitadas', 'Descarga offline'],
    featured: true,
  },
  {
    name: 'Anual',
    price: '99€ / año',
    description: 'Ideal si quieres una práctica constante y estable.',
    features: ['Todo lo de Premium', 'Descuento anual', 'Prioridad de soporte'],
    featured: false,
  },
]

function PlansSection() {
  return (
    <section className="landing-plans" id="planes" aria-label="Planes de NeuroAudio">
      <div className="landing-plans__header">
        <p className="landing-hero__eyebrow">Planes</p>
        <h2>Elige el ritmo que mejor te acompaña.</h2>
        <p className="landing-plans__intro">
          Diseñados para acompañarte con calma, de forma simple y elegante.
        </p>
        <a className="landing-plans__anchor" href="#planes">
          Ver planes
        </a>
      </div>
      <div className="landing-plans__grid">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`landing-plans__card${plan.featured ? ' is-featured' : ''}`}
          >
            <div className="landing-plans__card-top">
              <h3>{plan.name}</h3>
              {plan.featured ? <span className="landing-plans__badge">Más popular</span> : null}
            </div>
            <p className="landing-plans__price">{plan.price}</p>
            <p className="landing-plans__description">{plan.description}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button className="landing-plans__button" type="button">
              Elegir {plan.name}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PlansSection
