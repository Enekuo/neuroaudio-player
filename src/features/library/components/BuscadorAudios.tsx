import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useReproducirAudioProfesional } from '../../audiosProfesional/useReproducirAudioProfesional'
import { usePlayer } from '../../player/context/PlayerContext'
import { useAudiosDeProfesionales } from '../hooks/useAudiosDeProfesionales'
import type { LibraryAudio } from '../hooks/useUserAudios'
import {
  buscarAudios,
  MIN_LONGITUD_BUSQUEDA,
  type ResultadoBusqueda,
} from '../utils/buscarAudios'
import { formatTime } from '../utils/formatTime'
import LibraryIcon from './LibraryIcon'

type BuscadorAudiosProps = {
  audios: LibraryAudio[]
  isOpen: boolean
  onClose: () => void
}

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
 * - Busca en tiempo real (ver buscarAudios) entre los audios del usuario y
 *   los de profesionales que puede escuchar; estos se empiezan a leer la
 *   primera vez que se abre y siguen en vivo mientras la app esté abierta.
 * - Al pulsar un resultado se reproduce con el reproductor global y se cierra.
 *   Uno propio, con los propios de los resultados en cola; uno de un
 *   profesional, como desde su página (descarga privada, cola de uno).
 */
function BuscadorAudios({ audios, isOpen, onClose }: BuscadorAudiosProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer()
  const reproducirAudioProfesional = useReproducirAudioProfesional()
  const deProfesionales = useAudiosDeProfesionales(isOpen)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const term = query.trim()

  const results = useMemo(
    () => buscarAudios(term, audios, deProfesionales),
    [term, audios, deProfesionales],
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setQuery('')
    setError(null)
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

  async function handleSelect(resultado: ResultadoBusqueda) {
    if (resultado.origen === 'propio') {
      const propios = results.flatMap((r): LibraryAudio[] =>
        r.origen === 'propio' ? [r.audio] : [],
      )
      playTrack(resultado.audio, propios)
      onClose()
      return
    }
    const { audio, profesionalUid } = resultado
    // Si ya es el que suena, sigue sonando (no se vuelve a descargar).
    if (currentTrack?.id === audio.id) {
      if (!isPlaying) togglePlay()
      onClose()
      return
    }
    setError(null)
    if (await reproducirAudioProfesional(audio, profesionalUid)) {
      onClose()
    } else {
      setError(`No se pudo cargar «${audio.titulo}». Inténtalo de nuevo.`)
    }
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
              onChange={(event) => {
                setQuery(event.target.value)
                setError(null)
              }}
              aria-label="Buscar audios"
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
          {error ? (
            <p className="buscador-panel__error" role="alert">
              {error}
            </p>
          ) : null}
          {term.length < MIN_LONGITUD_BUSQUEDA ? (
            <p className="buscador-panel__hint">Escribe para buscar audios.</p>
          ) : results.length === 0 ? (
            <p className="buscador-panel__hint">Sin resultados</p>
          ) : (
            <ul className="buscador-panel__list">
              {results.map((resultado) => {
                const nombre =
                  resultado.origen === 'propio' ? resultado.audio.name : resultado.audio.titulo
                const titulo = (
                  <span className="buscador-panel__name">
                    {resaltarCoincidencia(nombre, term)}
                  </span>
                )
                let detalle: string | null = null
                if (resultado.origen === 'profesional') {
                  const duracion = resultado.audio.duracionSegundos
                  const extra = resultado.paraTi
                    ? 'Para ti'
                    : duracion
                      ? formatTime(duracion)
                      : null
                  detalle = extra ? `${resultado.profesional} · ${extra}` : resultado.profesional
                }
                return (
                  <li key={`${resultado.origen}-${resultado.audio.id}`}>
                    <button
                      type="button"
                      className="buscador-panel__row"
                      onClick={() => void handleSelect(resultado)}
                    >
                      <span className="buscador-panel__thumb" aria-hidden="true">
                        <LibraryIcon name="music" />
                      </span>
                      {detalle || resultado.porDescripcion ? (
                        <span className="buscador-panel__texto">
                          {titulo}
                          {detalle ? (
                            <span className="buscador-panel__detalle">{detalle}</span>
                          ) : null}
                          {resultado.porDescripcion ? (
                            <span className="buscador-panel__aviso">
                              Coincide en la descripción
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        titulo
                      )}
                      {resultado.origen === 'propio' && resultado.audio.duration ? (
                        <span className="buscador-panel__time">
                          {formatTime(resultado.audio.duration)}
                        </span>
                      ) : null}
                      <span className="buscador-panel__play" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 6.5v11l9-5.5-9-5.5z" />
                        </svg>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuscadorAudios
