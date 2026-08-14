import { useState, type ChangeEvent, type DragEvent } from 'react'
import { useUploadAudio } from '../hooks/useUploadAudio'

type ModalSubirAudioProps = {
  isOpen: boolean
  onClose: () => void
  onUploaded?: () => void
}

function ModalSubirAudio({ isOpen, onClose, onUploaded }: ModalSubirAudioProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const { upload, isUploading, progress, error } = useUploadAudio()

  if (!isOpen) {
    return null
  }

  const canSubmit = Boolean(file) && name.trim().length > 0 && !isUploading

  function resetAndClose() {
    if (isUploading) {
      return
    }
    setFile(null)
    setName('')
    setIsDragging(false)
    onClose()
  }

  function pickFile(selected: File | null | undefined) {
    if (!selected || !selected.type.startsWith('audio/')) {
      return
    }
    setFile(selected)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    pickFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    pickFile(event.dataTransfer.files?.[0])
  }

  async function handleSubmit() {
    if (!file || !canSubmit) {
      return
    }

    const success = await upload(file, name.trim())

    if (success) {
      onUploaded?.()
      setFile(null)
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
        aria-labelledby="modal-subir-audio-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-subir-audio-title">Añadir audio</h2>

        <label
          className={`modal-dropzone${isDragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input type="file" accept="audio/*" className="modal-dropzone__input" onChange={handleFileChange} />
          <span className="modal-dropzone__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
          </span>
          <span className="modal-dropzone__text">
            {file ? file.name : 'Arrastra un archivo de audio o haz clic para elegirlo'}
          </span>
          <span className="modal-dropzone__hint">MP3, WAV u otro formato de audio</span>
        </label>

        <label className="modal-field">
          <span className="modal-field__label">Nombre del audio</span>
          <input
            type="text"
            className="modal-field__input"
            placeholder="Ej: Meditación para dormir"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        {isUploading && <p className="modal-status">Subiendo... {Math.round(progress)}%</p>}
        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button
            type="button"
            className="modal-actions__cancel"
            onClick={resetAndClose}
            disabled={isUploading}
          >
            Cancelar
          </button>
          <button type="button" className="modal-actions__submit" onClick={handleSubmit} disabled={!canSubmit}>
            {isUploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalSubirAudio
