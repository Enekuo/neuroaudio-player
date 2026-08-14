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
                  onClick={handleDeleteClick}
                >
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
