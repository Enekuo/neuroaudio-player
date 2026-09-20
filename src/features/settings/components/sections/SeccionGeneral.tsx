import { useEffect, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import UserAvatar from '../../../auth/components/UserAvatar'
import { useUserProfile } from '../../../auth/hooks/useUserProfile'
import { updateDisplayNamePref } from '../../../auth/services/userProfileService'
import { applyReducedMotion, getStoredReducedMotion } from '../../utils/reducedMotion'
import SettingsSwitch from '../SettingsSwitch'

function SeccionGeneral() {
  const { user } = useAuth()
  const { profile, isLoading: isLoadingProfile } = useUserProfile()

  const [preferredName, setPreferredName] = useState('')
  const [isNameTouched, setIsNameTouched] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(() => getStoredReducedMotion())

  useEffect(() => {
    if (!isNameTouched && profile?.displayNamePref !== undefined) {
      setPreferredName(profile.displayNamePref)
    }
  }, [profile?.displayNamePref, isNameTouched])

  const savedPreferredName = profile?.displayNamePref ?? ''
  const isDirty = isNameTouched && preferredName.trim() !== savedPreferredName.trim()

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setIsNameTouched(true)
    setJustSaved(false)
    setPreferredName(event.target.value)
  }

  async function handleSaveName() {
    if (!user || !isDirty) {
      return
    }

    setIsSavingName(true)
    setSaveError(null)

    try {
      await updateDisplayNamePref(user.uid, preferredName.trim())
      setIsNameTouched(false)
      setJustSaved(true)
    } catch {
      setSaveError('No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setIsSavingName(false)
    }
  }

  function handleToggleReduceMotion(checked: boolean) {
    setReduceMotion(checked)
    applyReducedMotion(checked)
  }

  return (
    <div className="settings-section">
      <h3>General</h3>
      <p className="settings-section__intro">Tu perfil y las preferencias generales de NeuroAudio.</p>

      <section className="settings-apartado">
        <h4>Perfil</h4>

        <div className="settings-profile-row">
          <UserAvatar user={user} className="settings-account-photo__avatar" />
          <div>
            <p className="settings-row__label">Foto de perfil</p>
            <p className="settings-row__hint">Se toma de tu cuenta de Google.</p>
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-full-name">
            Nombre completo
          </label>
          <input
            id="settings-full-name"
            className="settings-field__input"
            value={user?.displayName ?? ''}
            disabled
            readOnly
          />
          <p className="settings-field__hint">Viene de tu cuenta de Google y no se puede editar aquí.</p>
        </div>

        <div className="settings-field">
          <label className="settings-field__label" htmlFor="settings-preferred-name">
            ¿Cómo quieres que te llamemos?
          </label>
          <div className="settings-field__row">
            <input
              id="settings-preferred-name"
              className="settings-field__input"
              value={preferredName}
              onChange={handleNameChange}
              placeholder={user?.displayName ?? 'Tu nombre'}
              disabled={isLoadingProfile}
            />
            <button
              type="button"
              className="settings-field__save"
              onClick={handleSaveName}
              disabled={!isDirty || isSavingName}
            >
              {isSavingName ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          {saveError ? (
            <p className="settings-field__error">{saveError}</p>
          ) : justSaved ? (
            <p className="settings-field__success">Guardado. Así te saludaremos a partir de ahora.</p>
          ) : (
            <p className="settings-field__hint">Lo usaremos para saludarte, por ejemplo en la pantalla de Inicio.</p>
          )}
        </div>
      </section>

      <section className="settings-apartado">
        <h4>Preferencias</h4>

        <div className="settings-row">
          <div>
            <p className="settings-row__label">Apariencia</p>
            <p className="settings-row__hint">Por ahora NeuroAudio solo tiene modo oscuro.</p>
          </div>
          <div className="settings-segmented" role="radiogroup" aria-label="Apariencia">
            <button type="button" className="settings-segmented__option" disabled aria-pressed="false">
              Sistema
            </button>
            <button type="button" className="settings-segmented__option" disabled aria-pressed="false">
              Claro
            </button>
            <button type="button" className="settings-segmented__option is-active" aria-pressed="true">
              Oscuro
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row__label">Reducir animaciones</p>
            <p className="settings-row__hint">Minimiza las transiciones y animaciones de la interfaz.</p>
          </div>
          <SettingsSwitch
            checked={reduceMotion}
            onChange={handleToggleReduceMotion}
            ariaLabel="Reducir las animaciones de la interfaz"
          />
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row__label">Idioma</p>
            <p className="settings-row__hint">Preparado para más idiomas en el futuro.</p>
          </div>
          <select className="settings-select" defaultValue="es" aria-label="Idioma">
            <option value="es">Español</option>
          </select>
        </div>
      </section>

      <section className="settings-apartado settings-apartado--coming-soon">
        <div className="settings-apartado__header">
          <h4>Reproducción</h4>
          <span className="settings-badge">Próximamente</span>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row__label">Velocidad por defecto</p>
            <p className="settings-row__hint">Elige la velocidad con la que empiezan tus audios.</p>
          </div>
          <select className="settings-select" disabled defaultValue="normal" aria-label="Velocidad por defecto">
            <option value="normal">Normal</option>
          </select>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row__label">Continuar donde lo dejaste</p>
            <p className="settings-row__hint">Retoma automáticamente tus audios desde el último punto.</p>
          </div>
          <SettingsSwitch checked={false} disabled ariaLabel="Continuar donde lo dejaste" />
        </div>
      </section>

      <section className="settings-apartado settings-apartado--coming-soon">
        <div className="settings-apartado__header">
          <h4>Notificaciones</h4>
          <span className="settings-badge">Próximamente</span>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-row__label">Avisos por email</p>
            <p className="settings-row__hint">Recibe novedades y recordatorios en tu correo.</p>
          </div>
          <SettingsSwitch checked={false} disabled ariaLabel="Avisos por email" />
        </div>
      </section>
    </div>
  )
}

export default SeccionGeneral
