import { Link } from 'react-router-dom'
import {
  situacionPrograma,
  textoPaso,
  textoRitmo,
} from '../../programasProfesional/modelo'
import type { ProgramaDelOyente } from '../../programasProfesional/useProgramasDelOyente'

/** Icono de programa: pasos en fila, el primero hecho. */
export function IconoPrograma() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3.5 6.5 1.5 1.5 3-3" />
      <path d="M11 6.5h9.5" />
      <circle cx="5.5" cy="12.5" r="1.6" />
      <path d="M11 12.5h9.5" />
      <circle cx="5.5" cy="18.5" r="1.6" />
      <path d="M11 18.5h9.5" />
    </svg>
  )
}

export function IconoHecho() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function IconoCandado() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9.5" rx="2.2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

/**
 * Un programa en la página de su profesional (grupo «Programas» o «Para
 * ti»): nombre, en qué paso va y el ritmo. Abre su página.
 */
function FilaPrograma({
  profesionalUid,
  datos,
}: {
  profesionalUid: string
  datos: ProgramaDelOyente
}) {
  const { programa, completados } = datos
  // El paso que toca no depende de la fecha (solo de lo completado).
  const { pasoActual, total } = situacionPrograma(
    programa,
    completados,
    datos.dia1,
    new Date(),
  )
  return (
    <div className="library-audio-row library-audio-row--fila fila-programa">
      <Link
        to={`/app/profesional/${profesionalUid}/programa/${programa.id}`}
        className="library-audio-row__main"
      >
        <div className="library-audio-row__thumb" aria-hidden="true">
          <IconoPrograma />
        </div>
        <div className="library-audio-row__info">
          <h4>{programa.titulo}</h4>
          <p>
            {textoPaso(pasoActual, total)} ·{' '}
            {textoRitmo(programa.ritmo, programa.ritmoDias)}
          </p>
        </div>
      </Link>
      <div
        className="library-audio-row__meta fila-programa__ir"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </div>
    </div>
  )
}

export default FilaPrograma
