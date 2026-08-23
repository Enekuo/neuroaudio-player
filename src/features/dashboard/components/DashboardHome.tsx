import { useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { getTemplateById } from '../../library/data/plantillasListas'
import { useUserAudios } from '../../library/hooks/useUserAudios'
import { useUserListas } from '../../library/hooks/useUserListas'
import ModalCrearLista from '../../library/components/ModalCrearLista'
import ModalSubirAudio from '../../library/components/ModalSubirAudio'
import TemplateIcon from '../../library/components/TemplateIcon'

function AudioStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </svg>
  )
}

function ListasStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h12" />
      <path d="M6 12h12" />
      <path d="M6 18h7" />
    </svg>
  )
}

function FavoritosStatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

const filterPills = [
  { id: 'general', label: 'General' },
  { id: 'audios', label: 'Audios' },
  { id: 'listas', label: 'Listas' },
  { id: 'favoritos', label: 'Favoritos' },
]

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
]

function DashboardHome() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const { listas } = useUserListas()
  const { audios } = useUserAudios()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState(filterPills[0].id)

  const greetingName = profile?.displayNamePref?.trim() || user?.displayName?.split(' ')[0] || null
  const heroImageSrc =
    profile?.avatarGender === 'female' ? '/images/woman_listening.png' : '/images/man_listening.png'

  // TODO: no hay ningún contador de favoritos en Firestore todavía.
  // Cuando exista, sustituir este 0 por el dato real (p. ej. useUserFavoritos().totalFavoritos).
  const totalFavoritos = 0

  const statCards = [
    {
      id: 'audios',
      icon: <AudioStatIcon />,
      color: '#2680EB',
      value: audios.length,
      label: 'Audios',
    },
    {
      id: 'listas',
      icon: <ListasStatIcon />,
      color: '#2E9E5B',
      value: listas.length,
      label: 'Listas',
    },
    {
      id: 'favoritos',
      icon: <FavoritosStatIcon />,
      color: '#7C5CD6',
      value: totalFavoritos,
      label: 'Favoritos',
    },
  ]

  return (
    <section className="dashboard-home-page" aria-label="Inicio de NeuroAudio">
      <div className="dashboard-home-page__content">
        <div className="dashboard-home-page__topbar">
          <button type="button" className="dashboard-home-page__menu-button" aria-label="Menú">
            <MenuIcon />
          </button>

          <div className="dashboard-home-page__topbar-actions">
            <UserAvatar user={user} className="dashboard-home-page__topbar-avatar" forceInitial />
          </div>
        </div>

        <header className="dashboard-home-page__header">
          <h1>
            {greetingName ? (
              <>
                Bienvenido, <span className="dashboard-home-page__greeting-name">{greetingName}</span>
              </>
            ) : (
              'Bienvenido a NeuroAudio'
            )}
          </h1>
          <img
            src={heroImageSrc}
            alt=""
            aria-hidden="true"
            className="dashboard-home-page__hero-image"
          />
        </header>

        <div className="dashboard-home-page__stats">
          {statCards.map((stat) => (
            <div key={stat.id} className="dashboard-stat-card">
              <div className="dashboard-stat-card__top">
                <span className="dashboard-stat-card__icon" style={{ background: stat.color }} aria-hidden="true">
                  {stat.icon}
                </span>
                <div className="dashboard-stat-card__numbers">
                  <span className="dashboard-stat-card__value">{stat.value}</span>
                  <span className="dashboard-stat-card__label">{stat.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-home-page__filters">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`dashboard-home-page__filter-pill${activeFilter === pill.id ? ' is-active' : ''}`}
              onClick={() => setActiveFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
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
