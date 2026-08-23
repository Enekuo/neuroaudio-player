import { useEffect, useRef, useState } from 'react'
import LibraryIcon from './LibraryIcon'
import { formatTime } from '../utils/formatTime'

type FilaAudioProps = {
  name: string
  duration?: number
  isDeleting: boolean
  onPlay: () => void
  onDelete: () => void
}

function FilaAudio({ name, duration, isDeleting, onPlay, onDelete }: FilaAudioProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  function handleDeleteClick() {
    setIsMenuOpen(false)
    onDelete()
  }

  function handleAddToListClick() {
    setIsMenuOpen(false)
    // TODO: falta backend para asociar audios a listas.
  }

  function handleFavoriteClick() {
    setIsMenuOpen(false)
    // TODO: falta backend de favoritos.
  }

  return (
    <div className="library-audio-row">
      <button type="button" className="library-audio-row__main" onClick={onPlay}>
        <div className="library-audio-row__thumb" aria-hidden="true">
          <LibraryIcon name="music" />
        </div>
        <div className="library-audio-row__info">
          <h4>{name}</h4>
          {duration ? <p>{formatTime(duration)}</p> : null}
        </div>
      </button>

      <div className="library-audio-row__meta">
        {isDeleting ? (
          <span className="library-audio-row__deleting">Eliminando...</span>
        ) : (
          <div className="library-audio-row__options-wrapper" ref={menuRef}>
            <button
              type="button"
              className="library-audio-row__options"
              aria-label="Opciones"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((value) => !value)}
            >
              <LibraryIcon name="options" />
            </button>

            {isMenuOpen ? (
              <div className="library-audio-row__menu" role="menu">
                <button
                  type="button"
                  className="library-audio-row__menu-item"
                  role="menuitem"
                  onClick={handleAddToListClick}
                >
                  <span className="library-audio-row__menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h11" />
                      <path d="M4 12h11" />
                      <path d="M4 18h7" />
                      <path d="M18 14v6" />
                      <path d="M15 17h6" />
                    </svg>
                  </span>
                  Añadir a la lista
                </button>
                <button
                  type="button"
                  className="library-audio-row__menu-item"
                  role="menuitem"
                  onClick={handleFavoriteClick}
                >
                  <span className="library-audio-row__menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                  Marcar como favorito
                </button>
                <button
                  type="button"
                  className="library-audio-row__menu-item library-audio-row__menu-item--danger"
                  role="menuitem"
                  onClick={handleDeleteClick}
                >
                  <span className="library-audio-row__menu-item-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16" />
                      <path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
                      <path d="M9 7V4h6v3" />
                    </svg>
                  </span>
                  Eliminar
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default FilaAudio
