import { useEffect, useRef, type FormEvent, type PointerEvent } from 'react'
import { flushSync } from 'react-dom'
import LibraryIcon from '../../library/components/LibraryIcon'
import { usePlayer } from '../context/PlayerContext'
import { formatTime } from '../utils/formatTime'
import { markOpenedWithViewTransition } from '../utils/playerTransition'
import RepeatButton from './RepeatButton'

type BarraComprimidaProps = {
  /** El usuario ha cerrado el mini-reproductor deslizándolo (para el aviso "Deshacer"). */
  onDismiss?: () => void
}

// Umbrales del gesto sobre la barra (móvil).
const SWIPE_OPEN_PX = 40 // hacia arriba: abre el reproductor completo
const SWIPE_CLOSE_PX = 80 // hacia abajo o a un lado: cierra el mini-reproductor

function prefersReducedMotion() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion')
  )
}

function SkipBackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 3.5v3.7h3.7" />
      <text x="12" y="15.2" textAnchor="middle" fontSize="7.2" fontWeight="700" fill="currentColor" stroke="none">
        10
      </text>
    </svg>
  )
}

function SkipForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 3.5v3.7h-3.7" />
      <text x="12" y="15.2" textAnchor="middle" fontSize="7.2" fontWeight="700" fill="currentColor" stroke="none">
        10
      </text>
    </svg>
  )
}

function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4v4h4" />
    </svg>
  )
}

