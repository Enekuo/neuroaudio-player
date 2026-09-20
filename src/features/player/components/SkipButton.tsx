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

function SkipButton({ direction, seconds = 10, className }: SkipButtonProps) {
  const { skip } = usePlayer()
  const label = direction === 'backward' ? `Retroceder ${seconds} segundos` : `Adelantar ${seconds} segundos`

  return (
    <button
      type="button"
      className={`skip-button${className ? ` ${className}` : ''}`}
      aria-label={label}
      onClick={() => skip(direction === 'backward' ? -seconds : seconds)}
    >
      <span className="skip-button__icon">
        {direction === 'backward' ? <ReplyBackwardIcon /> : <ReplyForwardIcon />}
      </span>
      <span className="skip-button__label" aria-hidden="true">
        {seconds}
      </span>
    </button>
  )
}

export default SkipButton
