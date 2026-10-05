import { useEffect, useRef, useState, type AnimationEvent, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { useUploadAudio } from '../hooks/useUploadAudio'

type ModalSubirAudioProps = {
  isOpen: boolean
  onClose: () => void
  onUploaded?: () => void
}

type Step = 'pick' | 'name'

// "MP3 · 4,2 MB": extensión del archivo + tamaño, para confirmar de un vistazo
// que es el archivo correcto.
function describeFile(file: File) {
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : null
  const megas = file.size / (1024 * 1024)
  const size =
    megas >= 1
      ? `${megas.toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`
  return extension ? `${extension} · ${size}` : size
}

/**
 * Modal "Añadir audio" en dos pasos:
 *  1. Elegir archivo (solo la zona de arrastrar/soltar + Cancelar).
 *  2. Confirmar archivo y ponerle nombre (archivo elegido + "Cambiar",
 *     campo de nombre, Cancelar y Guardar).
 * El paso se deriva de si hay archivo; la subida (useUploadAudio) no cambia.
 */
function ModalSubirAudio({ isOpen, onClose, onUploaded }: ModalSubirAudioProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  // Sentido de la última transición entre pasos: el paso 2 entra desde la
  // derecha (avanzar) y el paso 1 vuelve desde la izquierda (volver atrás).
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  // Cierre animado: el modal sale (fundido + leve escala) y solo entonces se
  // avisa al padre, en vez de desaparecer de golpe.
  const [isClosing, setIsClosing] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { upload, isUploading, progress, error } = useUploadAudio()

  const step: Step = file ? 'name' : 'pick'

  // Con ratón/teclado, el foco salta al nombre al entrar en el paso 2. En
  // táctil no: abrir el teclado solo, a mitad de la transición, se siente
  // brusco; el usuario toca el campo cuando quiere.
  useEffect(() => {
    if (step === 'name' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      nameInputRef.current?.focus({ preventScroll: true })
    }
  }, [step])

  if (!isOpen) {
    return null
  }

  const canSubmit = Boolean(file) && name.trim().length > 0 && !isUploading

  function requestClose() {
    if (isUploading || isClosing) {
      return
    }
    setIsClosing(true)
  }

  function handleCardAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !isClosing) {
      return
    }
    setFile(null)
    setName('')
    setIsDragging(false)
    setDirection('forward')
    setIsClosing(false)
    onClose()
  }

  function pickFile(selected: File | null | undefined) {
    if (!selected || !selected.type.startsWith('audio/')) {
      return
    }
    setDirection('forward')
    setFile(selected)
  }

  // Volver al paso 1. El nombre que ya se hubiera escrito se conserva: suele
  // describir el contenido, no el archivo, así que sigue sirviendo si solo se
  // cambia de archivo.
  function handleChangeFile() {
    if (isUploading) {
      return
    }
    setDirection('back')
    setFile(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    pickFile(event.target.files?.[0])
    // Permite volver a elegir el mismo archivo tras "Cambiar".
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setIsDragging(false)
    pickFile(event.dataTransfer.files?.[0])
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (!file || !canSubmit) {
      return
    }

    const success = await upload(file, name.trim())

    if (success) {
      onUploaded?.()
      setIsClosing(true)
    }
  }

  return (
    <div
      className={`modal-overlay modal-subir-overlay${isClosing ? ' is-closing' : ''}`}
      role="presentation"
      onClick={requestClose}
    >
      <div
        className={`modal-card modal-subir${isClosing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-subir-audio-title"
        onClick={(event) => event.stopPropagation()}
        onAnimationEnd={handleCardAnimationEnd}
      >
        <h2 id="modal-subir-audio-title">Añadir audio</h2>

        {step === 'pick' ? (
          <div key="pick" className={`modal-subir__step modal-subir__step--${direction}`}>
            <label
              className={`modal-dropzone${isDragging ? ' is-dragging' : ''}`}
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
              <span className="modal-dropzone__text">Arrastra un archivo de audio o haz clic para elegirlo</span>
              <span className="modal-dropzone__hint">MP3, WAV u otro formato de audio</span>
            </label>

            <div className="modal-actions">
              <button type="button" className="modal-actions__cancel" onClick={requestClose}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <form
            key="name"
            className={`modal-subir__step modal-subir__step--${direction}`}
            onSubmit={handleSubmit}
          >
            <div className="modal-subir__file">
              <span className="modal-subir__file-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </span>
              <span className="modal-subir__file-info">
                <span className="modal-subir__file-name">{file?.name}</span>
                {file ? <span className="modal-subir__file-meta">{describeFile(file)}</span> : null}
              </span>
              <button
                type="button"
                className="modal-subir__change"
                onClick={handleChangeFile}
                disabled={isUploading}
                aria-label="Cambiar archivo"
              >
                Cambiar
              </button>
            </div>

            <label className="modal-field">
              <span className="modal-field__label">Nombre del audio</span>
              <input
                ref={nameInputRef}
                type="text"
                className="modal-field__input"
                placeholder="Ej: Meditación para dormir"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isUploading}
                enterKeyHint="done"
              />
            </label>

            {isUploading ? (
              <div className="modal-subir__progress" role="status">
                <span className="modal-subir__progress-track" aria-hidden="true">
                  <span className="modal-subir__progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
                </span>
                <span className="modal-status">Guardando... {Math.round(progress)}%</span>
              </div>
            ) : null}
            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-actions__cancel" onClick={requestClose} disabled={isUploading}>
                Cancelar
              </button>
              <button type="submit" className="modal-actions__submit" disabled={!canSubmit}>
                {isUploading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ModalSubirAudio
