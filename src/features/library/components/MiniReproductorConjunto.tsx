import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { formatTime } from '../utils/formatTime'

type MiniReproductorConjuntoProps = {
  audio: LibraryAudio
  onEnded: () => void
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
 * Un reproductor independiente para UN audio dentro de "Audios conjuntos": posee su propio
 * <audio>, con progreso/tiempo/play-pausa/volumen propios, sin relación con PlayerContext
 * (el reproductor global) ni con el otro reproductor conjunto que pueda estar sonando a la vez.
 */
function MiniReproductorConjunto({ audio, onEnded }: MiniReproductorConjuntoProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }

    const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime)
    const handleLoadedMetadata = () => setDuration(audioEl.duration || 0)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audioEl.addEventListener('timeupdate', handleTimeUpdate)
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioEl.addEventListener('play', handlePlay)
    audioEl.addEventListener('pause', handlePause)
    audioEl.addEventListener('ended', onEnded)

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate)
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audioEl.removeEventListener('play', handlePlay)
      audioEl.removeEventListener('pause', handlePause)
      audioEl.removeEventListener('ended', onEnded)
    }
  }, [onEnded])

  function togglePlay() {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }

    if (audioEl.paused) {
      audioEl.play().catch(() => {})
    } else {
      audioEl.pause()
    }
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }
    const value = Number(event.target.value)
    audioEl.currentTime = value
    setCurrentTime(value)
  }

  function handleVolumeInput(event: FormEvent<HTMLInputElement>) {
    const value = Math.min(1, Math.max(0, Number(event.currentTarget.value)))
    const audioEl = audioRef.current
    if (audioEl) {
      audioEl.volume = value
    }
    setVolumeState(value)
  }

  // Mismo truco que en el reproductor a pantalla completa: floor de los dos lados para que
  // el tiempo restante llegue a 0 justo cuando el transcurrido deja de subir.
  const remaining = Math.max(0, Math.floor(duration) - Math.floor(currentTime))
  const progressRatio = duration > 0 ? currentTime / duration : 0

  return (
    <div className="conjunto-player">
      <h4 className="conjunto-player__name" title={audio.name}>
        {audio.name}
      </h4>

      <div className="conjunto-player__progress">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          aria-label={`Progreso de ${audio.name}`}
          style={{ '--progress': `${progressRatio * 100}%` } as CSSProperties}
        />
        <div className="conjunto-player__times">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(remaining)}</span>
        </div>
      </div>

      <div className="conjunto-player__controls">
        <button
          type="button"
          className="conjunto-player__play"
          onClick={togglePlay}
          aria-label={isPlaying ? `Pausar ${audio.name}` : `Reproducir ${audio.name}`}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="conjunto-player__volume">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path d="M17.5 8.5a5 5 0 0 1 0 7" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onInput={handleVolumeInput}
            aria-label={`Volumen de ${audio.name}`}
          />
        </div>
      </div>

      <audio ref={audioRef} src={audio.url} autoPlay preload="metadata" />
    </div>
  )
}

export default MiniReproductorConjunto
