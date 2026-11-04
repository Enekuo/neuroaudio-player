import '../components/landing/fuentes'
import '../styles/contacto.css'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/landing/Footer'
import NavSimple from '../components/landing/NavSimple'
import { EMPRESA } from '../config/empresa'
import { enviarMensajeContacto } from '../features/contacto/contactoService'
import {
  FORMULARIO_VACIO,
  LIMITES,
  OPCIONES_MOTIVO,
  OPCIONES_QUE_ERES,
  pareceRobot,
  prepararMensaje,
  validarContacto,
  type ErroresContacto,
  type FormularioContacto,
} from '../features/contacto/validacion'

const CORREO_CONTACTO = 'olondoweb@gmail.com'

// Orden de los campos, para llevar el foco al primero con error.
const CAMPOS = [
  'nombre',
  'correo',
  'queEres',
  'motivo',
  'mensaje',
  'aceptoPrivacidad',
] as const
const idCampo = (campo: string) => `contacto-${campo}`
const idError = (campo: string) => `contacto-${campo}-error`

type Estado = 'listo' | 'enviando' | 'enviado' | 'error'

// Salida de la página (al ir a otra de la web): los mismos tiempos que las
// salidas de la app (ventanas y hojas, ~220 ms) y, con «Reducir
// animaciones», un fundido corto. La duración pasa al CSS por una variable,
// así la navegación espera exactamente a que termine.
const SALIDA_MS = 220
const SALIDA_REDUCIDA_MS = 140

function duracionSalida() {
  // El interruptor de Ajustes ya deja las animaciones a ~0: sin espera.
  if (document.documentElement.classList.contains('reduce-motion')) return 0
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? SALIDA_REDUCIDA_MS
    : SALIDA_MS
}

