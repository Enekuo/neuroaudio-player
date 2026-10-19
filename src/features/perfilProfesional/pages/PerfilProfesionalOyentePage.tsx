import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import {
  escucharAudio,
  escucharAudiosParaMi,
  escucharAudiosPublicados,
  escucharEnviosParaMi,
} from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import {
  juntarParaTi,
  vigilarRecibidos,
  type AudioRecibido,
} from '../../audiosProfesional/recibidos'
import TemplateIcon from '../../library/components/TemplateIcon'
import { escucharListasPublicadas } from '../../listasProfesional/listaProfesionalService'
import {
  audiosVisibles,
  nombreLista,
  type ListaProfesional,
} from '../../listasProfesional/modelo'
import {
  estiloPortadaLista,
  useImagenLista,
} from '../../listasProfesional/vista/imagenLista'
import { useFotoPerfil } from '../fotos/useFotoPerfil'
import {
  iniciales,
  perfilVacio,
  REDES,
  type PerfilProfesional,
} from '../modelo'
import { escucharPerfil, escucharVinculoActivo } from '../perfilService'
import FilasAudioProfesional from '../vista/FilasAudioProfesional'
import VistaPerfilOyente from '../vista/VistaPerfilOyente'

const claveBienvenida = (uid: string) => `neuroaudio:bienvenida-vista:${uid}`

// Pestañas de la página («Listas» solo si tiene alguna publicada).
type Pestana = 'audios' | 'listas' | 'sobre'

type Carga<T> =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'no-disponible' }
  | { estado: 'listo'; datos: T }

const sinPermiso = (error: Error) =>
  (error as Error & { code?: string }).code === 'permission-denied' ||
  error.message.includes('permission')

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

/** ¿Tiene algo que enseñar la pestaña «Sobre»? (sin huecos vacíos) */
function tieneSobre(perfil: PerfilProfesional) {
  return Boolean(
    perfil.dedicacion.trim() ||
    perfil.respuesta ||
    REDES.some((red) => perfil.enlaces[red]?.startsWith('https://')) ||
    perfil.fotos.some((f) => f.id !== perfil.fotoPrincipalId) ||
    perfil.secciones.some(
      (s) =>
        s.visible &&
        (s.titulo.trim() || s.texto.trim() || s.fotoIds.length > 0),
    ),
  )
}

/**
 * Página de un profesional en la app del oyente (/app/profesional/:uid), con
 * el aspecto de una lista de la app: fondo ambiental, cabecera con su foto
 * grande (o sus iniciales), nombre y frase, y sus audios en las filas de
 * siempre. Su perfil completo va en la pestaña «Sobre…».
 * - Sin «Reproducir todo» ni «Aleatorio»: se toca una fila y suena ese audio.
 * - Con vínculo activo: sus audios, la bienvenida y «Sobre».
 * - PRUEBA TEMPORAL (modo «todos», ver modoProfesionales.ts): sin vínculo se
 *   ven la cabecera y «Sobre», sin bienvenida, y en «Audios» un aviso; sus
 *   audios ni se piden (las reglas tampoco los dejarían leer).
 * - Si el perfil no existe o no se puede leer (en modo «solo vinculados»,
 *   sin vínculo): «no disponible», sin revelar nada ni enlazar a ningún sitio.
 * - Los audios «Para ti» (personales dirigidos a este oyente) van aparte, y
 *   solo si hay alguno.
 * - Pestaña «Listas»: sus listas publicadas, solo con vínculo activo y si
 *   alguna tiene audios que este oyente puede escuchar.
 */