function BarraComprimida({ onDismiss }: BarraComprimidaProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    setVolume,
    skip,
    expand,
    delayCountdown,
    repeatMode,
    repeatTimes,
    repeatCount,
    isBuffering,
    loadError,
    hasEnded,
    retryLoad,
    dismissPlayer,
  } = usePlayer()

  const barRef = useRef<HTMLElement>(null)
  const dragRef = useRef<{ x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null)

  // Mientras el mini-reproductor está visible, el contenido de las pantallas
  // reserva hueco abajo para que la barra no tape el final.
  useEffect(() => {
    document.documentElement.classList.add('has-mini-player')
    return () => document.documentElement.classList.remove('has-mini-player')
  }, [])

  if (!currentTrack) {
    return null
  }

  function handleVolumeInput(event: FormEvent<HTMLInputElement>) {
    setVolume(Number(event.currentTarget.value))
  }

  // Abrir el reproductor completo: con View Transitions (si el navegador las
  // tiene y no hay "reducir movimiento"), la imagen del recuadro crece hasta
  // la imagen grande y la barra se funde; si no, la hoja que sube de siempre.
  function openFull() {
    const doc = document as Document & { startViewTransition?: (callback: () => void) => { finished: Promise<void> } }
    if (!doc.startViewTransition || prefersReducedMotion()) {
      expand()
      return
    }
    document.documentElement.classList.add('np-vt-open')
    markOpenedWithViewTransition()
    const transition = doc.startViewTransition(() => {
      flushSync(() => expand())
    })
    transition.finished.finally(() => document.documentElement.classList.remove('np-vt-open'))
  }

  function handleAreaClick() {
    if (dragRef.current?.moved) {
      return
    }
    if (loadError) {
      retryLoad()
      return
    }
    openFull()
  }

  // --- Gestos: arriba abre; abajo o a un lado (>80px) cierra. ---------------
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragRef.current = { x: event.clientX, y: event.clientY, dx: 0, dy: 0, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    const bar = barRef.current
    if (!drag || !bar) {
      return
    }
    drag.dx = event.clientX - drag.x
    drag.dy = event.clientY - drag.y
    if (Math.abs(drag.dx) > 8 || Math.abs(drag.dy) > 8) {
      drag.moved = true
    }
    if (!drag.moved) {
      return
    }
    // La barra sigue al dedo 1:1 en horizontal y hacia abajo; hacia arriba
    // ofrece resistencia (rubber band) porque ese gesto abre, no mueve.
    const horizontal = Math.abs(drag.dx) > Math.abs(drag.dy)
    const offsetX = horizontal ? drag.dx : 0
    const offsetY = horizontal ? 0 : drag.dy > 0 ? drag.dy : drag.dy * 0.25
    bar.style.transition = 'none'
    bar.style.transform = `translate(${offsetX}px, ${offsetY}px)`
    bar.style.opacity = String(1 - Math.min(0.6, (Math.abs(offsetX) + Math.max(0, offsetY)) / 260))
  }

  function resetBar() {
    const bar = barRef.current
    if (!bar) {
      return
    }
    bar.style.transition = 'transform 260ms var(--ease-out-strong), opacity 200ms ease'
    bar.style.transform = ''
    bar.style.opacity = ''
  }

  function handlePointerUp() {
    const drag = dragRef.current
    const bar = barRef.current
    if (!drag || !bar || !drag.moved) {
      return
    }
    // El clic que sigue al gesto no debe abrir nada.
    window.setTimeout(() => {
      dragRef.current = null
    }, 0)

    const horizontal = Math.abs(drag.dx) > Math.abs(drag.dy)

    if (!horizontal && drag.dy < -SWIPE_OPEN_PX) {
      resetBar()
      openFull()
      return
    }

    if ((horizontal && Math.abs(drag.dx) > SWIPE_CLOSE_PX) || (!horizontal && drag.dy > SWIPE_CLOSE_PX)) {
      const exit = horizontal ? `translate(${Math.sign(drag.dx) * 120}%, 0)` : 'translate(0, 160%)'
      bar.style.transition = 'transform 220ms var(--ease-out-strong), opacity 200ms ease'
      bar.style.transform = exit
      bar.style.opacity = '0'
      window.setTimeout(() => {
        dismissPlayer()
        onDismiss?.()
      }, 200)
      return
    }

    resetBar()
  }

  // Línea secundaria: solo aparece cuando hay algo que avisar (cuenta atrás
  // del retardo o error de carga); en reposo, solo el título.
  const subtitle = loadError
    ? 'No se pudo cargar. Toca para reintentar'
    : delayCountdown !== null
      ? `Empieza en ${formatTime(delayCountdown)}`
      : null
  const showSpinner = isBuffering && !loadError && delayCountdown === null

  return (
    <footer
      ref={barRef}
      className={`mini-player${isPlaying ? ' is-playing' : ''}${loadError ? ' has-error' : ''}`}
      role="region"
      aria-label="Reproductor"
    >
      {/* Solo móvil: zona táctil que cubre todo el mini-reproductor. Tocar
          abre el reproductor completo (o reintenta si hubo un error);
          deslizar arriba abre y abajo/lateral cierra. Los controles quedan
          por encima y hacen solo lo suyo. */}
      <button
        type="button"
        className="mini-player__open-area"
        onClick={handleAreaClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetBar}
        aria-label={loadError ? 'Reintentar cargar el audio' : 'Abrir reproductor'}
      />

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
        {subtitle ? (
          <p className={delayCountdown !== null ? 'mini-player__countdown' : 'mini-player__error'}>{subtitle}</p>
        ) : null}
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

        <button type="button" className="mini-player__expand" onClick={expand} aria-label="Expandir reproductor">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>

        {/* Solo móvil: retroceder / avanzar 10 s a los lados del play. */}
        <button type="button" className="mini-player__skip" onClick={() => skip(-10)} aria-label="Retroceder 10 segundos">
          <SkipBackIcon />
        </button>

        <button
          type="button"
          className={`mini-player__play${showSpinner ? ' is-loading' : ''}`}
          aria-label={
            delayCountdown !== null ? 'Cancelar espera' : hasEnded ? 'Volver a reproducir' : isPlaying ? 'Pausar' : 'Reproducir'
          }
          aria-busy={showSpinner}
          onClick={togglePlay}
        >
          {delayCountdown !== null ? (
            <span className="mini-player__play-countdown">{delayCountdown}</span>
          ) : showSpinner ? (
            <span className="mini-player__spinner" aria-hidden="true" />
          ) : hasEnded ? (
            <ReplayIcon />
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
            <span className="mini-player__play-badge">{repeatTimes - repeatCount}</span>
          ) : null}
        </button>

        <button type="button" className="mini-player__skip" onClick={() => skip(10)} aria-label="Avanzar 10 segundos">
          <SkipForwardIcon />
        </button>
      </div>

    </footer>
  )
}

export default BarraComprimida
