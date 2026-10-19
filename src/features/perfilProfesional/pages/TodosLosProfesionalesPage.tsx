import { Link } from 'react-router-dom'
import {
  AVISO_ERROR_PROFESIONALES,
  MOSTRAR_TODOS_LOS_PROFESIONALES,
  TITULO_PROFESIONALES,
} from '../modoProfesionales'
import { useProfesionales } from '../useProfesionales'
import ProfesionalCirculo, {
  ProfesionalCirculoCargando,
} from '../vista/ProfesionalCirculo'

/**
 * «Mostrar todos» de la fila de Inicio (/app/profesionales): todos en
 * cuadrícula, con la misma tarjeta circular que la fila. PRUEBA TEMPORAL: en
 * modo «todos» carga de 50 en 50 con «Cargar más».
 */
function TodosLosProfesionalesPage() {
  const {
    estado,
    profesionales,
    esqueletos,
    reintentar,
    hayMas,
    cargarMas,
    cargaMas,
  } = useProfesionales()

  let contenido
  if (estado === 'error') {
    contenido = (
      <div className="prof-fila prof-fila--error">
        <p className="prof-fila__aviso">{AVISO_ERROR_PROFESIONALES}</p>
        <button
          type="button"
          className="prof-fila__reintentar"
          onClick={reintentar}
        >
          Reintentar
        </button>
      </div>
    )
  } else if (estado === 'cargando') {
    contenido = (
      <ul className="prof-todos__rejilla" aria-busy="true">
        {Array.from({ length: Math.max(esqueletos, 3) }, (_, i) => (
          <li key={i}>
            <ProfesionalCirculoCargando />
          </li>
        ))}
      </ul>
    )
  } else if (profesionales.length === 0) {
    contenido = (
      <p className="pro-audios__aviso">
        {MOSTRAR_TODOS_LOS_PROFESIONALES
          ? 'Todavía no hay profesionales.'
          : 'Cuando un profesional te invite, aparecerá aquí.'}
      </p>
    )
  } else {
    contenido = (
      <>
        <ul className="prof-todos__rejilla">
          {profesionales.map(({ uid, perfil }) => (
            <li key={uid}>
              <ProfesionalCirculo
                profesionalUid={uid}
                perfil={perfil}
                to={`/app/profesional/${uid}`}
              />
            </li>
          ))}
        </ul>
        {hayMas && (
          <div className="prof-todos__mas">
            {cargaMas === 'error' && (
              <p className="prof-fila__aviso">No se pudieron cargar más.</p>
            )}
            <button
              type="button"
              className="prof-fila__reintentar"
              onClick={cargarMas}
              disabled={cargaMas === 'cargando'}
            >
              {cargaMas === 'cargando'
                ? 'Cargando…'
                : cargaMas === 'error'
                  ? 'Reintentar'
                  : 'Cargar más'}
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <section className="page perfil-pagina" aria-labelledby="prof-todos-titulo">
      <div className="perfil-pagina__contenido prof-todos">
        <Link to="/app" className="perfil-pagina__volver">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
          Inicio
        </Link>
        <h1 id="prof-todos-titulo" className="page__title">
          {TITULO_PROFESIONALES}
        </h1>
        {contenido}
      </div>
    </section>
  )
}

export default TodosLosProfesionalesPage
