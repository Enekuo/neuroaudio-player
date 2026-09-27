import { useEffect, useRef, useState } from 'react'

export type ThemeOption = 'claro' | 'normal' | 'oscuro'

const THEME_OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: 'claro', label: 'Claro' },
  { value: 'normal', label: 'Normal' },
  { value: 'oscuro', label: 'Oscuro' },
]

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="m4.93 4.93 1.77 1.77" />
      <path d="m17.3 17.3 1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="m4.93 19.07 1.77-1.77" />
      <path d="m17.3 6.7 1.77-1.77" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

type ThemeButtonProps = {
  triggerClassName?: string
  theme: ThemeOption
  onThemeChange: (theme: ThemeOption) => void
}

// Controlado desde fuera (PantallaCompletaReproductor guarda la elección y
// pinta el fondo del reproductor según el tema); este componente solo es el
// botón + desplegable.
function ThemeButton({ triggerClassName, theme, onThemeChange }: ThemeButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  function handleSelect(value: ThemeOption) {
    onThemeChange(value)
    setIsMenuOpen(false)
  }

  return (
    <div className="theme-control" ref={wrapperRef}>
      <button
        type="button"
        className={`theme-control__trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
        aria-label="Elegir tema"
        onClick={() => setIsMenuOpen((value) => !value)}
      >
        <ThemeIcon />
      </button>

      {isMenuOpen ? (
        <div className="theme-menu" role="menu" aria-label="Opciones de tema">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.value}
              className={`theme-menu__option${theme === option.value ? ' is-selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {theme === option.value ? <CheckIcon /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ThemeButton
