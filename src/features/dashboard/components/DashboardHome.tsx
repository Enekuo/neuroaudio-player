import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import type { LibraryFolder } from '../../library/data/plantillasListas'
import { useLibraryFolders } from '../../library/hooks/useLibraryFolders'
import { useUserAudios } from '../../library/hooks/useUserAudios'
import { useUserListas } from '../../library/hooks/useUserListas'
import { anadirAudioALista, eliminarLista, quitarAudioDeLista, renombrarLista } from '../../library/services/listaService'
import ModalCrearLista from '../../library/components/ModalCrearLista'
import ModalSubirAudio from '../../library/components/ModalSubirAudio'
import PanelAnadirAudios from '../../library/components/PanelAnadirAudios'
import TemplateGrid from '../../library/components/TemplateGrid'

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

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="12" rx="1.5" />
      <path d="M3 13h18" />
      <path d="M12 9v12" />
      <path d="M12 9c-1.5-3.5-4-5-5.5-3.7C5 6.6 5.7 9 12 9Z" />
      <path d="M12 9c1.5-3.5 4-5 5.5-3.7C19 6.6 18.3 9 12 9Z" />
    </svg>
  )
}

const filterPills = [
  { id: 'inicio', label: 'Inicio', to: '/app' },
  { id: 'listas', label: 'Listas', to: '/app/biblioteca?tab=listas' },
  { id: 'audios', label: 'Audios', to: '/app/biblioteca?tab=general' },
  { id: 'favoritos', label: 'Favoritos', to: '/app/favoritos' },
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
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const { listas } = useUserListas()
  const { audios } = useUserAudios()
  const { folders } = useLibraryFolders()
  const [isInviteBannerVisible, setIsInviteBannerVisible] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState(filterPills[0].id)
  const [openFolderKey, setOpenFolderKey] = useState<string | null>(null)
  const [listaActionError, setListaActionError] = useState<string | null>(null)

  const openFolder = folders.find((folder) => folder.key === openFolderKey) ?? null

  function handleToggleFolder(folder: LibraryFolder) {
    setListaActionError(null)
    setOpenFolderKey((current) => (current === folder.key ? null : folder.key))
  }

  function handleCloseFolder() {
    setListaActionError(null)
    setOpenFolderKey(null)
  }

  async function handleToggleAudioEnLista(folder: LibraryFolder, audioId: string, incluir: boolean) {
    if (!user) {
      return
    }

    setListaActionError(null)

    try {
      if (incluir) {
        await anadirAudioALista(folder.listaId, audioId, {
          uid: user.uid,
          name: folder.name,
          template: folder.template,
        })
      } else {
        await quitarAudioDeLista(folder.listaId, audioId)
      }
    } catch {
      setListaActionError('No se pudo actualizar la lista. Inténtalo de nuevo.')
    }
  }

  async function handleRenameLista(folder: LibraryFolder) {
    const newName = window.prompt('Nuevo nombre de la lista', folder.name)?.trim()

    if (!newName || newName === folder.name) {
      return
    }

    setListaActionError(null)

    try {
      await renombrarLista(folder.listaId, newName)
    } catch {
      setListaActionError('No se pudo renombrar la lista. Inténtalo de nuevo.')
    }
  }

  async function handleDeleteLista(folder: LibraryFolder) {
    const confirmed = window.confirm(`¿Eliminar la lista "${folder.name}"? Esta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

    setListaActionError(null)

    try {
      await eliminarLista(folder.listaId)
      if (openFolderKey === folder.key) {
        setOpenFolderKey(null)
      }
    } catch {
      setListaActionError('No se pudo eliminar la lista. Inténtalo de nuevo.')
    }
  }

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

        {isInviteBannerVisible ? (
          <div className="dashboard-invite-banner">
            <span className="dashboard-invite-banner__icon" aria-hidden="true">
              <GiftIcon />
            </span>

            <div className="dashboard-invite-banner__text">
              <p className="dashboard-invite-banner__title">Invita a un amigo y consigue 2 meses gratis</p>
              <p className="dashboard-invite-banner__subtitle">
                Cuando tu amigo se suscriba por primera vez, tú ganas 2 meses de NeuroAudio gratis.
              </p>
            </div>

            <div className="dashboard-invite-banner__actions">
              <button type="button" className="dashboard-invite-banner__invite">
                Invitar
              </button>
              <button
                type="button"
                className="dashboard-invite-banner__close"
                onClick={() => setIsInviteBannerVisible(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}

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
              onClick={() => {
                setActiveFilter(pill.id)
                if (pill.id !== 'inicio') {
                  navigate(pill.to)
                }
              }}
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

        <section
          className="dashboard-home-page__section dashboard-home-page__lists-section"
          aria-labelledby="dashboard-lists-title"
        >
          <p className="dashboard-home-page__section-label" id="dashboard-lists-title">
            TUS LISTAS
          </p>

          <div className="library-templates-intro">
            {openFolder ? (
              <PanelAnadirAudios
                folder={openFolder}
                audios={audios}
                error={listaActionError}
                onToggleAudio={(audioId, incluir) => handleToggleAudioEnLista(openFolder, audioId, incluir)}
                onClose={handleCloseFolder}
                onRename={openFolder.isCustom ? () => handleRenameLista(openFolder) : undefined}
                onDelete={openFolder.isCustom ? () => handleDeleteLista(openFolder) : undefined}
              />
            ) : null}

            <TemplateGrid
              folders={folders}
              activeKey={openFolderKey}
              onOpen={handleToggleFolder}
              onCreateCustom={() => setIsCreateListModalOpen(true)}
            />
          </div>
        </section>
      </div>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ModalCrearLista isOpen={isCreateListModalOpen} onClose={() => setIsCreateListModalOpen(false)} />
    </section>
  )
}

export default DashboardHome
