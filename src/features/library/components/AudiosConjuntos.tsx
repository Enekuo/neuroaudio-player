import { useState } from 'react'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { formatTime } from '../utils/formatTime'
import LibraryIcon from './LibraryIcon'
import MiniReproductorConjunto from './MiniReproductorConjunto'

const MAX_SIMULTANEOUS = 2

type AudiosConjuntosProps = {
  audios: LibraryAudio[]
  isLoading: boolean
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 6.5v11l9-5.5-9-5.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="7" y="6" width="4" height="12" rx="1" />
      <rect x="13" y="6" width="4" height="12" rx="1" />
    </svg>
  )
}

/**
 * Pestaña "Audios conjuntos": permite tener hasta 2 audios sonando a la vez, cada uno con su
 * propio reproductor (MiniReproductorConjunto -> su propio <audio>), totalmente aparte del
 * reproductor global (PlayerContext/mini-player/now-playing).
 *
 * `playingIds` solo dice qué 2 audios tienen "hueco" asignado. El play/pausa real, progreso y
 * volumen de cada uno vive dentro de su propio MiniReproductorConjunto; al quitar un id de aquí
 * (fila, límite de 2, o fin natural del audio) ese componente se desmonta y su <audio> para solo.
 * Si se pide un 3er audio con los 2 huecos ocupados, se libera el más antiguo y entra el nuevo.
 */
function AudiosConjuntos({ audios, isLoading }: AudiosConjuntosProps) {
  const [playingIds, setPlayingIds] = useState<string[]>([])

  function handleEnded(audioId: string) {
    setPlayingIds((current) => current.filter((id) => id !== audioId))
  }

  function toggleSlot(audio: LibraryAudio) {
    setPlayingIds((current) => {
      if (current.includes(audio.id)) {
        return current.filter((id) => id !== audio.id)
      }

      if (current.length >= MAX_SIMULTANEOUS) {
        const [, ...rest] = current
        return [...rest, audio.id]
      }

      return [...current, audio.id]
    })
  }

  if (isLoading) {
    return <p className="library-screen__loading">Cargando tus audios...</p>
  }

  if (audios.length === 0) {
    return (
      <div className="library-empty-state" role="status">
        <div className="library-empty-state__icon" aria-hidden="true">
          <LibraryIcon name="music" />
        </div>
        <h2>Aún no tienes audios</h2>
        <p>Sube audios desde «Añadir audio» para poder reproducir varios a la vez aquí.</p>
      </div>
    )
  }

  const playingAudios = playingIds
    .map((id) => audios.find((audio) => audio.id === id))
    .filter((audio): audio is LibraryAudio => Boolean(audio))

  return (
    <div className="library-audios-conjuntos">
      <p className="library-audios-conjuntos__hint">
        Puedes tener hasta 2 audios sonando a la vez ({playingIds.length}/2 ahora).
      </p>

      {playingAudios.length > 0 ? (
        <div className="conjunto-players">
          {playingAudios.map((audio) => (
            <MiniReproductorConjunto key={audio.id} audio={audio} onEnded={() => handleEnded(audio.id)} />
          ))}
        </div>
      ) : null}

      <div className="library-section__list">
        {audios.map((audio) => {
          const isPlaying = playingIds.includes(audio.id)

          return (
            <div key={audio.id} className={`library-audio-row${isPlaying ? ' is-playing' : ''}`}>
              <button
                type="button"
                className="library-audio-row__main"
                onClick={() => toggleSlot(audio)}
                aria-pressed={isPlaying}
              >
                <div className="library-audio-row__thumb" aria-hidden="true">
                  <LibraryIcon name="music" />
                </div>
                <div className="library-audio-row__info">
                  <h4>{audio.name}</h4>
                  {audio.duration ? <p>{formatTime(audio.duration)}</p> : null}
                </div>
              </button>

              <div className="library-audio-row__meta">
                <button
                  type="button"
                  className="library-audios-conjuntos__toggle"
                  onClick={() => toggleSlot(audio)}
                  aria-label={isPlaying ? `Quitar ${audio.name} del reproductor conjunto` : `Reproducir ${audio.name}`}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AudiosConjuntos
