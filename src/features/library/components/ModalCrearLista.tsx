import { useState, type ChangeEvent } from 'react'
import { useCrearLista } from '../hooks/useCrearLista'
import type { ListTemplate } from '../data/plantillasListas'
import TemplateGrid from './TemplateGrid'

type ModalCrearListaProps = {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

function ModalCrearLista({ isOpen, onClose, onCreated }: ModalCrearListaProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ListTemplate | null>(null)
  const [name, setName] = useState('')
  const [isNameTouched, setIsNameTouched] = useState(false)
  const { create, isSaving, error } = useCrearLista()

  if (!isOpen) {
    return null
  }

  const canSubmit = Boolean(selectedTemplate) && name.trim().length > 0 && !isSaving

  function resetAndClose() {
    if (isSaving) {
      return
    }
    setSelectedTemplate(null)
    setName('')
    setIsNameTouched(false)
    onClose()
  }

  function handleSelectTemplate(template: ListTemplate) {
    setSelectedTemplate(template)
    if (!isNameTouched) {
      setName(template.label)
    }
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setIsNameTouched(true)
    setName(event.target.value)
  }

  async function handleSubmit() {
    if (!selectedTemplate || !canSubmit) {
      return
    }

    const success = await create(name.trim(), selectedTemplate.id)

    if (success) {
      onCreated?.()
      setSelectedTemplate(null)
      setName('')
      setIsNameTouched(false)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={resetAndClose}>
      <div
        className="modal-card modal-card--lista"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-crear-lista-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id="modal-crear-lista-title">Crear lista</h2>
          <p className="modal-card__subtitle">Elige un estilo para tu nueva lista</p>
        </div>

        <TemplateGrid selectedId={selectedTemplate?.id} onSelect={handleSelectTemplate} />

        <label className="modal-field">
          <span className="modal-field__label">Nombre de la lista</span>
          <input
            type="text"
            className="modal-field__input"
            placeholder="Ej: Meditación para dormir"
            value={name}
            onChange={handleNameChange}
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
