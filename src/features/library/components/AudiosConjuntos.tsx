import { useEffect, useRef, useState } from 'react'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { formatTime } from '../utils/formatTime'
import LibraryIcon from './LibraryIcon'

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
 * Pestaña "Audios conjuntos": permite tener hasta 2 audios sonando a la vez, con sus
 * propios elementos <audio> independientes del reproductor global (PlayerContext/mini-player).
 * Si se pide un 3er audio con 2 ya sonando, se para el más antiguo de los dos y entra el nuevo.
 */
function AudiosConjuntos({ audios, isLoading }: AudiosConjuntosProps) {
  const [playingIds, setPlayingIds] = useState<string[]>([])
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Al salir de esta pestaña (o de Biblioteca), para todo lo que estuviera sonando aquí.
  useEffect(() => {
    return () => {
      audioElementsRef.current.forEach((el) => el.pause())
      audioElementsRef.current.clear()
    }
  }, [])

  function handleEnded(audioId: string) {
    audioElementsRef.current.delete(audioId)
    setPlayingIds((current) => current.filter((id) => id !== audioId))
  }

  function togglePlay(audio: LibraryAudio) {
    setPlayingIds((current) => {
      if (current.includes(audio.id)) {
        audioElementsRef.current.get(audio.id)?.pause()
        audioElementsRef.current.delete(audio.id)
        return current.filter((id) => id !== audio.id)
      }

      if (current.length >= MAX_SIMULTANEOUS) {
        const [oldestId, ...rest] = current
        audioElementsRef.current.get(oldestId)?.pause()
        audioElementsRef.current.delete(oldestId)
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

  return (
    <div className="library-audios-conjuntos">
      <p className="library-audios-conjuntos__hint">
        Puedes tener hasta 2 audios sonando a la vez ({playingIds.length}/2 ahora).
      </p>

      <div className="library-section__list">
        {audios.map((audio) => {
          const isPlaying = playingIds.includes(audio.id)

          return (
            <div key={audio.id} className={`library-audio-row${isPlaying ? ' is-playing' : ''}`}>
              <button
                type="button"
                className="library-audio-row__main"
                onClick={() => togglePlay(audio)}
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
                  onClick={() => togglePlay(audio)}
                  aria-label={isPlaying ? `Pausar ${audio.name}` : `Reproducir ${audio.name}`}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>

              {isPlaying ? (
                <audio
                  ref={(el) => {
                    if (el) {
                      audioElementsRef.current.set(audio.id, el)
                    } else {
                      audioElementsRef.current.delete(audio.id)
                    }
                  }}
                  src={audio.url}
                  autoPlay
                  onEnded={() => handleEnded(audio.id)}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AudiosConjuntos
