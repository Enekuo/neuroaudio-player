import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { VolumeIcon } from './RepeatButton'

type VolumeButtonProps = {
  triggerClassName?: string
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Botón de volumen propio (en móvil, fila de encima del play). Al pulsarlo
// aparece encima del botón, flotando sobre el reproductor, una barra vertical
// que se arrastra con el dedo, con el porcentaje exacto encima.
function VolumeButton({ triggerClassName }: VolumeButtonProps) {
  const { volume, setVolume } = usePlayer()
  const [isOpen, setIsOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const percent = clampPercent(volume * 100)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function setPercent(value: number) {
    setVolume(clampPercent(value) / 100)
  }

  // Posición vertical del dedo → porcentaje (abajo 0 %, arriba 100 %).
  function updateFromPointer(clientY: number) {
    const track = trackRef.current
    if (!track) {
      return
    }
    const rect = track.getBoundingClientRect()
    setPercent(((rect.bottom - clientY) / rect.height) * 100)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientY)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event.clientY)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }
    if (event.key in steps) {
      event.preventDefault()
      setPercent(percent + steps[event.key])
    } else if (event.key === 'Home') {
      event.preventDefault()
      setPercent(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setPercent(100)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="volume-control" ref={wrapperRef}>
      <button
        type="button"
        className={`volume-control__trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Volumen"
        onClick={() => setIsOpen((value) => !value)}
      >
        <VolumeIcon />
      </button>

      {isOpen ? (
        <div className="volume-popover">
          <p className="volume-popover__value">{percent}%</p>

          <div
            ref={trackRef}
            className="volume-popover__track"
            role="slider"
            tabIndex={0}
            aria-label="Volumen"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent} %`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onKeyDown={handleKeyDown}
          >
            <div className="volume-popover__fill" style={{ height: `${percent}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default VolumeButton
