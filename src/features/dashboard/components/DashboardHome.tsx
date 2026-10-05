import { useEffect, useState, type AnimationEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { useUserAudios, type LibraryAudio } from '../../library/hooks/useUserAudios'
import { useUserListas } from '../../library/hooks/useUserListas'
import { deleteAudio } from '../../library/services/audioService'
import { alternarFavorito } from '../../library/services/favoritoService'
import BuscadorAudios from '../../library/components/BuscadorAudios'
import FilaAudio from '../../library/components/FilaAudio'
import MenuCuentaMovil from '../../library/components/MenuCuentaMovil'
import ModalCrearLista from '../../library/components/ModalCrearLista'
import ModalSubirAudio from '../../library/components/ModalSubirAudio'
import { usePlayer } from '../../player/context/PlayerContext'

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

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 16h14l1.24-8.53a.62.62 0 0 0-1.03-.55l-3.4 3.19a.62.62 0 0 1-.94-.11L12.52 5a.62.62 0 0 0-1.04 0L9.13 10a.62.62 0 0 1-.94.11l-3.4-3.19a.62.62 0 0 0-1.03.55L5 16Z" />
      <path d="M5.2 18.6h13.6a1 1 0 0 0 0-2H5.2a1 1 0 0 0 0 2Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  )
}

const filterPills = [
  { id: 'inicio', label: 'Inicio', to: '/app' },
  { id: 'listas', label: 'Listas', to: '/app/biblioteca?tab=listas' },
  { id: 'audios', label: 'Audios', to: '/app/biblioteca?tab=general' },
  { id: 'favoritos', label: 'Favoritos', to: '/app/favoritos' },
]

// Saludo según la hora local del dispositivo (navegador):
// 6:00–11:59 → días · 12:00–19:59 → tardes · 20:00–5:59 → noches
function getSaludoPorHora(): string {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 12) {
    return 'Buenos días'
  }
  if (hora >= 12 && hora < 20) {
    return 'Buenas tardes'
  }
  return 'Buenas noches'
}

// Alturas (px, sobre 96) de las barras de la onda decorativa de la tarjeta de
// bienvenida: una envolvente suave que crece hacia la derecha, como un audio
// que empieza a sonar.
// PRUEBA: fuerza la tarjeta de bienvenida aunque el usuario tenga audios.
// Poner a false para volver a la regla normal (solo usuarios sin audios).
const MOSTRAR_BIENVENIDA_SIEMPRE = true

const WELCOME_WAVE_BARS = Array.from({ length: 28 }, (_, index) => {
  const envelope = 0.25 + 0.75 * (index / 27)
  const ripple = 0.55 + 0.45 * Math.abs(Math.sin(index * 0.9) * Math.cos(index * 0.37))
  return Math.round(Math.max(8, 92 * envelope * ripple))
})