function PerfilProfesionalOyentePage() {
  const { uid = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [intento, setIntento] = useState(0)
  // null: aún no se sabe · 'error': no se pudo comprobar.
  const [vinculado, setVinculado] = useState<boolean | 'error' | null>(null)
  const [perfil, setPerfil] = useState<Carga<PerfilProfesional>>({
    estado: 'cargando',
  })
  const [generales, setGenerales] = useState<Carga<AudioProfesional[]>>({
    estado: 'cargando',
  })
  const [paraMi, setParaMi] = useState<Carga<AudioProfesional[]>>({
    estado: 'cargando',
  })
  // Los que te ha enviado desde «Mis audios» (también van en «Para ti»).
  const [recibidos, setRecibidos] = useState<Carga<AudioRecibido[]>>({
    estado: 'cargando',
  })
  const [listas, setListas] = useState<ListaProfesional[]>([])
  const [pestana, setPestana] = useState<Pestana>('audios')
  const [compacta, setCompacta] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  const [mostrarBienvenida] = useState(() => {
    try {
      return localStorage.getItem(claveBienvenida(uid)) !== '1'
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!uid) return
    setPerfil({ estado: 'cargando' })
    return escucharPerfil(
      uid,
      // Sin perfil: a un oyente vinculado se le enseña lo que haya (sus
      // audios); a los demás, «no disponible» (ver más abajo).
      (p) =>
        setPerfil(
          p ? { estado: 'listo', datos: p } : { estado: 'no-disponible' },
        ),
      (error) =>
        setPerfil({ estado: sinPermiso(error) ? 'no-disponible' : 'error' }),
    )
  }, [uid, intento])

  useEffect(() => {
    if (!uid || !user) return
    setVinculado(null)
    return escucharVinculoActivo(
      uid,
      user.uid,
      (activo) => setVinculado(activo),
      () => setVinculado('error'),
    )
  }, [uid, user, intento])

  // Los audios solo se piden con vínculo activo.
  useEffect(() => {
    if (!uid || vinculado !== true) return
    setGenerales({ estado: 'cargando' })
    return escucharAudiosPublicados(
      uid,
      (datos) => setGenerales({ estado: 'listo', datos }),
      () => setGenerales({ estado: 'error' }),
    )
  }, [uid, intento, vinculado])

  useEffect(() => {
    if (!uid || !user || vinculado !== true) return
    setParaMi({ estado: 'cargando' })
    return escucharAudiosParaMi(
      uid,
      user.uid,
      (datos) => setParaMi({ estado: 'listo', datos }),
      () => setParaMi({ estado: 'error' }),
    )
  }, [uid, user, intento, vinculado])

  useEffect(() => {
    if (!uid || !user || vinculado !== true) return
    setRecibidos({ estado: 'cargando' })
    return vigilarRecibidos(
      uid,
      (onEnvios, onError) =>
        escucharEnviosParaMi(uid, user.uid, onEnvios, onError),
      escucharAudio,
      (datos) => setRecibidos({ estado: 'listo', datos }),
      () => setRecibidos({ estado: 'error' }),
    )
  }, [uid, user, intento, vinculado])

  // Sus listas publicadas, también solo con vínculo activo. Si fallan, la
  // pestaña simplemente no aparece (los audios siguen a mano).
  useEffect(() => {
    if (!uid || vinculado !== true) return
    return escucharListasPublicadas(uid, setListas, () => setListas([]))
  }, [uid, intento, vinculado])

  // La bienvenida (solo para sus oyentes) ya se ha visto: la próxima vez no sale.
  useEffect(() => {
    if (
      vinculado !== true ||
      perfil.estado !== 'listo' ||
      !perfil.datos.bienvenida.trim()
    )
      return
    try {
      localStorage.setItem(claveBienvenida(uid), '1')
    } catch {
      // Sin almacenamiento (modo privado…): se volverá a ver, sin más.
    }
  }, [perfil, uid, vinculado])

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
  }, [perfil.estado, vinculado])

  // Un oyente vinculado ve la página aunque el profesional aún no tenga perfil.
  const datosPerfil =
    perfil.estado === 'listo'
      ? perfil.datos
      : perfil.estado === 'no-disponible' && vinculado === true
        ? perfilVacio()
        : null
  // Listas con algún audio que este oyente puede escuchar (sus generales
  // publicados y los suyos personales), con cuántos.
  const listasVisibles = useMemo(() => {
    const disponibles = new Set(
      [
        ...(generales.estado === 'listo' ? generales.datos : []),
        ...(paraMi.estado === 'listo' ? paraMi.datos : []),
      ].map((a) => a.id),
    )
    return listas
      .map((lista) => ({
        lista,
        cuantos: audiosVisibles(lista, disponibles).length,
      }))
      .filter((l) => l.cuantos > 0)
  }, [listas, generales, paraMi])

  const fotoPrincipal = useFotoPerfil(
    uid,
    datosPerfil?.fotoPrincipalId ?? null,
    'cuadrada',
  )

  const volver = () => {
    // Si se llegó desde la app, atrás; si se abrió el enlace directo, a Inicio.
    if (location.key !== 'default') navigate(-1)
    else navigate('/app')
  }

  const estilo = { '--lista-color': '#2680eb' } as CSSProperties
  const reintentar = () => setIntento((n) => n + 1)

  // Sin perfil que enseñar (o sin permiso): no disponible, sin revelar nada.
  const sinPerfil =
    perfil.estado === 'no-disponible' &&
    vinculado !== true &&
    vinculado !== null
  if (sinPerfil || perfil.estado === 'error') {
    return (
      <section
        className="lista-detalle lista-detalle--rica"
        aria-label="Profesional"
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
          {sinPerfil ? (
            <p className="pro-audios__aviso">
              Este espacio no está disponible.
            </p>
          ) : (
            <div className="prof-fila prof-fila--error">
              <p className="prof-fila__aviso">No se pudo cargar esta página.</p>
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

  const nombre = datosPerfil?.nombre.trim() ?? ''
  const primerNombre = nombre.split(/\s+/)[0]
  const conSobre = datosPerfil ? tieneSobre(datosPerfil) : false
  const conListas = vinculado === true && listasVisibles.length > 0
  const conPestanas = conSobre || conListas
  const pestanaActiva: Pestana =
    (pestana === 'sobre' && conSobre) || (pestana === 'listas' && conListas)
      ? pestana
      : 'audios'
  const errorAudios =
    vinculado === 'error' ||
    (vinculado === true &&
      (generales.estado === 'error' ||
        paraMi.estado === 'error' ||
        recibidos.estado === 'error'))
  // Hasta tener la cabecera, tampoco se da por vacía la lista.
  const cargandoAudios =
    !datosPerfil ||
    vinculado === null ||
    (vinculado === true &&
      (generales.estado === 'cargando' ||
        paraMi.estado === 'cargando' ||
        recibidos.estado === 'cargando'))
  const listaParaMi = juntarParaTi(
    paraMi.estado === 'listo' ? paraMi.datos : [],
    recibidos.estado === 'listo' ? recibidos.datos : [],
  )
  const listaGenerales = generales.estado === 'listo' ? generales.datos : []

  let contenidoAudios
  if (errorAudios) {
    contenidoAudios = (
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
  } else if (cargandoAudios) {
    contenidoAudios = (
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
  } else if (vinculado === false) {
    // PRUEBA TEMPORAL (modo «todos»): sin vínculo, sus audios no se ven.
    // Hueco previsto para el acceso (cuota): aún sin decidir, no se pinta nada.
    contenidoAudios = (
      <div className="lista-detalle__empty">
        <p>
          {nombre
            ? `Los audios de ${nombre} son para sus oyentes.`
            : 'Sus audios son para sus oyentes.'}
        </p>
      </div>
    )
  } else if (listaParaMi.length === 0 && listaGenerales.length === 0) {
    contenidoAudios = (
      <div className="lista-detalle__empty">
        <p>Tu profesional aún no ha publicado audios.</p>
      </div>
    )
  } else {
    contenidoAudios = (
      <>
        {listaParaMi.length > 0 && (
          <section className="prof-pagina__grupo" aria-labelledby="para-ti">
            <h2 id="para-ti" className="prof-pagina__subtitulo">
              Para ti
            </h2>
            <FilasAudioProfesional profesionalUid={uid} audios={listaParaMi} />
          </section>
        )}
        {listaGenerales.length > 0 && listaParaMi.length > 0 ? (
          <section className="prof-pagina__grupo" aria-labelledby="sus-audios">
            <h2 id="sus-audios" className="prof-pagina__subtitulo">
              Sus audios
            </h2>
            <FilasAudioProfesional
              profesionalUid={uid}
              audios={listaGenerales}
            />
          </section>
        ) : (
          listaGenerales.length > 0 && (
            <FilasAudioProfesional
              profesionalUid={uid}
              audios={listaGenerales}
            />
          )
        )}
      </>
    )
  }

  return (
    <section
      className="lista-detalle lista-detalle--rica"
      aria-label={nombre || 'Profesional'}
      style={estilo}
    >
      {/* Fondo ambiental: su foto, muy ampliada y desenfocada (como las listas). */}
      <div className="lista-detalle__backdrop" aria-hidden="true">
        <span
          className="lista-detalle__backdrop-art"
          style={
            fotoPrincipal
              ? { backgroundImage: `url(${fotoPrincipal})` }
              : {
                  background:
                    'linear-gradient(160deg, #2680eb 0%, #0b1a33 100%)',
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
            {!datosPerfil ? (
              <div
                className="lista-detalle__cover prof-pagina__cover-cargando"
                aria-hidden="true"
              />
            ) : fotoPrincipal ? (
              <div
                className="lista-detalle__cover prof-pagina__cover"
                role="img"
                aria-label={nombre}
                style={{ backgroundImage: `url(${fotoPrincipal})` }}
              />
            ) : (
              <div
                className="lista-detalle__cover prof-pagina__cover-iniciales"
                aria-hidden="true"
              >
                {iniciales(nombre)}
              </div>
            )}

            <div className="lista-detalle__hero-info">
              {!datosPerfil ? (
                <div aria-hidden="true">
                  <span className="prof-pagina__linea prof-pagina__linea--titulo" />
                  <span className="prof-pagina__linea" />
                </div>
              ) : (
                <>
                  <h1 ref={titulo}>{nombre || 'Tu profesional'}</h1>
                  {datosPerfil?.frase.trim() && (
                    <p className="prof-pagina__frase">{datosPerfil.frase}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lista-detalle__body">
        {mostrarBienvenida &&
          vinculado === true &&
          datosPerfil?.bienvenida.trim() && (
            <section
              className="perfil-oyente__bienvenida prof-pagina__bienvenida"
              aria-label="Mensaje de bienvenida"
            >
              <p className="perfil-oyente__bienvenida-etiqueta">
                Mensaje de bienvenida
              </p>
              <p className="perfil-oyente__texto">{datosPerfil.bienvenida}</p>
            </section>
          )}

        {conPestanas && (
          <div
            className="library-tabs prof-pagina__pestanas"
            role="tablist"
            aria-label={`Secciones de ${nombre || 'tu profesional'}`}
          >
            <button
              type="button"
              role="tab"
              id="prof-tab-audios"
              aria-selected={pestanaActiva === 'audios'}
              aria-controls="prof-panel"
              className={`library-tabs__tab${pestanaActiva === 'audios' ? ' is-active' : ''}`}
              onClick={() => setPestana('audios')}
            >
              Audios
            </button>
            {conListas && (
              <button
                type="button"
                role="tab"
                id="prof-tab-listas"
                aria-selected={pestanaActiva === 'listas'}
                aria-controls="prof-panel"
                className={`library-tabs__tab${pestanaActiva === 'listas' ? ' is-active' : ''}`}
                onClick={() => setPestana('listas')}
              >
                Listas
              </button>
            )}
            {conSobre && (
              <button
                type="button"
                role="tab"
                id="prof-tab-sobre"
                aria-selected={pestanaActiva === 'sobre'}
                aria-controls="prof-panel"
                className={`library-tabs__tab${pestanaActiva === 'sobre' ? ' is-active' : ''}`}
                onClick={() => setPestana('sobre')}
              >
                {primerNombre ? `Sobre ${primerNombre}` : 'Sobre su trabajo'}
              </button>
            )}
          </div>
        )}

        <div
          key={pestanaActiva}
          id="prof-panel"
          className="prof-pagina__panel"
          role={conPestanas ? 'tabpanel' : undefined}
          aria-labelledby={
            conPestanas ? `prof-tab-${pestanaActiva}` : undefined
          }
        >
          {pestanaActiva === 'sobre' && datosPerfil ? (
            <VistaPerfilOyente
              profesionalUid={uid}
              perfil={datosPerfil}
              sinIdentidad
            />
          ) : pestanaActiva === 'listas' ? (
            <div className="template-grid prof-pagina__listas">
              {listasVisibles.map(({ lista, cuantos }) => (
                <TarjetaListaOyente
                  key={lista.id}
                  lista={lista}
                  cuantos={cuantos}
                  to={`/app/profesional/${uid}/lista/${lista.id}`}
                />
              ))}
            </div>
          ) : (
            contenidoAudios
          )}
        </div>
      </div>
    </section>
  )
}

/** Una lista en la pestaña «Listas»: la misma tarjeta que las listas de la app. */
function TarjetaListaOyente({
  lista,
  cuantos,
  to,
}: {
  lista: ListaProfesional
  cuantos: number
  to: string
}) {
  const imagen = useImagenLista(lista)
  const estilo = estiloPortadaLista(lista.plantillaId, imagen, 'app')
  const conImagen = Boolean(imagen || estilo.backgroundImage)
  return (
    <Link
      to={to}
      className={`template-card${conImagen ? ' template-card--has-image' : ''}`}
    >
      {conImagen ? (
        <>
          <span
            className="template-card__bg"
            style={estilo}
            aria-hidden="true"
          />
          <span className="template-card__bg-overlay" aria-hidden="true" />
        </>
      ) : (
        <span className="template-card__icon" aria-hidden="true">
          <TemplateIcon name="lista" />
        </span>
      )}
      <div className="template-card__meta">
        <span className="template-card__label">{nombreLista(lista)}</span>
        <span className="template-card__count">
          {cuantos === 1 ? '1 audio' : `${cuantos} audios`}
        </span>
      </div>
    </Link>
  )
}

export default PerfilProfesionalOyentePage
