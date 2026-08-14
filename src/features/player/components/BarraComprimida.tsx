import type { ChangeEvent } from 'react'
import LibraryIcon from '../../library/components/LibraryIcon'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../utils/formatTime'

function BarraComprimida() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    setVolume,
    playNext,
    playPrevious,
    expand,
  } = usePlayer()

  if (!currentTrack) {
    return null
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    setVolume(Number(event.target.value))
  }

  return (
    <footer className="mini-player" aria-label="Reproductor comprimido">
      <div className="mini-player__left">
        <div className="mini-player__transport">
          <button type="button" aria-label="Anterior" onClick={playPrevious}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 7L5 12l6 5" />
              <path d="M19 7v10" />
            </svg>
          </button>
          <button type="button" aria-label={isPlaying ? 'Pausar' : 'Reproducir'} onClick={togglePlay}>
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
          <button type="button" aria-label="Siguiente" onClick={playNext}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 7l6 5-6 5" />
              <path d="M5 7v10" />
            </svg>
          </button>
        </div>
        <span className="mini-player__time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="mini-player__center">
        <div className="mini-player__thumb" aria-hidden="true">
          <LibraryIcon name="music" />
        </div>
        <div className="mini-player__info">
          <h4>{currentTrack.name}</h4>
          <p>Tu audio de NeuroAudio</p>
        </div>
      </div>

      <div className="mini-player__right">
        <div className="mini-player__volume">
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
            onChange={handleVolumeChange}
            aria-label="Volumen"
          />
        </div>

        <button type="button" disabled aria-label="Repetir (próximamente)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>

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
      </div>
    </footer>
  )
}

export default BarraComprimida