function IconoSobre() {
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
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

/**
 * Página de contacto (/contacto): texto a la izquierda y formulario en una
 * tarjeta clara a la derecha (en móvil, uno debajo del otro). Los mensajes
 * se guardan en Firestore (mensajesContacto). Anti-spam sin servicios
 * externos: un campo trampa oculto y un tiempo mínimo antes de enviar.
 */
function ContactoPage() {
  const [form, setForm] = useState<FormularioContacto>(FORMULARIO_VACIO)
  const [errores, setErrores] = useState<ErroresContacto>({})
  const [intentado, setIntentado] = useState(false)
  const [estado, setEstado] = useState<Estado>('listo')
  const [trampa, setTrampa] = useState('')
  const abiertoEn = useRef(Date.now())
  const titular = EMPRESA.razonSocial.trim() || 'NeuroAudio'
  const navigate = useNavigate()
  const [salida, setSalida] = useState<number | null>(null)
  const relojSalida = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(relojSalida.current), [])

  // Al pulsar un enlace interno (menú, pie, «Política de privacidad»…), la
  // página se cierra con su animación completa y después se navega. Los
  // enlaces externos, mailto, «#», nuevas pestañas o con teclas modificadoras
  // siguen como siempre. (El botón «atrás» del navegador no se puede esperar.)
  const alPulsarEnlace = (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const enlace = (e.target as Element).closest<HTMLAnchorElement>('a[href]')
    if (!enlace || (enlace.target && enlace.target !== '_self')) return
    if (enlace.hasAttribute('download')) return
    const url = new URL(enlace.href)
    if (url.origin !== window.location.origin) return
    if (url.pathname === window.location.pathname) return
    e.preventDefault()
    if (salida !== null) return
    const destino = url.pathname + url.search + url.hash
    const ms = duracionSalida()
    if (ms === 0) {
      navigate(destino)
      return
    }
    setSalida(ms)
    relojSalida.current = window.setTimeout(() => navigate(destino), ms)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    const anterior = document.title
    document.title = 'Contacto · NeuroAudio'
    return () => {
      document.title = anterior
    }
  }, [])

  const cambiar = <K extends keyof FormularioContacto>(
    campo: K,
    valor: FormularioContacto[K],
  ) => {
    const nuevo = { ...form, [campo]: valor }
    setForm(nuevo)
    // Tras el primer intento, los errores se actualizan al escribir.
    if (intentado) setErrores(validarContacto(nuevo))
    if (estado === 'enviado' || estado === 'error') setEstado('listo')
  }

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (estado === 'enviando') return
    const nuevos = validarContacto(form)
    setIntentado(true)
    setErrores(nuevos)
    const primero = CAMPOS.find((c) => nuevos[c])
    if (primero) {
      document.getElementById(idCampo(primero))?.focus()
      return
    }

    setEstado('enviando')
    const vaciar = () => {
      setForm(FORMULARIO_VACIO)
      setIntentado(false)
      setErrores({})
      abiertoEn.current = Date.now()
    }
    // Un robot no se entera: ve «enviado», pero no se guarda nada.
    if (pareceRobot(trampa, Date.now() - abiertoEn.current)) {
      await new Promise((r) => setTimeout(r, 600))
      vaciar()
      setEstado('enviado')
      return
    }
    try {
      await enviarMensajeContacto(prepararMensaje(form))
      vaciar()
      setEstado('enviado')
    } catch {
      setEstado('error')
    }
  }

  const propsCampo = (campo: (typeof CAMPOS)[number]) => ({
    id: idCampo(campo),
    'aria-invalid': errores[campo] ? true : undefined,
    'aria-describedby': errores[campo] ? idError(campo) : undefined,
  })
  const error = (campo: (typeof CAMPOS)[number]) =>
    errores[campo] ? (
      <p id={idError(campo)} className="na-contacto__error">
        {errores[campo]}
      </p>
    ) : null

  const largoMensaje = form.mensaje.trim().length
  const enviando = estado === 'enviando'

  return (
    <div
      className={`landing-root na-contacto${salida !== null ? ' is-saliendo' : ''}`}
      style={
        salida !== null
          ? ({ '--na-contacto-salida': `${salida}ms` } as CSSProperties)
          : undefined
      }
      onClickCapture={alPulsarEnlace}
    >
      <NavSimple />

      <main className="na-contacto__contenido">
        <div className="na-contacto__intro">
          <p className="na-contacto__eyebrow">Contacto</p>
          <h1 className="na-contacto__titulo">¿Hablamos?</h1>
          <p className="na-contacto__lead">
            Cuéntanos qué necesitas y te responderemos por correo.
          </p>
          <a
            className="na-contacto__correo"
            href={`mailto:${CORREO_CONTACTO}`}
          >
            <span className="na-contacto__correo-icono">
              <IconoSobre />
            </span>
            {CORREO_CONTACTO}
          </a>
        </div>

        <div className="na-contacto__tarjeta">
          <form noValidate onSubmit={enviar} aria-label="Formulario de contacto">
            <div className="na-contacto__fila">
              <div className="na-contacto__campo">
                <label htmlFor={idCampo('nombre')}>
                  Nombre <span aria-hidden="true">*</span>
                </label>
                <input
                  {...propsCampo('nombre')}
                  type="text"
                  name="nombre"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  required
                  maxLength={LIMITES.nombre}
                  value={form.nombre}
                  onChange={(e) => cambiar('nombre', e.target.value)}
                />
                {error('nombre')}
              </div>
              <div className="na-contacto__campo">
                <label htmlFor={idCampo('correo')}>
                  Correo electrónico <span aria-hidden="true">*</span>
                </label>
                <input
                  {...propsCampo('correo')}
                  type="email"
                  name="correo"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="tu@correo.com"
                  required
                  maxLength={LIMITES.correo}
                  value={form.correo}
                  onChange={(e) => cambiar('correo', e.target.value)}
                />
                {error('correo')}
              </div>
            </div>

            <div className="na-contacto__campo">
              <label htmlFor={idCampo('queEres')}>¿Qué eres?</label>
              <select
                {...propsCampo('queEres')}
                name="queEres"
                value={form.queEres}
                className={form.queEres ? undefined : 'is-vacio'}
                onChange={(e) => cambiar('queEres', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {OPCIONES_QUE_ERES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>
              {error('queEres')}
            </div>

            <div className="na-contacto__campo">
              <label htmlFor={idCampo('motivo')}>¿En qué podemos ayudarte?</label>
              <select
                {...propsCampo('motivo')}
                name="motivo"
                value={form.motivo}
                className={form.motivo ? undefined : 'is-vacio'}
                onChange={(e) => cambiar('motivo', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {OPCIONES_MOTIVO.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </select>
              {error('motivo')}
            </div>

            <div className="na-contacto__campo">
              <label htmlFor={idCampo('mensaje')}>
                Mensaje <span aria-hidden="true">*</span>
              </label>
              <textarea
                {...propsCampo('mensaje')}
                aria-describedby={[
                  errores.mensaje ? idError('mensaje') : '',
                  'contacto-mensaje-contador',
                ]
                  .filter(Boolean)
                  .join(' ')}
                name="mensaje"
                rows={5}
                placeholder="Escribe tu mensaje aquí…"
                required
                maxLength={LIMITES.mensajeMax}
                value={form.mensaje}
                onChange={(e) => cambiar('mensaje', e.target.value)}
              />
              <div className="na-contacto__bajo-mensaje">
                {error('mensaje') ?? <span />}
                <span
                  id="contacto-mensaje-contador"
                  className="na-contacto__contador"
                >
                  {largoMensaje} / {LIMITES.mensajeMax}
                </span>
              </div>
            </div>

            {/* Trampa para robots: oculta y fuera del orden del teclado. */}
            <div className="na-contacto__trampa" aria-hidden="true">
              <label htmlFor="contacto-web">Deja este campo vacío</label>
              <input
                id="contacto-web"
                type="text"
                name="web"
                tabIndex={-1}
                autoComplete="off"
                value={trampa}
                onChange={(e) => setTrampa(e.target.value)}
              />
            </div>

            <div className="na-contacto__casilla">
              <input
                {...propsCampo('aceptoPrivacidad')}
                type="checkbox"
                name="aceptoPrivacidad"
                required
                checked={form.aceptoPrivacidad}
                onChange={(e) => cambiar('aceptoPrivacidad', e.target.checked)}
              />
              <label htmlFor={idCampo('aceptoPrivacidad')}>
                He leído y acepto la{' '}
                <Link to="/legal/privacidad">Política de privacidad</Link>.{' '}
                <span aria-hidden="true">*</span>
              </label>
            </div>
            {error('aceptoPrivacidad')}

            <div className="na-contacto__acciones">
              <button
                type="submit"
                className="na-contacto__enviar"
                disabled={enviando}
                aria-busy={enviando || undefined}
              >
                {enviando ? 'Enviando…' : 'Enviar'}
              </button>
            </div>

            <div className="na-contacto__aviso" role="status" aria-live="polite">
              {estado === 'enviado' && (
                <p className="na-contacto__ok">
                  Mensaje enviado. Te responderemos por correo.
                </p>
              )}
            </div>
            <div className="na-contacto__aviso" role="alert">
              {estado === 'error' && (
                <p className="na-contacto__fallo">
                  No hemos podido enviar tu mensaje. Inténtalo de nuevo o
                  escríbenos a {CORREO_CONTACTO}.
                </p>
              )}
            </div>
          </form>

          <p className="na-contacto__rgpd">
            <strong>Información básica sobre protección de datos.</strong>{' '}
            Responsable: {titular}. Finalidad: responder a tu mensaje. Base
            legal: tu consentimiento. Derechos: acceso, rectificación,
            supresión y otros, escribiendo a {CORREO_CONTACTO}. Más
            información en la{' '}
            <Link to="/legal/privacidad">Política de privacidad</Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactoPage
