import { useEffect, useRef } from 'react'
import { minutosYSegundos } from '../continuar/posiciones'
import '../../../styles/continuar.css'

type Props = {
  titulo: string
  segundo: number
  onContinuar: () => void
  onEmpezar: () => void
  /** Cerrar sin elegir: no suena nada. */
  onCerrar: () => void
}

/**
 * «¿Continuar donde lo dejaste?»: sale al pulsar un audio que se dejó a
 * medias, antes de que suene. Mismo estilo que las otras ventanas de la app
 * del oyente (modal-overlay / modal-card). Con teclado: el foco empieza en
 * «Continuar», Tab se queda dentro de la ventana y Escape la cierra; al
 * cerrar, el foco vuelve a donde estaba.
 */
function DialogoContinuar({ titulo, segundo, onContinuar, onEmpezar, onCerrar }: Props) {
  const tarjeta = useRef<HTMLDivElement>(null)
  const principal = useRef<HTMLButtonElement>(null)
  const momento = minutosYSegundos(segundo)

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null
    principal.current?.focus()
    return () => antes?.focus?.()
  }, [])

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCerrar()
        return
      }
      if (e.key !== 'Tab' || !tarjeta.current) return
      const botones = [...tarjeta.current.querySelectorAll<HTMLButtonElement>('button')]
      const primero = botones[0]
      const ultimo = botones[botones.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [onCerrar])

  return (
    <div className="modal-overlay continuar-overlay" role="presentation" onClick={onCerrar}>
      <div
        ref={tarjeta}
        className="modal-card continuar-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="continuar-titulo"
        aria-describedby="continuar-texto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="continuar-card__icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v4h4" />
            <path d="M12 8v4l2.5 2.5" />
          </svg>
        </div>
        <div>
          <h2 id="continuar-titulo">¿Continuar donde lo dejaste?</h2>
          <p id="continuar-texto" className="modal-card__subtitle continuar-card__texto">
            Te quedaste en el minuto <strong>{momento}</strong> de «{titulo}».
          </p>
        </div>
        <div className="modal-actions continuar-card__acciones">
          <button type="button" className="modal-actions__cancel" onClick={onEmpezar}>
            Empezar de nuevo
          </button>
          <button ref={principal} type="button" className="modal-actions__submit" onClick={onContinuar}>
            Continuar desde {momento}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DialogoContinuar
