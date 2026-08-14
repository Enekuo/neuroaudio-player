import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { signOutUser } from '../../auth/services/authService'
import ModalSubirAudio from './ModalSubirAudio'

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  async function handleSignOut() {
    await signOutUser()
  }

  return (
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
          <p className="library-sidebar__section-title">Listas</p>
          <p className="library-sidebar__empty">Sin listas todavía</p>
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
            <span className="library-sidebar__account-avatar" aria-hidden="true">
              {(user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="library-sidebar__account-name">
              {user?.displayName ?? user?.email ?? 'Mi cuenta'}
            </span>
          </div>
          <button type="button" className="library-sidebar__signout" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <ModalSubirAudio isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </aside>
  )
}

export default MenuLateral
