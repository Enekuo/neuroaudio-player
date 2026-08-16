import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { usePlayer } from '../context/PlayerContext'

type RepeatButtonProps = {
  triggerClassName?: string
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="repeat-menu__check"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function RepeatButton({ triggerClassName }: RepeatButtonProps) {
  const { repeatMode, repeatTimes, setRepeatOff, setRepeatInfinite, applyRepeatTimes } = usePlayer()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pendingTimes, setPendingTimes] = useState(repeatTimes)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    setPendingTimes(repeatTimes)

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen])

  function handleSelectOff() {
    setRepeatOff()
    setIsMenuOpen(false)
  }

  function handleSelectInfinite() {
    setRepeatInfinite()
    setIsMenuOpen(false)
  }

  function handleApplyTimes() {
    applyRepeatTimes(pendingTimes)
    setIsMenuOpen(false)
  }

  function handleStep(delta: number) {
    setPendingTimes((value) => Math.min(99, Math.max(1, value + delta)))
  }

  function handleTimesInputChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = Number(event.target.value)
    if (Number.isNaN(raw)) {
      return
    }
    setPendingTimes(Math.min(99, Math.max(1, Math.round(raw))))
  }

  const label =
    repeatMode === 'off'
      ? 'Repetición: desactivada'
      : repeatMode === 'infinite'
        ? 'Repetición: bucle infinito activado'
        : `Repetición: ${repeatTimes} veces activado`

  return (
    <div className="repeat-control" ref={wrapperRef}>
      <button
        type="button"
        className={`repeat-control__trigger${triggerClassName ? ` ${triggerClassName}` : ''}${repeatMode !== 'off' ? ' is-active' : ''}`}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-label={label}
        onClick={() => setIsMenuOpen((value) => !value)}
      >
        <RepeatIcon />
        {repeatMode === 'times' ? <span className="repeat-control__badge">{repeatTimes}</span> : null}
      </button>

      {isMenuOpen ? (
        <div className="repeat-menu" role="menu" aria-label="Opciones de repetición">
          <div className="repeat-menu__header">
            <span className="repeat-menu__header-icon" aria-hidden="true">
              <RepeatIcon />
            </span>
            <h3>Repetición</h3>
          </div>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={repeatMode === 'off'}
            className={`repeat-menu__option${repeatMode === 'off' ? ' is-selected' : ''}`}
            onClick={handleSelectOff}
          >
            <span>No repetir</span>
            {repeatMode === 'off' ? <CheckIcon /> : null}
          </button>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={repeatMode === 'infinite'}
            className={`repeat-menu__option${repeatMode === 'infinite' ? ' is-selected' : ''}`}
            onClick={handleSelectInfinite}
          >
            <span>Repetir siempre (bucle)</span>
            {repeatMode === 'infinite' ? <CheckIcon /> : null}
          </button>

          <div className={`repeat-menu__times${repeatMode === 'times' ? ' is-selected' : ''}`}>
            <div className="repeat-menu__times-label">
              <span>Repetir un número de veces</span>
              {repeatMode === 'times' ? <CheckIcon /> : null}
            </div>

            <div className="repeat-menu__stepper">
              <button
                type="button"
                aria-label="Reducir número de repeticiones"
                onClick={() => handleStep(-1)}
                disabled={pendingTimes <= 1}
              >
                −
              </button>
              <span className="repeat-menu__stepper-value">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  value={pendingTimes}
                  onChange={handleTimesInputChange}
                  aria-label="Número de repeticiones"
                />
                <em>veces</em>
              </span>
              <button
                type="button"
                aria-label="Aumentar número de repeticiones"
                onClick={() => handleStep(1)}
                disabled={pendingTimes >= 99}
              >
                +
              </button>
            </div>

            <button type="button" className="repeat-menu__apply" onClick={handleApplyTimes}>
              Aplicar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default RepeatButton
