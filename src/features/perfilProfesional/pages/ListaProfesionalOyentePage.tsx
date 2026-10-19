import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import {
  escucharAudiosParaMi,
  escucharAudiosPublicados,
} from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import {
  CUSTOM_TEMPLATE,
  getTemplateById,
} from '../../library/data/plantillasListas'
import { escucharLista } from '../../listasProfesional/listaProfesionalService'
import {
  audiosVisibles,
  nombreLista,
  type ListaProfesional,
} from '../../listasProfesional/modelo'
import {
  estiloPortadaLista,
  useImagenLista,
} from '../../listasProfesional/vista/imagenLista'
import FilasAudioProfesional from '../vista/FilasAudioProfesional'

type Carga<T> =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'no-disponible' }
  | { estado: 'listo'; datos: T }

const sinPermiso = (error: Error) =>
  (error as Error & { code?: string }).code === 'permission-denied' ||
  error.message.includes('permission')

// "8 audios · 1 h 12 min", como en las listas de la app.
function resumen(total: number, segundos: number) {
  const audios = total === 1 ? '1 audio' : `${total} audios`
  if (segundos <= 0) return audios
  const minutos = Math.max(1, Math.round(segundos / 60))
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  const duracion =
    horas > 0 ? `${horas} h${resto > 0 ? ` ${resto} min` : ''}` : `${resto} min`
  return `${audios} · ${duracion}`
}

function IconoVolver() {
  return (
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
  )
}

/**
 * Una lista de un profesional en la app del oyente
 * (/app/profesional/:uid/lista/:listaId), igual que una lista de la app
 * (ListaDetalle): portada grande, título, descripción y sus audios en orden,
 * en las filas de siempre.
 * - Sin «Reproducir todo» ni «Aleatorio»: se toca una fila y suena ese audio.
 * - Solo listas publicadas con vínculo activo (lo garantizan las reglas) y,
 *   de ellas, solo los audios que este oyente puede escuchar.
 * - Si no, «no disponible», sin revelar nada.
 */
