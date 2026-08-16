import { useState } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import UserAvatar from '../../../auth/components/UserAvatar'
import { signOutUser } from '../../../auth/services/authService'
import SettingsIcon from '../SettingsIcon'

function SeccionCuenta() {
  const { user } = useAuth()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  async function handleSignOut() {
    await signOutUser()
  }

  function handleCancelDelete() {
    setIsConfirmingDelete(false)
    setShowComingSoon(false)
  }

  function handleConfirmDelete() {
    setShowComingSoon(true)
  }

  return (
    <div className="settings-section">
      <h3>Cuenta</h3>

      <div className="settings-account-photo">
        <UserAvatar user={user} className="settings-account-photo__avatar" />
        <p className="settings-account-photo__hint">Se toma de tu cuenta de Google.</p>
      </div>

      <div className="settings-row">
        <p className="settings-row__label">Nombre</p>
        <span className="settings-row__value">{user?.displayName ?? '—'}</span>
      </div>

      <div className="settings-row">
        <p className="settings-row__label">Correo electrónico</p>
        <span className="settings-row__value">{user?.email ?? '—'}</span>
      </div>

      <button type="button" className="settings-signout-button" onClick={handleSignOut}>
        <SettingsIcon name="logout" />
        Cerrar sesión
      </button>

      <div className="settings-danger-zone">
        <div className="settings-danger-zone__header">
          <SettingsIcon name="warning" />
          <h4>Eliminar cuenta</h4>
        </div>
        <p>
          Esta acción borrará tu cuenta, tus audios, tus listas y todos tus datos de forma permanente. No se puede
          deshacer.
        </p>

        {!isConfirmingDelete ? (
          <button type="button" className="settings-danger-button" onClick={() => setIsConfirmingDelete(true)}>
            Eliminar cuenta
          </button>
        ) : (
          <div className="settings-danger-confirm">
            <p>¿Seguro que quieres eliminar tu cuenta? Esta acción es permanente y no se puede deshacer.</p>
            <div className="settings-danger-confirm__actions">
              <button type="button" className="settings-danger-confirm__cancel" onClick={handleCancelDelete}>
                Cancelar
              </button>
              <button type="button" className="settings-danger-button" onClick={handleConfirmDelete}>
                Sí, eliminar mi cuenta
              </button>
            </div>
            {showComingSoon ? (
              <p className="settings-danger-confirm__notice">
                La eliminación de cuenta todavía no está disponible. Se implementará próximamente, con borrado en
                cascada de todos tus datos.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default SeccionCuenta
