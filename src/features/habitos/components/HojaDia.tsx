import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { MODOS_PROGRAMACION, type AudioProgramado } from '../data/programacion'
import { fechaLarga } from '../utils/fechas'
import FormularioProgramar from './FormularioProgramar'
import {
  IconoCampana,
  IconoCerrar,
  IconoMas,
  IconoOnda,
  IconoPapelera,
  IconoReproducir,
} from './iconos'

type HojaDiaProps = {
  dia: Date
  /** Día anterior a hoy: se puede consultar, pero no programar. */
  esPasado: boolean
  audios: AudioProgramado[]
  /** Se llama cuando la hoja ya ha terminado de cerrarse. */
  onCerrar: () => void
}

type Vista = 'dia' | 'programar'

const etiquetaModo = (modo: AudioProgramado['modo']) =>
  MODOS_PROGRAMACION.find((m) => m.valor === modo)?.corto ?? ''

const ENFOCABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Ventana del día, encima del calendario. En móvil es una hoja que sube desde
 * abajo; en escritorio, una tarjeta centrada. Muestra lo programado ese día
 * (con su hora y un botón de eliminar, de momento solo visual) o, si no hay
 * nada, el botón «Programar audio», que abre el formulario (solo interfaz).
 *
 * Se pinta en <body> para quedar por encima de la barra inferior y del
 * reproductor. Cierra con la X, con Escape o tocando fuera; el foco queda
 * dentro mientras está abierta y vuelve al día al cerrarla.
 */
function HojaDia({ dia, esPasado, audios, onCerrar }: HojaDiaProps) {
  const [vista, setVista] = useState<Vista>('dia')
  // null al abrir: la primera vista no se anima (ya se anima la hoja entera).
  const [sentidoVista, setSentidoVista] = useState<'adelante' | 'atras' | null>(
    null,
  )
  const [cerrando, setCerrando] = useState(false)
  const hoja = useRef<HTMLDivElement>(null)
  const idTitulo = 'hoja-dia-titulo'

  const cerrar = () => setCerrando(true)

  const irA = (destino: Vista) => {
    setSentidoVista(destino === 'programar' ? 'adelante' : 'atras')
    setVista(destino)
  }

  // Foco inicial en la hoja (no en un botón, para no mostrar un anillo de
  // foco nada más abrir con el dedo).
  useEffect(() => {
    hoja.current?.focus({ preventScroll: true })
  }, [])

  // Al cambiar de vista, el foco pasa al principio de la nueva.
  useEffect(() => {
    if (vista === 'programar') {
      hoja.current
        ?.querySelector<HTMLElement>('select, input')
        ?.focus({ preventScroll: true })
    }
  }, [vista])

  // Si la animación de salida no llega a terminar (pestaña en segundo plano…),
  // se desmonta igualmente.
  useEffect(() => {
    if (!cerrando) return
    const seguro = window.setTimeout(onCerrar, 450)
    return () => window.clearTimeout(seguro)
  }, [cerrando, onCerrar])

  const alPulsarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation()
      if (vista === 'programar') irA('dia')
      else cerrar()
      return
    }
    if (evento.key !== 'Tab' || !hoja.current) return
    // Foco atrapado dentro de la hoja.
    const enfocables = [
      ...hoja.current.querySelectorAll<HTMLElement>(ENFOCABLES),
    ]
    if (enfocables.length === 0) return
    const primero = enfocables[0]
    const ultimo = enfocables[enfocables.length - 1]
    if (
      evento.shiftKey &&
      (document.activeElement === primero ||
        document.activeElement === hoja.current)
    ) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primero.focus()
    }
  }

  const resumen =
    audios.length === 0
      ? esPasado
        ? 'No programaste nada este día.'
        : 'Nada programado todavía.'
      : audios.length === 1
        ? '1 audio programado'
        : `${audios.length} audios programados`

  return createPortal(
    <div
      className={`hoja-dia-fondo${cerrando ? ' is-cerrando' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar()
      }}
      // La hoja se pinta en <body>, pero los eventos de React siguen subiendo
      // por el árbol hasta el panel de pestañas: sin esto, deslizar dentro de
      // la hoja cambiaría de pestaña.
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        ref={hoja}
        className={`hoja-dia${cerrando ? ' is-cerrando' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onKeyDown={alPulsarTecla}
        onAnimationEnd={(e) => {
          if (cerrando && e.target === e.currentTarget) onCerrar()
        }}
      >
        <span className="hoja-dia__asa" aria-hidden="true" />

        <div
          key={vista}
          className="hoja-dia__vista"
          data-sentido={sentidoVista ?? undefined}
        >
          {vista === 'dia' ? (
            <>
              <header className="hoja-dia__cabecera">
                <div className="hoja-dia__titulos">
                  <h2 id={idTitulo} className="hoja-dia__titulo">
                    {fechaLarga(dia)}
                  </h2>
                  <p className="hoja-dia__resumen">{resumen}</p>
                </div>
                <button
                  type="button"
                  className="hoja-dia__cerrar"
                  aria-label="Cerrar"
                  onClick={cerrar}
                >
                  <IconoCerrar />
                </button>
              </header>

              {audios.length > 0 ? (
                <>
                  <ul className="hoja-dia__lista">
                    {audios.map((audio) => (
                      <li key={audio.id} className="hoja-dia__audio">
                        <span
                          className="hoja-dia__audio-icono"
                          aria-hidden="true"
                        >
                          <IconoOnda />
                        </span>
                        <span className="hoja-dia__audio-texto">
                          <span className="hoja-dia__audio-nombre">
                            {audio.audioNombre}
                          </span>
                          <span className="hoja-dia__audio-modo">
                            {audio.modo === 'aviso' ? (
                              <IconoCampana />
                            ) : (
                              <IconoReproducir />
                            )}
                            {etiquetaModo(audio.modo)}
                          </span>
                        </span>
                        <time
                          className="hoja-dia__audio-hora"
                          dateTime={audio.hora}
                        >
                          {audio.hora}
                        </time>
                        {/* Solo visual por ahora: borrar llegará con la fase de lógica. */}
                        <button
                          type="button"
                          className="hoja-dia__eliminar"
                          aria-label={`Eliminar «${audio.audioNombre}» de las ${audio.hora}`}
                        >
                          <IconoPapelera />
                        </button>
                      </li>
                    ))}
                  </ul>

                  {!esPasado && (
                    <button
                      type="button"
                      className="hoja-dia__otro"
                      onClick={() => irA('programar')}
                    >
                      <IconoMas />
                      Programar otro audio
                    </button>
                  )}
                </>
              ) : (
                <div className="hoja-dia__vacio">
                  <span className="hoja-dia__vacio-icono" aria-hidden="true">
                    <IconoOnda />
                  </span>
                  {esPasado ? (
                    <p className="hoja-dia__vacio-texto">
                      Los días que ya han pasado solo se pueden consultar.
                    </p>
                  ) : (
                    <>
                      <p className="hoja-dia__vacio-texto">
                        Elige un audio y una hora para que te acompañe este día.
                      </p>
                      <button
                        type="button"
                        className="hoja-dia__primario"
                        onClick={() => irA('programar')}
                      >
                        Programar audio
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <FormularioProgramar
              dia={dia}
              idTitulo={idTitulo}
              onVolver={() => irA('dia')}
              // Sin guardar nada todavía: vuelve a la vista del día.
              onProgramar={() => irA('dia')}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default HojaDia
