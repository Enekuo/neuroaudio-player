import { useState } from 'react'
import SeccionCuenta from './sections/SeccionCuenta'
import SeccionGeneral from './sections/SeccionGeneral'
import SeccionPlan from './sections/SeccionPlan'
import SeccionPrivacidad from './sections/SeccionPrivacidad'
import SeccionUso from './sections/SeccionUso'
import SettingsIcon, { type SettingsIconName } from './SettingsIcon'

type SettingsSectionId = 'general' | 'cuenta' | 'privacidad' | 'plan' | 'uso'

type ModalAjustesProps = {
  isOpen: boolean
  onClose: () => void
}

const sections: { id: SettingsSectionId; label: string; icon: SettingsIconName }[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'cuenta', label: 'Cuenta', icon: 'cuenta' },
  { id: 'privacidad', label: 'Privacidad', icon: 'privacidad' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'uso', label: 'Uso', icon: 'uso' },
]

function ModalAjustes({ isOpen, onClose }: ModalAjustesProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general')

  if (!isOpen) {
    return null
  }

  return (
    <div className="settings-overlay" role="presentation" onClick={onClose}>
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="settings-modal__header">
          <h2 id="settings-modal-title">Ajustes</h2>
          <button type="button" className="settings-modal__close" onClick={onClose} aria-label="Cerrar ajustes">
            <SettingsIcon name="close" />
          </button>
        </header>

        <div className="settings-modal__body">
          <nav className="settings-modal__nav" role="tablist" aria-label="Secciones de ajustes">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={activeSection === section.id}
                className={`settings-modal__nav-item${activeSection === section.id ? ' is-active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <SettingsIcon name={section.icon} />
                {section.label}
              </button>
            ))}
          </nav>

          <div className="settings-modal__content">
            {activeSection === 'general' ? <SeccionGeneral /> : null}
            {activeSection === 'cuenta' ? <SeccionCuenta /> : null}
            {activeSection === 'privacidad' ? <SeccionPrivacidad /> : null}
            {activeSection === 'plan' ? <SeccionPlan /> : null}
            {activeSection === 'uso' ? <SeccionUso /> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalAjustes
