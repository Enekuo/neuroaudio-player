import { useState, type FormEvent } from 'react'
import { MODOS_PROGRAMACION, type ModoProgramacion } from '../data/programacion'
import { fechaLarga } from '../utils/fechas'
import { IconoCampana, IconoChevron, IconoReproducir } from './iconos'

// Audios entre los que elegir. Vacío hasta conectar la biblioteca real.
const AUDIOS: string[] = []

type FormularioProgramarProps = {
  dia: Date
  idTitulo: string
  onVolver: () => void
  /**
   * Fase de lógica: aquí llegará { audio, hora, modo } para guardarlo.
   * De momento no guarda nada.
   */
  onProgramar: (programacion: {
    audio: string
    hora: string
    modo: ModoProgramacion
  }) => void
}

/**
 * Formulario de «Programar audio» (solo interfaz): qué audio, a qué hora y
 * si solo avisa o se reproduce solo. La lista de audios llegará con la fase
 * de lógica (la biblioteca de la persona); de momento está vacía.
 */
function FormularioProgramar({
  dia,
  idTitulo,
  onVolver,
  onProgramar,
}: FormularioProgramarProps) {
  const [audio, setAudio] = useState('')
  const [hora, setHora] = useState('22:00')
  const [modo, setModo] = useState<ModoProgramacion>('aviso')

  const enviar = (evento: FormEvent) => {
    evento.preventDefault()
    if (!audio || !hora) return
    onProgramar({ audio, hora, modo })
  }

  return (
    <form className="hoja-form" onSubmit={enviar}>
      <header className="hoja-dia__cabecera hoja-dia__cabecera--form">
        <button
          type="button"
          className="hoja-dia__volver"
          aria-label="Volver al día"
          onClick={onVolver}
        >
          <IconoChevron direccion="izquierda" />
        </button>
        <div className="hoja-dia__titulos">
          <h2 id={idTitulo} className="hoja-dia__titulo">
            Programar audio
          </h2>
          <p className="hoja-dia__resumen">{fechaLarga(dia)}</p>
        </div>
      </header>

      <label className="hoja-campo">
        <span className="hoja-campo__etiqueta">Audio</span>
        <span className="hoja-campo__select">
          <select
            value={audio}
            onChange={(e) => setAudio(e.target.value)}
            required
          >
            <option value="" disabled>
              {AUDIOS.length > 0
                ? 'Elige uno de tus audios'
                : 'Aún no hay audios para elegir'}
            </option>
            {AUDIOS.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
          <IconoChevron direccion="derecha" className="hoja-campo__flecha" />
        </span>
      </label>

      <label className="hoja-campo">
        <span className="hoja-campo__etiqueta">Hora</span>
        <input
          className="hoja-campo__hora"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
        />
      </label>

      <fieldset className="hoja-campo hoja-modos">
        <legend className="hoja-campo__etiqueta">
          Cómo quieres que suceda
        </legend>
        {MODOS_PROGRAMACION.map((opcion) => (
          <label
            key={opcion.valor}
            className={`hoja-modo${modo === opcion.valor ? ' is-elegido' : ''}`}
          >
            <input
              type="radio"
              name="modo"
              value={opcion.valor}
              checked={modo === opcion.valor}
              onChange={() => setModo(opcion.valor)}
            />
            <span className="hoja-modo__icono" aria-hidden="true">
              {opcion.valor === 'aviso' ? (
                <IconoCampana />
              ) : (
                <IconoReproducir />
              )}
            </span>
            <span className="hoja-modo__texto">
              <span className="hoja-modo__titulo">{opcion.titulo}</span>
              <span className="hoja-modo__descripcion">
                {opcion.descripcion}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="hoja-form__acciones">
        <button
          type="button"
          className="hoja-dia__secundario"
          onClick={onVolver}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="hoja-dia__primario"
          disabled={!audio || !hora}
        >
          Programar
        </button>
      </div>
    </form>
  )
}

export default FormularioProgramar
