import type { FormEvent } from 'react'
import LibraryIcon from '../../library/components/LibraryIcon'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../utils/formatTime'
import RepeatButton from './RepeatButton'

function BarraComprimida() {
  const { currentTrack, isPlaying, currentTime, duration, volume, togglePlay, setVolume, expand } = usePlayer()

  if (!currentTrack) {
    return null
  }

  function handleVolumeInput(event: FormEvent<HTMLInputElement>) {
    setVolume(Number(event.currentTarget.value))
  }

  return (
    <footer className="mini-player" aria-label="Reproductor comprimido">
      <div className="mini-player__thumb" aria-hidden="true">
        <LibraryIcon name="music" />
      </div>

      <div className="mini-player__info">
        <div className="mini-player__name">
          <div className="mini-player__name-track">
            <span>{currentTrack.name}</span>
            <span aria-hidden="true">{currentTrack.name}</span>
          </div>
        </div>
        <p>Tu audio de NeuroAudio</p>
      </div>

      <div className="mini-player__right">
        <span className="mini-player__time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="mini-player__volume">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path d="M17.5 8.5a5 5 0 0 1 0 7" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={volume}
            onInput={handleVolumeInput}
            aria-label="Volumen"
          />
        </div>

        <RepeatButton />

        <button type="button" disabled aria-label="Temporizador (próximamente)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>

        <button type="button" onClick={expand} aria-label="Expandir reproductor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>

        <button
          type="button"
          className="mini-player__play"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="7" y="6" width="4" height="12" rx="1" />
              <rect x="13" y="6" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 6.5v11l9-5.5-9-5.5z" />
            </svg>
          )}
        </button>
      </div>
    </footer>
  )
}

export default BarraComprimida
