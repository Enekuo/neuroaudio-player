import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { signOutUser } from '../../auth/services/authService'
import UserAvatar from '../../auth/components/UserAvatar'
import { getTemplateById } from '../data/plantillasListas'
import { useUserListas } from '../hooks/useUserListas'
import ModalCrearLista from './ModalCrearLista'
import ModalSubirAudio from './ModalSubirAudio'
import TemplateIcon from './TemplateIcon'

const navigationItems = [
  {
    to: '/app',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5L12 4l9 7.5v8.5a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-8.5Z" />
      </svg>
    ),
  },
  {
    to: '/app/biblioteca',
    label: 'Mi biblioteca',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    to: '/app/explorar',
    label: 'Buscar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" />
      </svg>
    ),
  },
]

function MenuLateral() {
  const { user } = useAuth()
  const { listas } = useUserListas()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOutUser()
  }

  return (
    <>
      <aside className="library-sidebar" aria-label="Menú de biblioteca">
        <div className="library-sidebar__top">
          <div className="library-sidebar__brand">
            <span className="library-sidebar__brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6h10" />
                <path d="M6 12h10" />
                <path d="M6 18h6" />
              </svg>
            </span>
            <span>NeuroAudio</span>
          </div>

          <nav className="library-sidebar__nav">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                end
                className={({ isActive }) => `library-sidebar__link${isActive ? ' is-active' : ''}`}
                to={item.to}
              >
                <span className="library-sidebar__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="library-sidebar__section">
            <div className="library-sidebar__section-header">
              <p className="library-sidebar__section-title">Listas</p>
              <button
                type="button"
                className="library-sidebar__section-add"
                onClick={() => setIsCreateListModalOpen(true)}
                aria-label="Crear lista"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>

            {listas.length === 0 ? (
              <p className="library-sidebar__empty">Sin listas todavía</p>
            ) : (
              <ul className="library-sidebar__lists">
                {listas.map((lista) => {
                  const template = getTemplateById(lista.template)
                  return (
                    <li key={lista.id} className="library-sidebar__list-item">
                      <span
                        className="library-sidebar__list-icon"
                        style={{ background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.gradientTo})` }}
                        aria-hidden="true"
                      >
                        <TemplateIcon name={template.icon} />
                      </span>
                      <span className="library-sidebar__list-name">{lista.name}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="library-sidebar__footer">
          <button
            type="button"
            className="library-sidebar__add"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <span className="library-sidebar__add-icon" aria-hidden="true">
              +
            </span>
            Añadir audio
          </button>
          <div className="library-sidebar__account">
            <div className="library-sidebar__account-info">
              <UserAvatar user={user} className="library-sidebar__account-avatar" />
              <span className="library-sidebar__account-text">
                <span className="library-sidebar__account-name">
                  {user?.displayName ?? user?.email ?? 'Mi cuenta'}
                </span>
                {user?.email ? <span className="library-sidebar__account-email">{user.email}</span> : null}
              </span>
            </div>
            <button type="button" className="library-sidebar__signout" onClick={handleSignOut}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <header className="mobile-topbar">
        <div className="mobile-topbar__brand">
          <span className="mobile-topbar__brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6h10" />
              <path d="M6 12h10" />
              <path d="M6 18h6" />
            </svg>
          </span>
          <span>NeuroAudio</span>
        </div>

        <div className="mobile-topbar__actions">
          <button
            type="button"
            className="mobile-topbar__add"
            onClick={() => setIsUploadModalOpen(true)}
            aria-label="Añadir audio"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>

          <div className="mobile-topbar__account">
            <button
              type="button"
              className="mobile-topbar__avatar-button"
              onClick={() => setIsAccountMenuOpen((value) => !value)}
              aria-haspopup="true"
              aria-expanded={isAccountMenuOpen}
              aria-label="Cuenta"
            >
              <UserAvatar user={user} className="mobile-topbar__avatar" />
            </button>

            {isAccountMenuOpen ? (
              <div className="mobile-topbar__menu" role="menu">
                <p className="mobile-topbar__menu-name">{user?.displayName ?? user?.email ?? 'Mi cuenta'}</p>
                {user?.email ? <p className="mobile-topbar__menu-email">{user.email}</p> : null}
                <button
                  type="button"
                  className="mobile-topbar__menu-signout"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            end
            className={({ isActive }) => `bottom-nav__link${isActive ? ' is-active' : ''}`}
            to={item.to}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <ModalCrearLista isOpen={isCreateListModalOpen} onClose={() => setIsCreateListModalOpen(false)} />
    </>
  )
}

export default MenuLateral
