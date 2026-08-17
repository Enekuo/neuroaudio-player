import { usePlayer } from '../context/PlayerContext'

type SkipButtonProps = {
  direction: 'backward' | 'forward'
  seconds?: number
  className?: string
}

function SkipBackwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 2l-4 4 4 4" />
      <path d="M21 11V9a4 4 0 0 0-4-4H3" />
    </svg>
  )
}

function SkipForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
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
      {direction === 'backward' ? <SkipBackwardIcon /> : <SkipForwardIcon />}
      <span className="skip-button__label" aria-hidden="true">
        {seconds}
      </span>
    </button>
  )
}

export default SkipButton
