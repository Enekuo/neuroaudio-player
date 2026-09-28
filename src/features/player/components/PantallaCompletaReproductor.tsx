import { useEffect, useRef, useState, type AnimationEvent, type ChangeEvent, type CSSProperties } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../utils/formatTime'
import RepeatButton from './RepeatButton'
import SkipButton from './SkipButton'
import ThemeButton, { type ThemeOption } from './ThemeButton'
import VolumeButton from './VolumeButton'
import { useIsMobileLayout } from '../utils/useIsMobileLayout'
import MenuOpcionesAudio from '../../library/components/MenuOpcionesAudio'
import { useUserAudios } from '../../library/hooks/useUserAudios'
import { deleteAudio } from '../../library/services/audioService'
import { alternarFavorito } from '../../library/services/favoritoService'

const WAVEFORM_BARS = Array.from({ length: 48 }, (_, index) => {
  const wave = Math.sin(index * 0.45) * 0.5 + 0.5
  const ripple = Math.sin(index * 1.3) * 0.2
  return Math.max(0.12, Math.min(1, wave + ripple))
})

type PantallaCompletaReproductorProps = {
  isClosing: boolean
  onCloseAnimationEnd: () => void
}

function PantallaCompletaReproductor({ isClosing, onCloseAnimationEnd }: PantallaCompletaReproductorProps) {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, seek, collapse, delayCountdown, repeatMode, repeatTimes, repeatCount } =
    usePlayer()
  const [theme, setTheme] = useState<ThemeOption>('normal')
  const isMobileLayout = useIsMobileLayout()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Favorito real (guardado en el documento del audio): el corazón y la
  // opción del menú de tres puntos leen el estado desde la biblioteca.
  const { audios } = useUserAudios()
  const currentAudio = currentTrack ? audios.find((audio) => audio.id === currentTrack.id) ?? null : null
  const isFavorite = currentAudio?.isFavorite ?? false

  function handleToggleFavorite() {
    if (currentAudio) {
      void alternarFavorito(currentAudio)
    }
  }

  useEffect(() => {
    if (!isMoreMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMoreMenuOpen])

  function handleAddToListClick() {
    setIsMoreMenuOpen(false)
    // TODO: falta backend para asociar audios a listas (igual que en FilaAudio).
  }

  function handleFavoriteMenuClick() {
    setIsMoreMenuOpen(false)
    handleToggleFavorite()
  }

  // Mismo flujo que "Eliminar" en la biblioteca (confirmación + deleteAudio);
  // al terminar se pausa y se comprime el reproductor, porque la pista que
  // estaba abierta ya no existe.
  async function handleDeleteClick() {
    setIsMoreMenuOpen(false)

    if (!currentTrack) {
      return
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el audio "${currentTrack.name}"? Esta acción no se puede deshacer.`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteAudio(currentAudio ?? currentTrack)
      if (isPlaying) {
        togglePlay()
      }
      collapse()
    } catch {
      window.alert('No se pudo eliminar el audio. Inténtalo de nuevo.')
    }
  }

  // El aviso de "animación terminada" burbujea desde cualquier hijo (las barras
  // del waveform animan constantemente), así que solo actuamos cuando es la
  // propia animación de cierre del panel raíz la que ha terminado.
  function handleAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && event.animationName === 'now-playing-out') {
      onCloseAnimationEnd()
    }
  }

  // Cuenta atrás basada en los mismos segundos enteros que ya muestra el tiempo transcurrido
  // (floor de ambos), para que el "-0:00" llegue exactamente cuando el número de la izquierda
  // deja de subir, en vez de un segundo antes por redondeos independientes.
  const remaining = Math.max(0, Math.floor(duration) - Math.floor(currentTime))
  const progressRatio = duration > 0 ? currentTime / duration : 0

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    seek(Number(event.target.value))
  }

  if (!currentTrack) {
    return null
  }

  return (
    <div
      className={`now-playing${isPlaying ? ' is-playing' : ''}${isClosing ? ' is-closing' : ''}${theme !== 'normal' ? ` now-playing--${theme}` : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor a pantalla completa"
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="now-playing__panel">
        <header className="now-playing__header">
          <button
            type="button"
            className="now-playing__icon-button now-playing__collapse"
            onClick={collapse}
            aria-label="Comprimir reproductor"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {isMobileLayout ? (
            // En móvil la cabecera solo lleva la flecha y el menú de tres
            // puntos; tema, repetición, volumen y favorito bajan a
            // .now-playing__extras (encima del play).
            <div className="now-playing__more-wrapper" ref={moreMenuRef}>
              <button
                type="button"
                className="now-playing__icon-button now-playing__more"
                aria-label="Más opciones"
                aria-haspopup="true"
                aria-expanded={isMoreMenuOpen}
                onClick={() => setIsMoreMenuOpen((value) => !value)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {isMoreMenuOpen ? (
                <MenuOpcionesAudio
                  isFavorite={isFavorite}
                  onAddToList={handleAddToListClick}
                  onFavorite={handleFavoriteMenuClick}
                  onDelete={handleDeleteClick}
                />
              ) : null}
            </div>
          ) : (
            <>
              <ThemeButton triggerClassName="now-playing__icon-button" theme={theme} onThemeChange={setTheme} />

              <div className="now-playing__header-actions">
                <RepeatButton triggerClassName="now-playing__icon-button" showVolume />
              </div>
            </>
          )}
        </header>

        <div className="now-playing__body">
          <div className="now-playing__orb">
            <div className="now-playing__wave" aria-hidden="true">
              {WAVEFORM_BARS.map((height, index) => (
                <span
                  key={index}
                  className={index / WAVEFORM_BARS.length <= progressRatio ? 'is-played' : ''}
                  style={{ height: `${Math.round(height * 100)}%` }}
                />
              ))}
            </div>
          </div>

          <div className="now-playing__info">
            <h2>{currentTrack.name}</h2>
            <p className={delayCountdown !== null ? 'now-playing__countdown' : undefined}>
              {delayCountdown !== null ? `Empieza en ${formatTime(delayCountdown)}` : 'Tu audio de NeuroAudio'}
            </p>
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
              style={{ '--progress': `${progressRatio * 100}%` } as CSSProperties}
            />
            <div className="now-playing__times">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(remaining)}</span>
            </div>
          </div>

          {isMobileLayout ? (
            <div className="now-playing__extras">
              <RepeatButton triggerClassName="now-playing__icon-button" showVolume hideVolumeSection pinTopOnOpen />
              <ThemeButton triggerClassName="now-playing__icon-button" theme={theme} onThemeChange={setTheme} />
              <VolumeButton triggerClassName="now-playing__icon-button" />
              <button
                type="button"
                className={`now-playing__icon-button now-playing__favorite${isFavorite ? ' is-active' : ''}`}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                aria-pressed={isFavorite}
                disabled={!currentAudio}
                onClick={handleToggleFavorite}
              >
                <svg viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          ) : null}

          <div className="now-playing__controls">
            <div className="now-playing__transport">
              <SkipButton direction="backward" />

              <button
                type="button"
                className={`now-playing__play${delayCountdown !== null ? ' is-counting-down' : ''}`}
                onClick={togglePlay}
                aria-label={delayCountdown !== null ? 'Cancelar espera' : isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {delayCountdown !== null ? (
                  <span className="now-playing__play-countdown">{delayCountdown}</span>
                ) : isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="7" y="6" width="4" height="12" rx="1" />
                    <rect x="13" y="6" width="4" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 6.5v11l9-5.5-9-5.5z" />
                  </svg>
                )}

                {repeatMode === 'times' ? (
                  <span className="now-playing__play-badge">{repeatTimes - repeatCount}</span>
                ) : null}
              </button>

              <SkipButton direction="forward" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PantallaCompletaReproductor