const steps = [
  {
    id: 1,
    title: 'Añadir audio',
    description: 'Sube un archivo de audio',
    active: true,
    buttonLabel: 'Añadir',
    action: 'upload' as const,
  },
  {
    id: 2,
    title: 'Crear lista',
    description: 'Organiza tus audios en listas',
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
  const { audios, isLoading: isLoadingAudios } = useUserAudios()
  const { currentTrack, isPlaying, playTrack } = usePlayer()
  const [isInviteBannerVisible, setIsInviteBannerVisible] = useState(true)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState(filterPills[0].id)
  const [deletingAudioId, setDeletingAudioId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  function handlePlayAudio(audio: LibraryAudio) {
    playTrack(audio, audios)
  }

  async function handleDeleteAudio(audio: LibraryAudio) {
    const confirmed = window.confirm(
      `¿Eliminar el audio "${audio.name}"? Esta acción no se puede deshacer.`,
    )

    if (!confirmed) {
      return
    }

    setDeletingAudioId(audio.id)

    try {
      await deleteAudio(audio)
    } finally {
      setDeletingAudioId(null)
    }
  }

  const greetingName = profile?.displayNamePref?.trim() || user?.displayName?.split(' ')[0] || null
  const saludo = getSaludoPorHora()
  const heroImageSrc =
    profile?.avatarGender === 'female' ? '/images/woman_listening.png' : '/images/man_listening.png'

  const totalFavoritos = audios.filter((audio) => audio.isFavorite).length
  const mostrarBienvenida = MOSTRAR_BIENVENIDA_SIEMPRE || (!isLoadingAudios && audios.length === 0)

  // Ciclo de vida visual de la bienvenida: al subir el primer audio no
  // desaparece de golpe, sale con una animación ('leaving') y solo después
  // se desmonta y entra "Añade contenido" en su sitio.
  const [welcomeState, setWelcomeState] = useState<'shown' | 'leaving' | 'hidden'>(
    mostrarBienvenida ? 'shown' : 'hidden',
  )

  useEffect(() => {
    if (mostrarBienvenida) {
      setWelcomeState('shown')
    } else {
      setWelcomeState((previous) => (previous === 'shown' ? 'leaving' : 'hidden'))
    }
  }, [mostrarBienvenida])

  function handleWelcomeAnimationEnd(event: AnimationEvent<HTMLElement>) {
    if (event.target === event.currentTarget && welcomeState === 'leaving') {
      setWelcomeState('hidden')
    }
  }

  // Audios recientes (máx. 4): primero los reproducidos, del último al más
  // antiguo. Los huecos libres se rellenan con audios aún sin reproducir en
  // orden de llegada (el más antiguo primero): así un audio que ya ocupa un
  // hueco conserva su sitio, y uno recién añadido solo entra si queda hueco.
  // Si la lista ya está llena, el audio nuevo se guarda solo en la biblioteca.
  const audiosRecientes = [
    ...audios
      .filter((audio) => audio.lastPlayedAt !== null)
      .sort((a, b) => (b.lastPlayedAt?.getTime() ?? 0) - (a.lastPlayedAt?.getTime() ?? 0)),
    ...audios
      .filter((audio) => audio.lastPlayedAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  ].slice(0, 4)

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
          {/* Solo móvil: fila del título con "NeuroAudio" a la izquierda y los
              botones (corona Premium + cuenta) a la misma altura, a la derecha.
              En escritorio esta fila se oculta (la cuenta está en la barra
              lateral). */}
          <div className="dashboard-home-page__title-row">
            <span className="dashboard-home-page__brand">NeuroAudio</span>
            <div className="dashboard-home-page__header-actions">
              <button
                type="button"
                className={`dashboard-home-page__search-btn${isSearchOpen ? ' is-active' : ''}`}
                onClick={() => setIsSearchOpen(true)}
                aria-label="Buscar audios"
                aria-haspopup="dialog"
                aria-expanded={isSearchOpen}
              >
                <SearchIcon />
              </button>
              <Link
                to="/app/premium"
                className="dashboard-home-page__premium"
                aria-label="NeuroAudio Premium"
              >
                <CrownIcon />
              </Link>
              <MenuCuentaMovil />
            </div>
          </div>

          <h1>
            {greetingName ? (
              <>
                <span className="dashboard-home-page__greeting-desktop">
                  Bienvenido, <span className="dashboard-home-page__greeting-name">{greetingName}</span>
                </span>
                <span className="dashboard-home-page__greeting-mobile">
                  {saludo}, <span className="dashboard-home-page__greeting-name">{greetingName}</span>
                </span>
              </>
            ) : (
              <>
                <span className="dashboard-home-page__greeting-desktop">Bienvenido a NeuroAudio</span>
                <span className="dashboard-home-page__greeting-mobile">{saludo}, usuario</span>
              </>
            )}
          </h1>
          <img
            src={heroImageSrc}
            alt=""
            aria-hidden="true"
            className="dashboard-home-page__hero-image"
          />
        </header>

        <div className="dashboard-promo-carousel">
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

          <article className="dashboard-discover-card" aria-label="Conoce a profesionales">
            <div className="dashboard-discover-card__body">
              <h3 className="dashboard-discover-card__title">Conoce a profesionales</h3>
              <p className="dashboard-discover-card__subtitle">
                Profesionales que trabajan con NeuroAudio en su día a día.
              </p>
            </div>
            <img
              src="/images/woman_listening.png"
              alt=""
              aria-hidden="true"
              className="dashboard-discover-card__image"
            />
          </article>
        </div>

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

        {/* Bienvenida: solo para usuarios nuevos, sin ningún audio. Va en el
            sitio de "Añade contenido" y lo sustituye mientras se muestra. Se
            espera a que termine la carga para no mostrarla un instante a quien
            sí tiene audios; en cuanto sube el primero, desaparece sola. */}
        {welcomeState !== 'hidden' ? (
          <section
            className={`welcome-card${welcomeState === 'leaving' ? ' is-leaving' : ''}`}
            aria-labelledby="welcome-card-title"
            onAnimationEnd={handleWelcomeAnimationEnd}
          >
            <svg className="welcome-card__wave" viewBox="0 0 280 96" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
              {WELCOME_WAVE_BARS.map((height, index) => (
                <rect
                  key={index}
                  className="welcome-card__wave-bar"
                  x={index * 10}
                  y={96 - height}
                  width="4"
                  height={height}
                  rx="2"
                  style={{ animationDelay: `${160 + index * 22}ms` }}
                />
              ))}
            </svg>

            <span className="welcome-card__badge">
              <span className="welcome-card__badge-dot" aria-hidden="true" />
              Bienvenido a NeuroAudio
            </span>
            <h2 className="welcome-card__title" id="welcome-card-title">
              Añade tu primer audio
            </h2>
            <p className="welcome-card__text">Sube un archivo de audio y empieza tu primera sesión.</p>
            <button type="button" className="welcome-card__button" onClick={() => setIsUploadModalOpen(true)}>
              Añadir audio
            </button>
          </section>
        ) : null}

        {welcomeState !== 'hidden' ? null : (
          <section className="dashboard-home-page__section" aria-labelledby="dashboard-steps-title">
            <h2 className="dashboard-home-page__section-heading" id="dashboard-steps-title">
              Añade contenido
            </h2>
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
        )}

        {audiosRecientes.length > 0 ? (
          <section
            className="dashboard-home-page__section dashboard-home-page__lists-section"
            aria-labelledby="dashboard-audios-title"
          >
            <h2 className="dashboard-home-page__section-heading" id="dashboard-audios-title">
              Audios recientes
            </h2>

            <div className="library-section__list library-section__list--plana">
              {audiosRecientes.map((audio) => (
                <FilaAudio
                  key={audio.id}
                  name={audio.name}
                  duration={audio.duration}
                  isDeleting={deletingAudioId === audio.id}
                  isPlaying={isPlaying && currentTrack?.id === audio.id}
                  onPlay={() => handlePlayAudio(audio)}
                  isFavorite={audio.isFavorite}
                  onDelete={() => handleDeleteAudio(audio)}
                  onToggleFavorite={() => alternarFavorito(audio)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <BuscadorAudios
        audios={audios}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ModalCrearLista isOpen={isCreateListModalOpen} onClose={() => setIsCreateListModalOpen(false)} />
    </section>
  )
}

export default DashboardHome
