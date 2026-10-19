import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AVISO_ERROR_PROFESIONALES,
  TITULO_PROFESIONALES,
} from '../modoProfesionales'
import { useProfesionales } from '../useProfesionales'
import ProfesionalCirculo, {
  ProfesionalCirculoCargando,
} from './ProfesionalCirculo'

/**
 * Inicio del oyente: fila de profesionales que se desliza en horizontal, con
 * la foto circular, el nombre y «Profesional» de cada uno (ver
 * useProfesionales: solo los vinculados o, en modo «todos», todos).
 * - Sin profesionales: no aparece (ni título ni texto vacío). En modo «solo
 *   vinculados», mientras se consultan los vínculos tampoco se pinta nada,
 *   para no enseñar un esqueleto que luego desaparece.
 * - Mientras llegan los perfiles: círculos grises del mismo tamaño.
 * - Si falla: aviso discreto con «Reintentar», sin romper el resto de Inicio.
 * - «Mostrar todos» solo aparece si no caben todos en pantalla.
 */
function FilaTusProfesionales() {
  const { estado, profesionales, esqueletos, reintentar } = useProfesionales()
  const fila = useRef<HTMLUListElement>(null)
  const [noCaben, setNoCaben] = useState(false)

  // ¿Se desborda la fila? Se recalcula al cambiar el tamaño o el contenido.
  useEffect(() => {
    const nodo = fila.current
    if (!nodo) return
    const medir = () => setNoCaben(nodo.scrollWidth > nodo.clientWidth + 1)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [profesionales.length, estado])

  if (estado === 'error') {
    return (
      <section
        className="prof-fila prof-fila--error"
        aria-label={TITULO_PROFESIONALES}
      >
        <p className="prof-fila__aviso">{AVISO_ERROR_PROFESIONALES}</p>
        <button
          type="button"
          className="prof-fila__reintentar"
          onClick={reintentar}
        >
          Reintentar
        </button>
      </section>
    )
  }

  const cargando = estado === 'cargando'
  if (cargando && esqueletos === 0) return null
  if (!cargando && profesionales.length === 0) return null

  return (
    <section
      className="prof-fila"
      aria-labelledby="prof-fila-titulo"
      aria-busy={cargando || undefined}
    >
      <div className="prof-fila__cabecera">
        <h2
          id="prof-fila-titulo"
          className="dashboard-home-page__section-heading"
        >
          {TITULO_PROFESIONALES}
        </h2>
        {!cargando && noCaben && (
          <Link to="/app/profesionales" className="prof-fila__todos">
            Mostrar todos
          </Link>
        )}
      </div>
      <ul ref={fila} className="prof-fila__lista">
        {cargando
          ? Array.from({ length: esqueletos }, (_, i) => (
              <li key={i}>
                <ProfesionalCirculoCargando />
              </li>
            ))
          : profesionales.map(({ uid, perfil }) => (
              <li key={uid}>
                <ProfesionalCirculo
                  profesionalUid={uid}
                  perfil={perfil}
                  to={`/app/profesional/${uid}`}
                />
              </li>
            ))}
      </ul>
    </section>
  )
}

export default FilaTusProfesionales
