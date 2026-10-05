import { useEffect, useRef, useState, type AnimationEvent } from 'react'
import { createPortal } from 'react-dom'
import type { LibraryFolder } from '../data/plantillasListas'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { formatTime } from '../utils/formatTime'
import LibraryIcon from './LibraryIcon'
import ListaOptionsMenu from './ListaOptionsMenu'

type PanelAnadirAudiosProps = {
  folder: LibraryFolder
  audios: LibraryAudio[]
  error?: string | null
  onToggleAudio: (audioId: string, incluir: boolean) => void
  onClose: () => void
  onRename?: () => void
  onDelete?: () => void
}

// El check se "dibuja" (stroke-dashoffset con pathLength=1) en vez de
// aparecer de golpe; al ser una transición CSS, se puede marcar/desmarcar
// rápido y siempre retoma desde donde va, sin saltos.
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" pathLength={1} />
    </svg>
  )
}

// Respuesta háptica mínima al añadir (solo donde existe la Vibration API,
// p. ej. Android; iOS la ignora). Se omite con "reducir movimiento".
function tapHaptic() {
  if (
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    !document.documentElement.classList.contains('reduce-motion')
  ) {
    navigator.vibrate(8)
  }
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

// Comparación sin mayúsculas ni tildes ("meditacion" encuentra "Meditación").
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Hoja "Añadir audios" de una lista: cae desde arriba y cubre toda la pantalla
 * (por encima de la navegación y del mini-reproductor). Tocar un audio lo
 * añade/quita de la lista al momento (misma lógica de siempre, onToggleAudio);
 * "Listo" cierra la hoja. Se renderiza en <body> para quedar encima de todo.
 */
function PanelAnadirAudios({
  folder,
  audios,
  error,
  onToggleAudio,
  onClose,
  onRename,
  onDelete,
}: PanelAnadirAudiosProps) {
  const [query, setQuery] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const incluidos = new Set(folder.audioIds)
  const nEnLista = audios.reduce((total, audio) => (incluidos.has(audio.id) ? total + 1 : total), 0)
  const showOptions = Boolean(onRename && onDelete)
  const showSearch = audios.length > 6
  const normalizedQuery = normalize(query.trim())
  const visibles = normalizedQuery ? audios.filter((audio) => normalize(audio.name).includes(normalizedQuery)) : audios

  function requestClose() {
    if (!isClosing) {
      setIsClosing(true)
    }
  }

  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && isClosing) {
      onClose()
    }
  }

  // Foco inicial en cerrar (accesible con teclado) y Escape para cerrar.
  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsClosing(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return createPortal(
    <div
      className={`sheet-audios${isClosing ? ' is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-audios-title"
      onAnimationEnd={handleAnimationEnd}
    >
      <header className="sheet-audios__header">
        <div className="sheet-audios__titles">
          <h2 id="sheet-audios-title">Añadir audios</h2>
          <p>
            Se guardarán en <strong>{folder.name}</strong>
          </p>
        </div>

        <div className="sheet-audios__header-actions">
          {showOptions ? <ListaOptionsMenu onRename={onRename!} onDelete={onDelete!} /> : null}
          <button
            ref={closeButtonRef}
            type="button"
            className="sheet-audios__close"
            onClick={requestClose}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      {showSearch ? (
        <label className="sheet-audios__search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Buscar en tus audios"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar en tus audios"
            enterKeyHint="search"
          />
        </label>
      ) : null}

      {error ? <p className="sheet-audios__error">{error}</p> : null}

      <div className="sheet-audios__body">
        {audios.length === 0 ? (
          <p className="sheet-audios__empty">Aún no tienes audios. Súbelos desde «Añadir audio».</p>
        ) : visibles.length === 0 ? (
          <p className="sheet-audios__empty">Ningún audio coincide con «{query.trim()}».</p>
        ) : (
          <ul className="sheet-audios__list">
            {visibles.map((audio) => {
              const incluido = incluidos.has(audio.id)

              return (
                <li key={audio.id}>
                  <button
                    type="button"
                    className={`sheet-audios__item${incluido ? ' is-included' : ''}`}
                    onClick={() => {
                      if (!incluido) {
                        tapHaptic()
                      }
                      onToggleAudio(audio.id, !incluido)
                    }}
                    aria-pressed={incluido}
                  >
                    <span className="sheet-audios__thumb" aria-hidden="true">
                      <LibraryIcon name="music" />
                    </span>
                    <span className="sheet-audios__info">
                      <span className="sheet-audios__name">{audio.name}</span>
                      {audio.duration ? <span className="sheet-audios__time">{formatTime(audio.duration)}</span> : null}
                    </span>
                    <span className="sheet-audios__check" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="sheet-audios__footer">
        <button type="button" className="sheet-audios__done" onClick={requestClose}>
          Listo
          {/* key: el contador "rueda" suavemente cada vez que cambia. */}
          <span key={nEnLista} className="sheet-audios__done-count">
            {nEnLista === 1 ? '1 audio en la lista' : `${nEnLista} audios en la lista`}
          </span>
        </button>
      </footer>
    </div>,
    document.body,
  )
}

export default PanelAnadirAudios
