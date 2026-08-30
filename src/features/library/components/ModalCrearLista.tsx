import { useState, type ChangeEvent } from 'react'
import { CUSTOM_TEMPLATE_ID } from '../data/plantillasListas'
import { useCrearLista } from '../hooks/useCrearLista'

type ModalCrearListaProps = {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

function ModalCrearLista({ isOpen, onClose, onCreated }: ModalCrearListaProps) {
  const [name, setName] = useState('')
  const { create, isSaving, error } = useCrearLista()

  if (!isOpen) {
    return null
  }

  const canSubmit = name.trim().length > 0 && !isSaving

  function resetAndClose() {
    if (isSaving) {
      return
    }
    setName('')
    onClose()
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value)
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return
    }

    const success = await create(name.trim(), CUSTOM_TEMPLATE_ID)

    if (success) {
      onCreated?.()
      setName('')
      onClose()
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={resetAndClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-crear-lista-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id="modal-crear-lista-title">Crear lista</h2>
          <p className="modal-card__subtitle">Dale un nombre a tu nueva lista</p>
        </div>

        <label className="modal-field">
          <span className="modal-field__label">Nombre de la lista</span>
          <input
            type="text"
            className="modal-field__input"
            placeholder="Ej: Meditación para dormir"
            value={name}
            onChange={handleNameChange}
            autoFocus
          />
        </label>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button
            type="button"
            className="modal-actions__cancel"
            onClick={resetAndClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button type="button" className="modal-actions__submit" onClick={handleSubmit} disabled={!canSubmit}>
            {isSaving ? 'Creando...' : 'Crear lista'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalCrearLista
