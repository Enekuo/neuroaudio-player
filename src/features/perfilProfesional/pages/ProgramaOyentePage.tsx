import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { useReproducirAudioProfesional } from '../../audiosProfesional/useReproducirAudioProfesional'
import FilaAudio from '../../library/components/FilaAudio'
import { usePlayer } from '../../player/context/PlayerContext'
import {
  situacionPrograma,
  textoPaso,
  textoRitmo,
  type EstadoPaso,
  type ProgramaProfesional,
} from '../../programasProfesional/modelo'
import { marcarPaso } from '../../programasProfesional/programaService'
import {
  useAudiosDePasos,
  useProgramasDelOyente,
} from '../../programasProfesional/useProgramasDelOyente'
import { escucharVinculoActivo } from '../perfilService'
import { DescripcionAudio, IconoInfo } from '../vista/DescripcionAudio'
import { IconoCandado, IconoHecho, IconoPrograma } from '../vista/FilaPrograma'

const formatoDia = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
})

const APERTURA = {
  libre: 'Todos los pasos están abiertos: escúchalos a tu ritmo.',
  orden: 'Cada paso se abre al completar el anterior.',
  calendario: 'Se abre un paso nuevo según el ritmo.',
} as const

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

/** Por qué está cerrado un paso: «Se abre al completar el paso 2», «Se abre mañana»… */
function motivoCerrado(paso: EstadoPaso, ahora: Date) {
  if (paso.estado !== 'cerrado') return ''
  if (paso.abreEl) {
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    const dias = Math.round(
      (paso.abreEl.getTime() - hoy.getTime()) / 86_400_000,
    )
    if (dias <= 1) return 'Se abre mañana'
    return `Se abre el ${formatoDia.format(paso.abreEl)}`
  }
  return paso.trasPaso
    ? `Se abre al completar el paso ${paso.trasPaso}`
    : 'Aún no está abierto'
}

/**
 * Un programa en la app del oyente (/app/profesional/:uid/programa/:id):
 * sus pasos numerados, con ✓ en los completados, el siguiente listo y
 * candado en los cerrados (que no se reproducen y dicen por qué). Arriba,
 * «Paso 2 de 7». Sin «Reproducir todo» ni «Aleatorio»: se toca un paso y
 * suena ese, como paso del programa (al terminar se completa solo).
 */
function ProgramaOyentePage() {
  const { uid = '', programaId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { currentTrack, isPlaying, togglePlay } = usePlayer()
  const reproducirAudio = useReproducirAudioProfesional()
  const [vinculado, setVinculado] = useState<boolean | null>(null)
  const [descripcion, setDescripcion] = useState<AudioProfesional | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [compacta, setCompacta] = useState(false)
  const [ahora, setAhora] = useState(() => new Date())
  const titulo = useRef<HTMLHeadingElement>(null)

  const esPropia = Boolean(user && user.uid === uid)
  useEffect(() => {
    if (!uid || !user) return
    if (user.uid === uid) {
      setVinculado(true)
      return
    }
    return escucharVinculoActivo(uid, user.uid, setVinculado, () =>
      setVinculado(false),
    )
  }, [uid, user])

  // «Por calendario»: los pasos se abren solos al cambiar el día.
  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(new Date()), 60_000)
    return () => window.clearInterval(reloj)
  }, [])

  const { paraTodos, privados } = useProgramasDelOyente(
    uid,
    user?.uid ?? null,
    vinculado === true,
  )
  const cargado = paraTodos !== null && privados !== null
  const datos = [...(paraTodos ?? []), ...(privados ?? [])].find(
    (p) => p.programa.id === programaId,
  )
  const programa: ProgramaProfesional | null = datos?.programa ?? null
  const audios = useAudiosDePasos(programa?.pasos ?? [])

  useEffect(() => {
    const nodo = titulo.current
    if (!nodo) return
    const observador = new IntersectionObserver(
      ([entrada]) => setCompacta(!entrada.isIntersecting),
      { rootMargin: '-64px 0px 0px 0px', threshold: 0 },
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [programa?.id])

  const volver = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate(`/app/profesional/${uid}`)
  }
  const estilo = { '--lista-color': '#2680eb' } as CSSProperties

  const noDisponible = vinculado === false || (cargado && !programa)
  if (noDisponible) {
    return (
      <section
        className="lista-detalle lista-detalle--rica"
        aria-label="Programa"
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
          <p className="pro-audios__aviso">Este programa no está disponible.</p>
        </div>
      </section>
    )
  }

  const situacion =
    programa && datos
      ? situacionPrograma(programa, datos.completados, datos.dia1, ahora)
      : null
  const pasosListos =
    programa && programa.pasos.every((id) => id in audios) ? programa : null

  const reproducir = async (audio: AudioProfesional) => {
    if (!programa) return
    if (currentTrack?.id === audio.id) {
      togglePlay()
      return
    }
    setError(null)
    const ok = await reproducirAudio(audio, uid, {
      id: programa.id,
      profesionalUid: programa.profesionalUid,
    })
    if (!ok)
      setError(`No se pudo cargar «${audio.titulo}». Inténtalo de nuevo.`)
  }

  const marcar = async (audio: AudioProfesional, completado: boolean) => {
    if (!programa || !user) return
    setError(null)
    try {
      await marcarPaso(
        programa,
        user.uid,
        audio.id,
        completado,
        datos?.completados ?? [],
      )
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  let contenido
  if (!situacion || !pasosListos || !programa) {
    contenido = (
      <div
        className="prof-pagina__esqueleto"
        role="status"
        aria-label="Cargando pasos"
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="prof-pagina__esqueleto-fila" />
        ))}
      </div>
    )
  } else {
    contenido = (
      <>
        {error && <p className="lista-detalle__error">{error}</p>}
        <div className="library-section__list library-section__list--plana programa-pasos">
          {programa.pasos.map((id, indice) => {
            const audio = audios[id]
            const paso = situacion.pasos[indice]
            if (!audio) {
              return (
                <FilaAudio
                  key={id}
                  name="Paso no disponible"
                  detalle="Tu profesional lo ha quitado o ya no se puede oír"
                  isDeleting={false}
                  onPlay={() => {}}
                  deshabilitada
                  claseExtra="fila-paso fila-paso--cerrado"
                  miniatura={<span>{indice + 1}</span>}
                  opciones={[]}
                />
              )
            }
            const cerrado = paso.estado === 'cerrado'
            const hecho = paso.estado === 'completado'
            const detalle = hecho
              ? 'Completado'
              : paso.estado === 'siguiente'
                ? 'Te toca'
                : cerrado
                  ? motivoCerrado(paso, ahora)
                  : undefined
            return (
              <FilaAudio
                key={id}
                name={`${indice + 1}. ${audio.titulo}`}
                duration={audio.duracionSegundos}
                detalle={detalle}
                isDeleting={false}
                isPlaying={currentTrack?.id === audio.id && isPlaying}
                onPlay={() => void reproducir(audio)}
                deshabilitada={cerrado}
                claseExtra={`fila-paso fila-paso--${paso.estado}`}
                miniatura={
                  hecho ? (
                    <IconoHecho />
                  ) : cerrado ? (
                    <IconoCandado />
                  ) : (
                    <span>{indice + 1}</span>
                  )
                }
                opciones={[
                  // «Ver descripción», solo si tiene.
                  ...(audio.descripcion.trim()
                    ? [
                        {
                          etiqueta: 'Ver descripción',
                          icono: <IconoInfo />,
                          onClick: () => setDescripcion(audio),
                        },
                      ]
                    : []),
                  ...(cerrado
                    ? []
                    : [
                        {
                          etiqueta: hecho
                            ? 'Desmarcar como completado'
                            : 'Marcar como completado',
                          icono: <IconoHecho />,
                          onClick: () => void marcar(audio, !hecho),
                        },
                      ]),
                ]}
              />
            )
          })}
        </div>
      </>
    )
  }

  const total = situacion?.total ?? programa?.pasos.length ?? 0
  const hechos = situacion?.completados ?? 0

  return (
    <section
      className="lista-detalle lista-detalle--rica"
      aria-label={programa?.titulo || 'Programa'}
      style={estilo}
    >
      <div className="lista-detalle__backdrop" aria-hidden="true">
        <span
          className="lista-detalle__backdrop-art"
          style={{
            background: 'linear-gradient(160deg, #2680eb 0%, #0b1a33 100%)',
          }}
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
          {programa?.titulo}
        </span>
      </div>

      <div className="lista-detalle__hero">
        <div className="lista-detalle__hero-inner">
          <div className="lista-detalle__hero-main">
            <div
              className="lista-detalle__cover programa-portada"
              aria-hidden="true"
            >
              <IconoPrograma />
            </div>
            <div className="lista-detalle__hero-info">
              {programa ? (
                <>
                  <h1 ref={titulo}>{programa.titulo}</h1>
                  <p>
                    {situacion
                      ? textoPaso(situacion.pasoActual, total)
                      : `${total} pasos`}{' '}
                    · {textoRitmo(programa.ritmo, programa.ritmoDias)}
                  </p>
                  {situacion && total > 0 && (
                    <div
                      className="programa-progreso"
                      role="progressbar"
                      aria-label="Pasos completados"
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={hechos}
                      aria-valuetext={`${hechos} de ${total} completados`}
                    >
                      <span style={{ width: `${(hechos / total) * 100}%` }} />
                    </div>
                  )}
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
        {programa?.descripcion.trim() && (
          <p className="prof-lista__descripcion">{programa.descripcion}</p>
        )}
        {programa && (
          <p className="programa-apertura">
            {APERTURA[programa.apertura]}
            {esPropia ? ' (Así lo verán tus oyentes.)' : ''}
          </p>
        )}
        {contenido}
      </div>

      {descripcion && (
        <DescripcionAudio
          audio={descripcion}
          onCerrar={() => setDescripcion(null)}
        />
      )}
    </section>
  )
}

export default ProgramaOyentePage
