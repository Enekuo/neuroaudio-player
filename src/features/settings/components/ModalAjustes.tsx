import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSalidaAnimada } from '../../../hooks/useSalidaAnimada'
import SeccionCuenta from './sections/SeccionCuenta'
import SeccionGeneral from './sections/SeccionGeneral'
import SeccionPlanYUso from './sections/SeccionPlanYUso'
import SeccionPrivacidad from './sections/SeccionPrivacidad'
import SettingsIcon, { type SettingsIconName } from './SettingsIcon'

// «Plan y uso» junta las antiguas pestañas «Plan» y «Uso».
type SettingsSectionId = 'general' | 'cuenta' | 'privacidad' | 'plan-y-uso'

type ModalAjustesProps = {
  isOpen: boolean
  onClose: () => void
}

const sections: { id: SettingsSectionId; label: string; icon: SettingsIconName }[] = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'cuenta', label: 'Cuenta', icon: 'cuenta' },
  { id: 'privacidad', label: 'Privacidad', icon: 'privacidad' },
  { id: 'plan-y-uso', label: 'Plan y uso', icon: 'plan' },
]

function ModalAjustes({ isOpen, onClose }: ModalAjustesProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('general')
  // Al cerrar, la ventana sale (fundido + leve escala) antes de quitarse.
  const { visible, saliendo } = useSalidaAnimada(isOpen, 180)

  if (!visible) {
    return null
  }

  // Se pinta en <body>: en móvil se abre desde la barra superior, que forma su
  // propia capa, y dentro de ella la barra de botones de abajo la tapaba.
  return createPortal(
    <div
      className={`settings-overlay${saliendo ? ' is-closing' : ''}`}
      role="presentation"
      onClick={saliendo ? undefined : onClose}
    >
      <div
        className={`settings-modal${saliendo ? ' is-closing' : ''}`}
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
                onClick={(event) => {
                  setActiveSection(section.id)
                  // En móvil las pestañas van en fila deslizable: la elegida
                  // se desliza hasta verse entera (sin animación si se pide
                  // reducir el movimiento).
                  const reducir =
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                    document.documentElement.classList.contains('reduce-motion')
                  event.currentTarget.scrollIntoView({
                    block: 'nearest',
                    inline: 'nearest',
                    behavior: reducir ? 'auto' : 'smooth',
                  })
                }}
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
            {activeSection === 'plan-y-uso' ? <SeccionPlanYUso /> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ModalAjustes
