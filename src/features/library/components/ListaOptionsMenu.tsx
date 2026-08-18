import { useEffect, useRef, useState } from 'react'

type ListaOptionsMenuProps = {
  onRename: () => void
  onDelete: () => void
  className?: string
}

function ListaOptionsMenu({ onRename, onDelete, className }: ListaOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className={`lista-options${className ? ` ${className}` : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className="lista-options__trigger"
        aria-label="Opciones de la lista"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation()
          setIsOpen((value) => !value)
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {isOpen ? (
        <div className="lista-options__menu" role="menu" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            role="menuitem"
            className="lista-options__menu-item"
            onClick={() => {
              setIsOpen(false)
              onRename()
            }}
          >
            Renombrar
          </button>
          <button
            type="button"
            role="menuitem"
            className="lista-options__menu-item lista-options__menu-item--danger"
            onClick={() => {
              setIsOpen(false)
              onDelete()
            }}
          >
            Eliminar
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default ListaOptionsMenu