function ListaProfesionalOyentePage() {
  const { uid = '', listaId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [intento, setIntento] = useState(0)
  const [lista, setLista] = useState<Carga<ListaProfesional>>({
    estado: 'cargando',
  })
  const [generales, setGenerales] = useState<AudioProfesional[] | null>(null)
  const [paraMi, setParaMi] = useState<AudioProfesional[] | null>(null)
  const [errorAudios, setErrorAudios] = useState(false)
  const [compacta, setCompacta] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!listaId) return
    setLista({ estado: 'cargando' })
    return escucharLista(
      listaId,
      (l) =>
        setLista(
          // Solo una lista publicada de este profesional.
          l && l.profesionalUid === uid && l.estado === 'publicado'
            ? { estado: 'listo', datos: l }
            : { estado: 'no-disponible' },
        ),
      (error) =>
        setLista({ estado: sinPermiso(error) ? 'no-disponible' : 'error' }),
    )
  }, [uid, listaId, intento])

  // Sus audios se piden cuando la lista se puede ver (hay vínculo activo).
  const listaVisible = lista.estado === 'listo'
  useEffect(() => {
    if (!uid || !listaVisible) return
    setErrorAudios(false)
    return escucharAudiosPublicados(uid, setGenerales, () =>
      setErrorAudios(true),
    )
  }, [uid, listaVisible, intento])

  useEffect(() => {
    if (!uid || !user || !listaVisible) return
    return escucharAudiosParaMi(uid, user.uid, setParaMi, () =>
      setErrorAudios(true),
    )
  }, [uid, user, listaVisible, intento])

  // Como en las listas: al bajar, la barra superior muestra el nombre.
  useEffect(() => {
    const nodo = titulo.current
    if (!nodo) return
    const observador = new IntersectionObserver(
      ([entrada]) => setCompacta(!entrada.isIntersecting),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [lista.estado])

  const datos = lista.estado === 'listo' ? lista.datos : null
  const imagen = useImagenLista(datos)

  // Sus audios, en el orden de la lista: solo los que puede escuchar.
  const audios = useMemo(() => {
    if (!datos || !generales || !paraMi) return null
    const porId = new Map(
      [...generales, ...paraMi].map((a) => [a.id, a] as const),
    )
    return audiosVisibles(datos, new Set(porId.keys())).map(
      (id) => porId.get(id) as AudioProfesional,
    )
  }, [datos, generales, paraMi])

  const volver = () => {
    // Si se llegó desde la app, atrás; si se abrió el enlace, a su página.
    if (location.key !== 'default') navigate(-1)
    else navigate(`/app/profesional/${uid}`)
  }
  const reintentar = () => setIntento((n) => n + 1)

  const plantilla = datos?.plantillaId
    ? getTemplateById(datos.plantillaId)
    : CUSTOM_TEMPLATE
  const estilo = { '--lista-color': plantilla.gradientFrom } as CSSProperties

  if (lista.estado === 'no-disponible' || lista.estado === 'error') {
    return (
      <section
        className="lista-detalle lista-detalle--rica"
        aria-label="Lista"
        style={estilo}
      >
        <div className="lista-detalle__topbar">
          <button
            type="button"
            className="lista-detalle__back"
            onClick={volver}
            aria-label="Volver"
          >
            <IconoVolver />
          </button>
        </div>
        <div className="lista-detalle__body prof-pagina__estado">
          {lista.estado === 'no-disponible' ? (
            <p className="pro-audios__aviso">Esta lista no está disponible.</p>
          ) : (
            <div className="prof-fila prof-fila--error">
              <p className="prof-fila__aviso">No se pudo cargar esta lista.</p>
              <button
                type="button"
                className="prof-fila__reintentar"
                onClick={reintentar}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </section>
    )
  }

  const nombre = datos ? nombreLista(datos) : ''
  const fondo = imagen ?? plantilla.cardImage ?? null
  const duracion = (audios ?? []).reduce(
    (total, a) => total + a.duracionSegundos,
    0,
  )

  let contenido
  if (errorAudios) {
    contenido = (
      <div className="prof-fila prof-fila--error">
        <p className="prof-fila__aviso">No se pudieron cargar los audios.</p>
        <button
          type="button"
          className="prof-fila__reintentar"
          onClick={reintentar}
        >
          Reintentar
        </button>
      </div>
    )
  } else if (!audios) {
    contenido = (
      <div
        className="prof-pagina__esqueleto"
        role="status"
        aria-label="Cargando audios"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="prof-pagina__esqueleto-fila" />
        ))}
      </div>
    )
  } else if (audios.length === 0) {
    contenido = (
      <div className="lista-detalle__empty">
        <p>Aún no hay audios en esta lista.</p>
      </div>
    )
  } else {
    contenido = <FilasAudioProfesional profesionalUid={uid} audios={audios} />
  }

  return (
    <section
      className="lista-detalle lista-detalle--rica"
      aria-label={nombre || 'Lista'}
      style={estilo}
    >
      {/* Fondo ambiental: la propia portada, muy ampliada y desenfocada. */}
      <div className="lista-detalle__backdrop" aria-hidden="true">
        <span
          className="lista-detalle__backdrop-art"
          style={
            fondo
              ? { backgroundImage: `url(${fondo})` }
              : {
                  background: `linear-gradient(160deg, ${plantilla.gradientFrom} 0%, ${plantilla.gradientTo} 100%)`,
                }
          }
        />
      </div>

      <div className={`lista-detalle__topbar${compacta ? ' is-compact' : ''}`}>
        <button
          type="button"
          className="lista-detalle__back"
          onClick={volver}
          aria-label="Volver"
        >
          <IconoVolver />
        </button>
        <span className="lista-detalle__topbar-title" aria-hidden={!compacta}>
          {nombre}
        </span>
      </div>

      <div className="lista-detalle__hero">
        <div className="lista-detalle__hero-inner">
          <div className="lista-detalle__hero-main">
            {datos ? (
              <div
                className="lista-detalle__cover"
                aria-hidden="true"
                style={estiloPortadaLista(datos.plantillaId, imagen, 'detalle')}
              />
            ) : (
              <div
                className="lista-detalle__cover prof-pagina__cover-cargando"
                aria-hidden="true"
              />
            )}
            <div className="lista-detalle__hero-info">
              {datos ? (
                <>
                  <h1 ref={titulo}>{nombre}</h1>
                  {audios && <p>{resumen(audios.length, duracion)}</p>}
                </>
              ) : (
                <div aria-hidden="true">
                  <span className="prof-pagina__linea prof-pagina__linea--titulo" />
                  <span className="prof-pagina__linea" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lista-detalle__body">
        {datos?.descripcion.trim() && (
          <p className="prof-lista__descripcion">{datos.descripcion}</p>
        )}
        {contenido}
      </div>
    </section>
  )
}

export default ListaProfesionalOyentePage
