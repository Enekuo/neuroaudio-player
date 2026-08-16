import { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { getTemplateById } from '../../library/data/plantillasListas'
import { useUserListas } from '../../library/hooks/useUserListas'
import ModalCrearLista from '../../library/components/ModalCrearLista'
import ModalSubirAudio from '../../library/components/ModalSubirAudio'
import TemplateIcon from '../../library/components/TemplateIcon'

const steps = [
  {
    id: 1,
    title: 'Añade tu primer audio',
    description: 'Desde YouTube, un archivo o un enlace.',
    active: true,
    buttonLabel: 'Añadir',
    action: 'upload' as const,
  },
  {
    id: 2,
    title: 'Crea una lista',
    description: 'Agrupa tus audios como quieras: dormir, ansiedad…',
    active: true,
    buttonLabel: 'Crear lista',
    action: 'create-list' as const,
  },
  {
    id: 3,
    title: 'Reprodúcelo a tu manera',
    description: 'Sin anuncios, y programa cuándo empieza.',
    active: false,
  },
]

function DashboardHome() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const { listas } = useUserListas()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)

  const greetingName = profile?.displayNamePref?.trim() || user?.displayName?.split(' ')[0] || null

  return (
    <section className="dashboard-home-page" aria-label="Inicio de NeuroAudio">
      <div className="dashboard-home-page__content">
        <header className="dashboard-home-page__header">
          <h1>Inicio</h1>

          <div className="dashboard-home-page__header-actions">
            <UserAvatar user={user} className="dashboard-home-page__avatar" />
          </div>
        </header>

        <div className="dashboard-home-page__welcome-card">
          <h2>{greetingName ? `Hola, ${greetingName}` : 'Bienvenido a NeuroAudio'}</h2>
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
                  <button
                    type="button"
                    className="dashboard-step-card__button"
                    onClick={() =>
                      step.action === 'upload' ? setIsUploadModalOpen(true) : setIsCreateListModalOpen(true)
                    }
                  >
                    <span aria-hidden="true" className="dashboard-step-card__button-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </span>
                    {step.buttonLabel}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-home-page__section" aria-labelledby="dashboard-lists-title">
          <p className="dashboard-home-page__section-label">TUS LISTAS</p>
          {listas.length === 0 ? (
            <button
              type="button"
              className="dashboard-empty-lists-panel"
              onClick={() => setIsCreateListModalOpen(true)}
            >
              <div className="dashboard-empty-lists-panel__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
              <div>
                <h3>Aún no tienes listas</h3>
                <p>Crea la primera para empezar a organizar tus audios.</p>
              </div>
            </button>
          ) : (
            <div className="dashboard-home-page__lists-grid">
              {listas.map((lista) => {
                const template = getTemplateById(lista.template)
                return (
                  <div
                    key={lista.id}
                    className="dashboard-list-card"
                    style={{ background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.gradientTo})` }}
                  >
                    <span className="dashboard-list-card__icon" aria-hidden="true">
                      <TemplateIcon name={template.icon} />
                    </span>
                    <span className="dashboard-list-card__name">{lista.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ModalCrearLista isOpen={isCreateListModalOpen} onClose={() => setIsCreateListModalOpen(false)} />
    </section>
  )
}

export default DashboardHome
