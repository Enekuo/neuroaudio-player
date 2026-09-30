import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import SettingsSwitch from '../../settings/components/SettingsSwitch'
import { usePlayer, type RepeatMode } from '../context/PlayerContext'
import { isNativeApp } from '../utils/platform'

type RepeatButtonProps = {
  triggerClassName?: string
  // Solo la instancia de la pantalla completa la activa: añade el control de
  // volumen y el retardo de inicio dentro de este mismo panel, y cambia el
  // título a "Programar audio".
  showVolume?: boolean
  // En móvil el volumen tiene su propio botón (VolumeButton) en la fila de
  // encima del play, así que el panel "Programar audio" no lo repite.
  hideVolumeSection?: boolean
  // Al abrirse, el panel fija su borde superior donde aparece (según el CSS)
  // y a partir de ahí crece hacia abajo al desplegar secciones (p. ej. al
  // activar el retardo), en vez de crecer hacia arriba desde el borde inferior.
  pinTopOnOpen?: boolean
}

const DELAY_PRESETS = [
  { seconds: 15, label: '15 seg' },
  { seconds: 30, label: '30 seg' },
  { seconds: 60, label: '1 min' },
  { seconds: 120, label: '2 min' },
  { seconds: 300, label: '5 min' },
]

const DELAY_STEP_SECONDS = 15
const DELAY_MAX_SECONDS = 30 * 60

function formatDelaySummary(seconds: number): string {
  if (seconds <= 0) {
    return '0 seg'
  }
  if (seconds < 60) {
    return `${seconds} seg`
  }
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder === 0 ? `${minutes} min` : `${minutes}:${String(remainder).padStart(2, '0')} min`
}

function formatDelayClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
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

export function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M17.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.75h.01" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="repeat-menu__section-chevron"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

type ScheduleSection = 'repeat' | 'volume' | 'delay'

