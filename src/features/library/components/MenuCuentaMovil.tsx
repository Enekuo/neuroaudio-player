import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { signOutUser } from '../../auth/services/authService'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import ModalAjustes from '../../settings/components/ModalAjustes'
import SettingsIcon from '../../settings/components/SettingsIcon'

// Icono de cuenta + su menú desplegable (Ajustes / Cerrar sesión). Solo se usa
// en móvil, dentro de la cabecera de Inicio: va en el flujo normal y baja con el
// scroll. El resto de páginas no llevan este icono.
function MenuCuentaMovil() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const displayName =
    profile?.displayNamePref?.trim() || user?.displayName || user?.email || 'Mi cuenta'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  function handleOpenSettings() {
    setIsMenuOpen(false)
    setIsSettingsModalOpen(true)
  }

  async function handleSignOut() {
    await signOutUser()
  }

  return (
    <div className="mobile-topbar__account" ref={accountRef}>
      <button
        type="button"
        className="mobile-topbar__avatar-button"
        onClick={() => setIsMenuOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-label="Cuenta"
      >
        <svg
          className="mobile-topbar__account-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {isMenuOpen ? (
        <div className="mobile-topbar__menu" role="menu">
          <p className="mobile-topbar__menu-name">{displayName}</p>
          {user?.email ? <p className="mobile-topbar__menu-email">{user.email}</p> : null}
          <button
            type="button"
            className="mobile-topbar__menu-item"
            role="menuitem"
            onClick={handleOpenSettings}
          >
            <SettingsIcon name="settings" />
            Ajustes
          </button>
          <button
            type="button"
            className="mobile-topbar__menu-item"
            role="menuitem"
            onClick={handleSignOut}
          >
            <SettingsIcon name="logout" />
            Cerrar sesión
          </button>
        </div>
      ) : null}

      <ModalAjustes isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  )
}

export default MenuCuentaMovil
