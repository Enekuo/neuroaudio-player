const steps = [
  {
    id: 1,
    title: 'Añade tu primer audio',
    description: 'Desde YouTube, un archivo o un enlace.',
    active: true,
  },
  {
    id: 2,
    title: 'Crea una lista',
    description: 'Agrupa tus audios como quieras: dormir, ansiedad…',
    active: false,
  },
  {
    id: 3,
    title: 'Reprodúcelo a tu manera',
    description: 'Sin anuncios, y programa cuándo empieza.',
    active: false,
  },
]

function DashboardHome() {
  return (
    <section className="dashboard-home-page" aria-label="Inicio de NeuroAudio">
      <div className="dashboard-home-page__content">
        <header className="dashboard-home-page__header">
          <h1>Inicio</h1>

          <div className="dashboard-home-page__header-actions">
            <div className="dashboard-home-page__avatar" aria-label="Avatar de usuario">
              AG
            </div>
          </div>
        </header>

        <div className="dashboard-home-page__welcome-card">
          <h2>Bienvenido a NeuroAudio</h2>
          <p>
            Tu espacio para guardar y organizar tus audios de bienestar. Empieza en tres
            pasos.
          </p>
        </div>

        <section className="dashboard-home-page__section" aria-labelledby="dashboard-steps-title">
          <p className="dashboard-home-page__section-label">PRIMEROS PASOS</p>
          <div className="dashboard-home-page__steps">
            {steps.map((step) => (
              <article
                key={step.id}
                className={`dashboard-step-card ${step.active ? 'is-active' : 'is-muted'}`}
              >
                <div className="dashboard-step-card__marker" aria-hidden="true">
                  <span>{step.id}</span>
                </div>
                <div className="dashboard-step-card__body">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {step.active ? (
                  <button type="button" className="dashboard-step-card__button">
                    <span aria-hidden="true" className="dashboard-step-card__button-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </span>
                    Añadir
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-home-page__section" aria-labelledby="dashboard-lists-title">
          <p className="dashboard-home-page__section-label">TUS LISTAS</p>
          <div className="dashboard-empty-lists-panel">
            <div className="dashboard-empty-lists-panel__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <div>
              <h3>Aún no tienes listas</h3>
              <p>Crea la primera cuando añadas un audio.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

export default DashboardHome