function RepeatButton({ triggerClassName, showVolume, hideVolumeSection, pinTopOnOpen }: RepeatButtonProps) {
  const {
    repeatMode,
    repeatTimes,
    setRepeatOff,
    setRepeatInfinite,
    applyRepeatTimes,
    volume,
    setVolume,
    startDelayEnabled,
    startDelaySeconds,
    applyStartDelay,
    hasSavedSchedule,
    isSavingSchedule,
    toggleSavedSchedule,
  } = usePlayer()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Selección todavía no confirmada dentro del panel: se ve resaltada en azul al
  // tocar una opción, pero no se aplica de verdad hasta pulsar "Aplicar". Si se
  // cierra el panel sin aplicar (tocando fuera), se descarta y no cambia nada.
  const [pendingMode, setPendingMode] = useState<RepeatMode>(repeatMode)
  const [pendingTimes, setPendingTimes] = useState(repeatTimes)
  // Igual que el repeat: cambios pendientes hasta pulsar "Aplicar" dentro de
  // esta misma sección.
  const [pendingDelayEnabled, setPendingDelayEnabled] = useState(startDelayEnabled)
  const [pendingDelaySeconds, setPendingDelaySeconds] = useState(startDelaySeconds)
  const [isDelayCustom, setIsDelayCustom] = useState(
    !DELAY_PRESETS.some((preset) => preset.seconds === startDelaySeconds),
  )
  // Panel "Programar audio": empieza siempre con las tres partes (Repeticiones/
  // Volumen/Retardo de inicio) plegadas; solo una puede estar abierta a la vez.
  const [expandedSection, setExpandedSection] = useState<ScheduleSection | null>(null)
  // Borde superior (px) del panel ya fijado con pinTopOnOpen: el aviso del
  // retardo se coloca justo encima del panel entero, por fuera.
  const [pinnedMenuTop, setPinnedMenuTop] = useState<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Se mide antes de pintar, con el panel aún en su posición inicial del CSS
  // (anclado por abajo). offsetTop no se ve afectado por el transform de la
  // animación de entrada, así que da la posición real.
  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!isMenuOpen || !pinTopOnOpen || !menu) {
      return
    }
    const top = menu.offsetTop
    menu.style.top = `${top}px`
    menu.style.bottom = 'auto'
    menu.style.maxHeight = `calc(100dvh - ${top}px - env(safe-area-inset-bottom, 0px) - 12px)`
    setPinnedMenuTop(top)
  }, [isMenuOpen, pinTopOnOpen])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    setPendingMode(repeatMode)
    setPendingTimes(repeatTimes)
    setPendingDelayEnabled(startDelayEnabled)
    setPendingDelaySeconds(startDelaySeconds)
    setIsDelayCustom(!DELAY_PRESETS.some((preset) => preset.seconds === startDelaySeconds))
    setExpandedSection(null)

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen])

  function toggleSection(section: ScheduleSection) {
    setExpandedSection((current) => (current === section ? null : section))
  }

  function handleApply() {
    if (pendingMode === 'off') {
      setRepeatOff()
    } else if (pendingMode === 'infinite') {
      setRepeatInfinite()
    } else {
      applyRepeatTimes(pendingTimes)
    }
    setIsMenuOpen(false)
  }

  function handleStep(delta: number) {
    setPendingMode('times')
    setPendingTimes((value) => Math.min(99, Math.max(1, value + delta)))
  }

  function handleTimesInputChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = Number(event.target.value)
    setPendingMode('times')
    if (Number.isNaN(raw)) {
      return
    }
    setPendingTimes(Math.min(99, Math.max(1, Math.round(raw))))
  }

  function handleVolumeInput(event: FormEvent<HTMLInputElement>) {
    setVolume(Number(event.currentTarget.value))
  }

  function handleDelayToggle(checked: boolean) {
    setPendingDelayEnabled(checked)
    // Al activarlo se despliega la sección directamente (y se pliega
    // cualquier otra que estuviera abierta); al desactivarlo, si era esta la
    // que estaba abierta, se pliega — ya no hay nada que configurar.
    if (checked) {
      setExpandedSection('delay')
    } else {
      setExpandedSection((current) => (current === 'delay' ? null : current))
    }
  }

  function handleDelayPresetSelect(seconds: number) {
    setIsDelayCustom(false)
    setPendingDelaySeconds(seconds)
  }

  function handleDelayCustomSelect() {
    setIsDelayCustom(true)
  }

  function handleDelayStep(delta: number) {
    setIsDelayCustom(true)
    setPendingDelaySeconds((value) => Math.min(DELAY_MAX_SECONDS, Math.max(0, value + delta)))
  }

  function handleApplyDelay() {
    applyStartDelay(pendingDelayEnabled, pendingDelaySeconds)
    setIsMenuOpen(false)
  }

  const menuTitle = showVolume ? 'Programar audio' : 'Repetición'

  const showDelayNotice = pendingDelayEnabled && !isNativeApp()
  // Con el panel fijado (móvil, fila de encima del play) el aviso va fuera,
  // encima del panel completo; si no, sigue encima del retardo de inicio.
  const isNoticeOutside = pinTopOnOpen === true && pinnedMenuTop !== null
  const delayNotice = (
    <div
      className={`repeat-menu__delay-notice${isNoticeOutside ? ' repeat-menu__delay-notice--outside' : ''}`}
      role="note"
      style={isNoticeOutside ? { bottom: `calc(100% - ${pinnedMenuTop}px + 12px)` } : undefined}
    >
      <InfoIcon />
      <span>
        Aviso: con la pantalla apagada, el retardo puede no funcionar correctamente según tu
        dispositivo o navegador. Para una experiencia completa, descarga la app.
      </span>
    </div>
  )

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
      </button>

      {isMenuOpen && showDelayNotice && isNoticeOutside ? delayNotice : null}

      {isMenuOpen ? (
        <div ref={menuRef} className={`repeat-menu${showVolume ? ' repeat-menu--schedule' : ''}`} role="menu" aria-label={`Opciones de ${menuTitle.toLowerCase()}`}>
          <div className="repeat-menu__header">
            <span className="repeat-menu__header-icon" aria-hidden="true">
              <RepeatIcon />
            </span>
            <h3>{menuTitle}</h3>

            {showVolume ? (
              <button
                type="button"
                className={`repeat-menu__save${hasSavedSchedule ? ' is-saved' : ''}`}
                aria-pressed={hasSavedSchedule}
                aria-label={hasSavedSchedule ? 'Quitar programación guardada de este audio' : 'Guardar esta programación para este audio'}
                disabled={isSavingSchedule}
                onClick={toggleSavedSchedule}
              >
                <BookmarkIcon filled={hasSavedSchedule} />
              </button>
            ) : null}
          </div>

          {showVolume ? (
            <>
              <div className="repeat-menu__section">
                <button
                  type="button"
                  className="repeat-menu__section-toggle"
                  aria-expanded={expandedSection === 'repeat'}
                  onClick={() => toggleSection('repeat')}
                >
                  <span>Repeticiones</span>
                  <ChevronIcon />
                </button>

                {expandedSection === 'repeat' ? (
                  <div className="repeat-menu__section-body">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={pendingMode === 'off'}
                      className={`repeat-menu__option${pendingMode === 'off' ? ' is-selected' : ''}`}
                      onClick={() => setPendingMode('off')}
                    >
                      <span>No repetir</span>
                      {pendingMode === 'off' ? <CheckIcon /> : null}
                    </button>

                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={pendingMode === 'infinite'}
                      className={`repeat-menu__option${pendingMode === 'infinite' ? ' is-selected' : ''}`}
                      onClick={() => setPendingMode('infinite')}
                    >
                      <span>Repetir siempre (bucle)</span>
                      {pendingMode === 'infinite' ? <CheckIcon /> : null}
                    </button>

                    <div className={`repeat-menu__times${pendingMode === 'times' ? ' is-selected' : ''}`}>
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={pendingMode === 'times'}
                        className="repeat-menu__times-label"
                        onClick={() => setPendingMode('times')}
                      >
                        <span>Repetir un número de veces</span>
                        {pendingMode === 'times' ? <CheckIcon /> : null}
                      </button>

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
                    </div>

                    <button type="button" className="repeat-menu__apply" onClick={handleApply}>
                      Aplicar
                    </button>
                  </div>
                ) : null}
              </div>

              {hideVolumeSection ? null : (
              <div className="repeat-menu__section">
                <button
                  type="button"
                  className="repeat-menu__section-toggle"
                  aria-expanded={expandedSection === 'volume'}
                  onClick={() => toggleSection('volume')}
                >
                  <span>Volumen</span>
                  <ChevronIcon />
                </button>

                {expandedSection === 'volume' ? (
                  <div className="repeat-menu__section-body">
                    <div className="repeat-menu__volume">
                      <span className="repeat-menu__volume-icon" aria-hidden="true">
                        <VolumeIcon />
                      </span>
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
                ) : null}
              </div>
              )}

              <div className="repeat-menu__delay-group">
                {showDelayNotice && !isNoticeOutside ? delayNotice : null}

                <div className="repeat-menu__section">
                  <div className="repeat-menu__section-header-row">
                    <div className={`repeat-menu__section-heading${expandedSection === 'delay' ? ' is-expanded' : ''}`}>
                      <span className="repeat-menu__section-title-group">
                        <span className="repeat-menu__section-title">Retardo de inicio</span>
                        <span className="repeat-menu__section-subtitle">
                          El audio tarda en empezar · {pendingDelayEnabled ? formatDelaySummary(pendingDelaySeconds) : 'Desactivado'}
                        </span>
                      </span>
                    </div>

                    <SettingsSwitch
                      checked={pendingDelayEnabled}
                      onChange={handleDelayToggle}
                      ariaLabel="Activar retardo de inicio"
                    />
                  </div>

                  {expandedSection === 'delay' ? (
                  <div className="repeat-menu__section-body">
                    {pendingDelayEnabled ? (
                      <>
                        <div className="repeat-menu__chips">
                          {DELAY_PRESETS.map((preset) => (
                            <button
                              key={preset.seconds}
                              type="button"
                              className={`repeat-menu__chip${!isDelayCustom && pendingDelaySeconds === preset.seconds ? ' is-selected' : ''}`}
                              onClick={() => handleDelayPresetSelect(preset.seconds)}
                            >
                              {preset.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            className={`repeat-menu__chip${isDelayCustom ? ' is-selected' : ''}`}
                            onClick={handleDelayCustomSelect}
                          >
                            Personalizado
                          </button>
                        </div>

                        {isDelayCustom ? (
                          <div className="repeat-menu__times is-selected">
                            <span className="repeat-menu__times-label">
                              <span>Tiempo exacto (min:seg)</span>
                            </span>

                            <div className="repeat-menu__stepper">
                              <button
                                type="button"
                                aria-label="Reducir 15 segundos"
                                onClick={() => handleDelayStep(-DELAY_STEP_SECONDS)}
                                disabled={pendingDelaySeconds <= 0}
                              >
                                −
                              </button>
                              <span className="repeat-menu__stepper-value">
                                <strong>{formatDelayClock(pendingDelaySeconds)}</strong>
                              </span>
                              <button
                                type="button"
                                aria-label="Aumentar 15 segundos"
                                onClick={() => handleDelayStep(DELAY_STEP_SECONDS)}
                                disabled={pendingDelaySeconds >= DELAY_MAX_SECONDS}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    <button type="button" className="repeat-menu__apply" onClick={handleApplyDelay}>
                      Aplicar
                    </button>
                  </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={pendingMode === 'off'}
                className={`repeat-menu__option${pendingMode === 'off' ? ' is-selected' : ''}`}
                onClick={() => setPendingMode('off')}
              >
                <span>No repetir</span>
                {pendingMode === 'off' ? <CheckIcon /> : null}
              </button>

              <button
                type="button"
                role="menuitemradio"
                aria-checked={pendingMode === 'infinite'}
                className={`repeat-menu__option${pendingMode === 'infinite' ? ' is-selected' : ''}`}
                onClick={() => setPendingMode('infinite')}
              >
                <span>Repetir siempre (bucle)</span>
                {pendingMode === 'infinite' ? <CheckIcon /> : null}
              </button>

              <div className={`repeat-menu__times${pendingMode === 'times' ? ' is-selected' : ''}`}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={pendingMode === 'times'}
                  className="repeat-menu__times-label"
                  onClick={() => setPendingMode('times')}
                >
                  <span>Repetir un número de veces</span>
                  {pendingMode === 'times' ? <CheckIcon /> : null}
                </button>

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
              </div>

              <button type="button" className="repeat-menu__apply" onClick={handleApply}>
                Aplicar
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default RepeatButton
