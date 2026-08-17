import type { ChangeEvent, FormEvent } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import UserAvatar from '../../auth/components/UserAvatar'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../utils/formatTime'
import RepeatButton from './RepeatButton'
import SkipButton from './SkipButton'

const WAVEFORM_BARS = Array.from({ length: 48 }, (_, index) => {
  const wave = Math.sin(index * 0.45) * 0.5 + 0.5
  const ripple = Math.sin(index * 1.3) * 0.2
  return Math.max(0.12, Math.min(1, wave + ripple))
})

function PantallaCompletaReproductor() {
  const { user } = useAuth()
  const { currentTrack, isPlaying, currentTime, duration, volume, togglePlay, seek, setVolume, collapse } =
    usePlayer()

  const remaining = Math.max(0, duration - currentTime)
  const progressRatio = duration > 0 ? currentTime / duration : 0

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    seek(Number(event.target.value))
  }

  function handleVolumeInput(event: FormEvent<HTMLInputElement>) {
    setVolume(Number(event.currentTarget.value))
  }

  if (!currentTrack) {
    return null
  }

  return (
    <div className="now-playing" role="dialog" aria-modal="true" aria-label="Reproductor a pantalla completa">
      <div className="now-playing__panel">
        <header className="now-playing__header">
          <button
            type="button"
            className="now-playing__icon-button"
            onClick={collapse}
            aria-label="Comprimir reproductor"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <p className="now-playing__eyebrow">Reproduciendo</p>
          <div className="now-playing__header-actions">
            <UserAvatar user={user} className="now-playing__avatar" />
          </div>
        </header>

        <div className="now-playing__wave" aria-hidden="true">
          {WAVEFORM_BARS.map((height, index) => (
            <span
              key={index}
              className={index / WAVEFORM_BARS.length <= progressRatio ? 'is-played' : ''}
              style={{ height: `${Math.round(height * 100)}%` }}
            />
          ))}
        </div>

        <div className="now-playing__info">
          <h2>{currentTrack.name}</h2>
          <p>Tu audio de NeuroAudio</p>
        </div>

        <div className="now-playing__progress">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={handleSeek}
            aria-label="Progreso del audio"
          />
          <div className="now-playing__times">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remaining)}</span>
          </div>
        </div>

        <div className="now-playing__controls">
          <div className="now-playing__transport">
            <SkipButton direction="backward" />

            <button
              type="button"
              className="now-playing__play"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
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

            <SkipButton direction="forward" />
          </div>

          <div className="now-playing__controls-extra">
            <button type="button" className="now-playing__side-button" disabled aria-label="Temporizador (próximamente)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 7v5l3 2" />
              </svg>
            </button>

            <RepeatButton triggerClassName="now-playing__side-button" />
          </div>
        </div>

        <div className="now-playing__footer">
          <div className="now-playing__volume">
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
        </div>
      </div>
    </div>
  )
}

export default PantallaCompletaReproductor
