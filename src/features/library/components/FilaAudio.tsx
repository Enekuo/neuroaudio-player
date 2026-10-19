import { useEffect, useRef, useState, type ReactNode } from 'react'
import LibraryIcon from './LibraryIcon'
import MenuOpcionesAudio from './MenuOpcionesAudio'
import { formatTime } from '../utils/formatTime'

type FilaAudioProps = {
  name: string
  duration?: number
  isDeleting: boolean
  isPlaying?: boolean
  isFavorite?: boolean
  // Sin el corazón pequeño junto a los tres puntos (en la página de
  // Favoritos todos lo son, así que sería ruido).
  hideFavoriteBadge?: boolean
  onPlay: () => void
  onDelete?: () => void
  onToggleFavorite?: () => void
  // Texto extra en la segunda línea, tras la duración ("· Contenido de salud").
  detalle?: string
  // Menú propio en lugar del de siempre (Añadir a la lista / Favorito /
  // Eliminar), para audios que no son del usuario (p. ej. de su profesional).
  opciones?: OpcionFila[]
}

export type OpcionFila = {
  etiqueta: string
  icono?: ReactNode
  onClick: () => void
}

function FilaAudio({
  name,
  duration,
  isDeleting,
  isPlaying,
  isFavorite = false,
  hideFavoriteBadge = false,
  onPlay,
  onDelete,
  onToggleFavorite,
  detalle,
  opciones,
}: FilaAudioProps) {
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
    onDelete?.()
  }

  function handleAddToListClick() {
    setIsMenuOpen(false)
    // TODO: falta backend para asociar audios a listas.
  }

  function handleFavoriteClick() {
    setIsMenuOpen(false)
    onToggleFavorite?.()
  }

  return (
    <div className={`library-audio-row library-audio-row--fila${isPlaying ? ' is-playing' : ''}`}>
      <button type="button" className="library-audio-row__main" onClick={onPlay}>
        <div className="library-audio-row__thumb" aria-hidden="true">
          <LibraryIcon name="music" />
        </div>
        <div className="library-audio-row__info">
          <h4>{name}</h4>
          {duration || detalle ? <p>{[duration ? formatTime(duration) : null, detalle].filter(Boolean).join(' · ')}</p> : null}
        </div>
      </button>

      <div className="library-audio-row__meta">
        {isFavorite && !hideFavoriteBadge && !isDeleting ? (
          <span className="library-audio-row__favorite" aria-label="En favoritos" role="img">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        ) : null}

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
              <LibraryIcon name="options-vertical" />
            </button>

            {isMenuOpen && opciones ? (
              <div className="library-audio-row__menu" role="menu">
                {opciones.map((opcion) => (
                  <button
                    key={opcion.etiqueta}
                    type="button"
                    className="library-audio-row__menu-item"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false)
                      opcion.onClick()
                    }}
                  >
                    {opcion.icono ? (
                      <span className="library-audio-row__menu-item-icon" aria-hidden="true">
                        {opcion.icono}
                      </span>
                    ) : null}
                    {opcion.etiqueta}
                  </button>
                ))}
              </div>
            ) : isMenuOpen ? (
              <MenuOpcionesAudio
                isFavorite={isFavorite}
                onAddToList={handleAddToListClick}
                onFavorite={handleFavoriteClick}
                onDelete={handleDeleteClick}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default FilaAudio
