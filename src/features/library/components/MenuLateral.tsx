import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { signOutUser } from '../../auth/services/authService'
import UserAvatar from '../../auth/components/UserAvatar'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import ModalAjustes from '../../settings/components/ModalAjustes'
import SettingsIcon from '../../settings/components/SettingsIcon'
import { CUSTOM_TEMPLATE_ID, getTemplateById } from '../data/plantillasListas'
import { useUserListas } from '../hooks/useUserListas'
import ModalCrearLista from './ModalCrearLista'
import ModalSubirAudio from './ModalSubirAudio'
import TemplateIcon from './TemplateIcon'

const navigationItems = [
  {
    to: '/app',
    label: 'Inicio',
    icon: (
      <svg className="icon-fill-active" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5L12 4l9 7.5v8.5a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-8.5Z" />
      </svg>
    ),
  },
  {
    to: '/app/biblioteca',
    label: 'Biblioteca',
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
    to: '/app/favoritos',
    label: 'Favoritos',
    icon: (
      <svg className="icon-fill-active" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    to: '/app/habitos',
    label: 'Hábitos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6h11" />
        <path d="M9 12h11" />
        <path d="M9 18h11" />
        <path d="m3.5 6 1.2 1.2L7 5" />
        <path d="m3.5 12 1.2 1.2L7 11" />
        <path d="m3.5 18 1.2 1.2L7 17" />
      </svg>
    ),
  },
]

function MenuLateral() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const { listas } = useUserListas()
  const displayName = profile?.displayNamePref?.trim() || user?.displayName || user?.email || 'Mi cuenta'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const sidebarAccountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (!sidebarAccountRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAccountMenuOpen])

  async function handleSignOut() {
    await signOutUser()
  }

  function handleOpenSettings() {
    setIsAccountMenuOpen(false)
    setIsSettingsModalOpen(true)
  }

  return (
    <>
      <aside className="library-sidebar" aria-label="Menú de biblioteca">
        <div className="library-sidebar__top">
          <div className="library-sidebar__brand">
            <img src="/images/logo_1.png" alt="NeuroAudio" className="library-sidebar__brand-logo" />
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
                  // Categorías fijas: la etiqueta visible viene de la plantilla (así "Ansiedad" -> "Visualización"
                  // sin tocar el id ni el nombre guardado). Listas personalizadas: el nombre elegido por el usuario.
                  const listaLabel = template.id === CUSTOM_TEMPLATE_ID ? lista.name : template.label
                  return (
                    <li key={lista.id} className="library-sidebar__list-item">
                      <span className="library-sidebar__list-icon" aria-hidden="true">
                        {template.cardImage ? (
                          <span
                            className="library-sidebar__list-icon-img"
                            style={{ backgroundImage: `url(${template.cardImage})` }}
                          />
                        ) : (
                          <TemplateIcon name={template.icon} />
                        )}
                      </span>
                      <span className="library-sidebar__list-name">{listaLabel}</span>
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
          <div className="library-sidebar__account" ref={sidebarAccountRef}>
            <button
              type="button"
              className="library-sidebar__account-trigger"
              onClick={() => setIsAccountMenuOpen((value) => !value)}
              aria-haspopup="true"
              aria-expanded={isAccountMenuOpen}
            >
              <UserAvatar user={user} className="library-sidebar__account-avatar" />
              <span className="library-sidebar__account-name">{displayName}</span>
            </button>

            {isAccountMenuOpen ? (
              <div className="library-sidebar__account-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="library-sidebar__account-menu-item"
                  onClick={handleOpenSettings}
                >
                  <SettingsIcon name="settings" />
                  Ajustes
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="library-sidebar__account-menu-item"
                  onClick={handleSignOut}
                >
                  <SettingsIcon name="logout" />
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      {/* El icono de cuenta móvil solo aparece en Inicio, y lo pinta DashboardHome
          dentro de su cabecera. El resto de páginas no lo llevan. */}

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
      <ModalAjustes isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </>
  )
}

export default MenuLateral
