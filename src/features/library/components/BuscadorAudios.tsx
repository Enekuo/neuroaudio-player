import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import Fuse from 'fuse.js'
import { usePlayer } from '../../player/context/PlayerContext'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { formatTime } from '../utils/formatTime'
import LibraryIcon from './LibraryIcon'

type BuscadorAudiosProps = {
  audios: LibraryAudio[]
  isOpen: boolean
  onClose: () => void
}

const MAX_RESULTS = 30
const MIN_QUERY_LENGTH = 2

function LupaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  )
}

/** Resalta en azul (<mark>) el tramo del nombre que coincide literalmente con lo escrito. */
function resaltarCoincidencia(nombre: string, termino: string): ReactNode {
  const term = termino.trim()
  if (!term) {
    return nombre
  }

  const partes: ReactNode[] = []
  const nombreLower = nombre.toLowerCase()
  const termLower = term.toLowerCase()
  let desde = 0
  let idx = nombreLower.indexOf(termLower)
  let key = 0

  while (idx !== -1) {
    if (idx > desde) {
      partes.push(nombre.slice(desde, idx))
    }
    partes.push(
      <mark key={key} className="buscador-panel__mark">
        {nombre.slice(idx, idx + term.length)}
      </mark>,
    )
    key += 1
    desde = idx + term.length
    idx = nombreLower.indexOf(termLower, desde)
  }

  if (partes.length === 0) {
    return nombre
  }
  if (desde < nombre.length) {
    partes.push(nombre.slice(desde))
  }
  return partes
}

/**
 * Buscador de audios desplegable (panel sobre overlay oscurecido).
 *
 * - El disparador (lupa) vive en la cabecera de Inicio; este componente solo
 *   pinta el panel cuando `isOpen`.
 * - Motor Fuse.js: búsqueda en tiempo real, tolerante a erratas, solo por el
 *   nombre del audio, entre los audios del usuario (ya filtrados por uid).
 * - Al pulsar un resultado se reproduce con el reproductor global y se cierra.
 */
function BuscadorAudios({ audios, isOpen, onClose }: BuscadorAudiosProps) {
  const { playTrack } = usePlayer()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const fuse = useMemo(
    () =>
      new Fuse(audios, {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
      }),
    [audios],
  )

  const term = query.trim()

  const results = useMemo(() => {
    if (term.length < MIN_QUERY_LENGTH) {
      return []
    }

    const termLower = term.toLowerCase()

    return fuse
      .search(term)
      .sort((a, b) => {
        const aStartsWith = a.item.name.toLowerCase().startsWith(termLower) ? 0 : 1
        const bStartsWith = b.item.name.toLowerCase().startsWith(termLower) ? 0 : 1
        if (aStartsWith !== bStartsWith) {
          return aStartsWith - bStartsWith
        }
        return (a.score ?? 0) - (b.score ?? 0)
      })
      .slice(0, MAX_RESULTS)
      .map((match) => match.item)
  }, [fuse, term])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setQuery('')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20)

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  function handleSelect(audio: LibraryAudio) {
    playTrack(audio, results.length > 0 ? results : [audio])
    onClose()
  }

  return (
    <div
      className="buscador-overlay"
      onMouseDown={onClose}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="buscador-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar audios"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="buscador-panel__search">
          <div className="buscador-panel__field">
            <span className="buscador-panel__field-icon" aria-hidden="true">
              <LupaIcon />
            </span>
            <input
              ref={inputRef}
              type="text"
              className="buscador-panel__input"
              placeholder="Buscar audios"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar audios por nombre"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="buscador-panel__clear"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            ) : null}
          </div>
          <button type="button" className="buscador-panel__cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>

        <p className="buscador-panel__label">Resultados</p>

        <div className="buscador-panel__results">
          {term.length < MIN_QUERY_LENGTH ? (
            <p className="buscador-panel__hint">Escribe para buscar entre tus audios</p>
          ) : results.length === 0 ? (
            <p className="buscador-panel__hint">Sin resultados</p>
          ) : (
            <ul className="buscador-panel__list">
              {results.map((audio) => (
                <li key={audio.id}>
                  <button
                    type="button"
                    className="buscador-panel__row"
                    onClick={() => handleSelect(audio)}
                  >
                    <span className="buscador-panel__thumb" aria-hidden="true">
                      <LibraryIcon name="music" />
                    </span>
                    <span className="buscador-panel__name">
                      {resaltarCoincidencia(audio.name, term)}
                    </span>
                    {audio.duration ? (
                      <span className="buscador-panel__time">{formatTime(audio.duration)}</span>
                    ) : null}
                    <span className="buscador-panel__play" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 6.5v11l9-5.5-9-5.5z" />
                      </svg>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuscadorAudios
