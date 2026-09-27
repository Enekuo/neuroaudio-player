import { usePlayer } from '../context/PlayerContext'

type SkipButtonProps = {
  direction: 'backward' | 'forward'
  seconds?: number
  className?: string
}

/**
 * Icono "Reply" de lucide-react (mismos atributos: viewBox 24, stroke 2,
 * cabos y uniones redondeados), pero con DOS paths en vez de uno + CSS
 * transform: el de avanzar se calculó a mano reflejando cada coordenada del
 * de retroceder sobre el eje x=12 (y volteando el sweep-flag del arco, como
 * exige un espejo horizontal correcto). Así no depende de que el navegador
 * rasterice igual un elemento con `scaleX(-1)` que uno sin transformar —
 * quedan garantizados idénticos por construcción, no solo por CSS.
 */
function ReplyBackwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
      <path d="m9 17-5-5 5-5" />
    </svg>
  )
}

function ReplyForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18v-2a4 4 0 0 1 4-4H20" />
      <path d="m15 17 5-5-5-5" />
    </svg>
  )
}

/** Iconos "anterior/siguiente" (barra + triángulo) que usa el móvil. */
function TrackIcon({ direction }: { direction: 'backward' | 'forward' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {direction === 'backward' ? (
        <>
          <rect x="5" y="5" width="2.5" height="14" rx="1" />
          <path d="M19 6.2v11.6a1 1 0 0 1-1.55.83L9.2 12.83a1 1 0 0 1 0-1.66l8.25-5.8A1 1 0 0 1 19 6.2z" />
        </>
      ) : (
        <>
          <rect x="16.5" y="5" width="2.5" height="14" rx="1" />
          <path d="M5 6.2v11.6a1 1 0 0 0 1.55.83l8.25-5.8a1 1 0 0 0 0-1.66l-8.25-5.8A1 1 0 0 0 5 6.2z" />
        </>
      )}
    </svg>
  )
}

function SkipButton({ direction, seconds = 10, className }: SkipButtonProps) {
  const { skip } = usePlayer()
  const label = direction === 'backward' ? `Retroceder ${seconds} segundos` : `Adelantar ${seconds} segundos`

  return (
    <button
      type="button"
      className={`skip-button skip-button--${direction}${className ? ` ${className}` : ''}`}
      aria-label={label}
      onClick={() => skip(direction === 'backward' ? -seconds : seconds)}
    >
      <span className="skip-button__icon">
        {direction === 'backward' ? <ReplyBackwardIcon /> : <ReplyForwardIcon />}
      </span>
      <span className="skip-button__track-icon">
        <TrackIcon direction={direction} />
      </span>
      <span className="skip-button__label" aria-hidden="true">
        {seconds}
      </span>
    </button>
  )
}

export default SkipButton
