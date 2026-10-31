import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import type { AudioProfesional } from '../../audiosProfesional/modelo'

// Ventana «Ver descripción» de un audio de profesional: la usan las filas
// (FilasAudioProfesional, ventana centrada) y el reproductor a pantalla
// completa (DescripcionAudioEnZona, solo sobre la parte de arriba).

export function IconoInfo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  )
}

/** Al abrir, el foco va a «Cerrar»; Escape cierra; al cerrar, el foco vuelve. */
function useFocoYEscape(
  cerrar: RefObject<HTMLButtonElement>,
  onCerrar: () => void,
) {
  // Ref: la página se repinta con el reproductor y no debe robar el foco.
  const alCerrar = useRef(onCerrar)
  alCerrar.current = onCerrar
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    cerrar.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar.current()
    }
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      anterior?.focus()
    }
  }, [cerrar])
}

/** Título, descripción (como texto), aviso de salud y «Cerrar». */
function ContenidoDescripcion({
  audio,
  onCerrar,
  cerrar,
}: {
  audio: AudioProfesional
  onCerrar: () => void
  cerrar: RefObject<HTMLButtonElement>
}) {
  return (
    <>
      <h2 id="descripcion-audio-titulo">{audio.titulo}</h2>
      <p className="prof-pagina__descripcion">
        {audio.descripcion.trim() || 'Este audio no tiene descripción.'}
      </p>
      {audio.contieneSalud && (
        <p className="prof-pagina__salud">
          Este audio trata temas de salud. No sustituye la atención de un
          profesional sanitario; si lo necesitas, acude a uno.
        </p>
      )}
      <div className="modal-actions">
        <button
          ref={cerrar}
          type="button"
          className="modal-actions__submit"
          onClick={onCerrar}
        >
          Cerrar
        </button>
      </div>
    </>
  )
}

/** Descripción de un audio (y su aviso de salud), en una pequeña ventana. */
export function DescripcionAudio({
  audio,
  onCerrar,
}: {
  audio: AudioProfesional
  onCerrar: () => void
}) {
  const cerrar = useRef<HTMLButtonElement>(null)
  useFocoYEscape(cerrar, onCerrar)

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div
        className="modal-card prof-pagina__ficha"
        role="dialog"
        aria-modal="true"
        aria-labelledby="descripcion-audio-titulo"
      >
        <ContenidoDescripcion
          audio={audio}
          onCerrar={onCerrar}
          cerrar={cerrar}
        />
      </div>
    </div>,
    document.body,
  )
}

/**
 * La misma descripción, en el reproductor a pantalla completa: solo encima
 * de su parte de arriba (de la cabecera al título y el profesional). Se pinta
 * dentro del reproductor y llega justo hasta donde empieza la barra de
 * minutos, que con el resto de controles queda libre y funcionando.
 */
export function DescripcionAudioEnZona({
  audio,
  onCerrar,
}: {
  audio: AudioProfesional
  onCerrar: () => void
}) {
  const cerrar = useRef<HTMLButtonElement>(null)
  const zona = useRef<HTMLDivElement>(null)
  const [alto, setAlto] = useState<number | null>(null)
  // Al cerrar, primero su animación de salida y después se quita. Por si la
  // animación no llegara a terminar (pestaña oculta…), un plazo de reserva.
  const [cerrando, setCerrando] = useState(false)
  const cerrada = useRef(false)
  const terminar = () => {
    if (cerrada.current) return
    cerrada.current = true
    onCerrar()
  }
  const pedirCierre = () => setCerrando(true)
  useEffect(() => {
    if (!cerrando) return
    const reserva = window.setTimeout(terminar, 400)
    return () => window.clearTimeout(reserva)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cerrando])
  useFocoYEscape(cerrar, pedirCierre)

  // Alto de la zona: del borde de arriba del reproductor al principio de la
  // barra de minutos (cambia con el tamaño de pantalla y el contenido).
  useLayoutEffect(() => {
    const reproductor = zona.current?.parentElement
    if (!reproductor) return
    const medir = () => {
      const progreso = reproductor.querySelector('.now-playing__progress')
      if (!progreso) return
      const arriba = reproductor.getBoundingClientRect().top
      setAlto(
        progreso.getBoundingClientRect().top -
          arriba +
          reproductor.scrollTop -
          6,
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(reproductor)
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [])

  return (
    <div
      ref={zona}
      className={`now-playing__descripcion${cerrando ? ' is-cerrando' : ''}`}
      onAnimationEnd={(e) => {
        if (cerrando && e.target === e.currentTarget) terminar()
      }}
      // Tocar la parte oscura (fuera de la tarjeta) también la cierra; la
      // tarjeta no, y la parte de abajo del reproductor queda fuera de esta
      // capa, así que tocarla no la cierra.
      onClick={(e) => {
        if (e.target === e.currentTarget) pedirCierre()
      }}
      // Se mide antes de pintar (useLayoutEffect): no hace falta ocultarla
      // mientras tanto (y oculta no se podría poner el foco en «Cerrar»).
      style={
        alto === null ? undefined : ({ height: `${alto}px` } as CSSProperties)
      }
    >
      <div
        className="modal-card prof-pagina__ficha now-playing__descripcion-tarjeta"
        role="dialog"
        aria-labelledby="descripcion-audio-titulo"
      >
        <ContenidoDescripcion
          audio={audio}
          onCerrar={pedirCierre}
          cerrar={cerrar}
        />
      </div>
    </div>
  )
}
