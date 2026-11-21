import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  BotonCuenta,
  DialogoPasoAProfesional,
  EnlacesLegales,
  Escalon,
  Pastillas,
  PantallaCuenta,
  Titulo,
} from '../componentes'
import {
  crearCuentaProfesional,
  entrarConGoogle,
  leerCuenta,
  pasarAProfesional,
} from '../cuentaService'
import {
  RUTA_APP,
  RUTA_LOGIN,
  RUTA_PANEL,
  RUTA_REGISTRO_OYENTE,
  entradaRegistroProfesional,
  esCancelacionDeGoogle,
  recorridoRegistroProfesional,
} from '../recorridos'
import {
  CLIENTES,
  DEDICACIONES,
  FORMULARIO_VACIO,
  LIMITES_REGISTRO,
  datosProfesionalDe,
  paisDelNavegador,
  paisesEnEspanol,
  validarRegistroProfesional,
  type FormularioProfesional,
} from '../registro'
import { useCuenta } from '../useCuenta'

type Campo = keyof FormularioProfesional

/** Pregunta «¿Seguro…?» como promesa: se resuelve al elegir. */
function useConfirmacion() {
  const [abierta, setAbierta] = useState(false)
  const resolver = useRef<((si: boolean) => void) | null>(null)
  const preguntar = () =>
    new Promise<boolean>((resolve) => {
      resolver.current = resolve
      setAbierta(true)
    })
  const responder = (si: boolean) => {
    setAbierta(false)
    resolver.current?.(si)
    resolver.current = null
  }
  return { abierta, preguntar, responder }
}

/**
 * /registro/profesional: formulario y entrada con Google. Con sesión ya
 * iniciada: un profesional va al panel; un oyente ve antes el mensaje de
 * confirmación (salvo si viene de la pantalla de elección) y luego el
 * formulario con su nombre, con «Crear cuenta profesional» en lugar de Google.
 */
function RegistroProfesionalPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const desdeEleccion =
    (location.state as { desdeEleccion?: boolean } | null)?.desdeEleccion === true
  const { uid, nombre, cuenta, cargando } = useCuenta()

  const paises = useMemo(() => paisesEnEspanol(), [])
  const [form, setForm] = useState<FormularioProfesional>(() => ({
    ...FORMULARIO_VACIO,
    pais: paisDelNavegador(
      typeof navigator === 'undefined'
        ? []
        : navigator.languages?.length
          ? navigator.languages
          : [navigator.language],
    ),
  }))
  const [tocados, setTocados] = useState<ReadonlySet<Campo>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Un oyente con sesión que ya ha dicho «Sí, continuar» al entrar.
  const [confirmadoAlEntrar, setConfirmadoAlEntrar] = useState(false)
  const confirmacion = useConfirmacion()

  // Con sesión, el nombre ya relleno (si aún no ha escrito nada).
  useEffect(() => {
    if (uid && nombre) {
      setForm((f) => (f.nombre ? f : { ...f, nombre }))
    }
  }, [uid, nombre])

  const errores = validarRegistroProfesional(form)
  const valido = Object.keys(errores).length === 0
  const ver = (campo: Campo) =>
    tocados.has(campo) ? errores[campo as keyof typeof errores] : undefined
  const tocar = (campo: Campo) =>
    setTocados((t) => (t.has(campo) ? t : new Set(t).add(campo)))
  const cambiar = <K extends Campo>(campo: K, valor: FormularioProfesional[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    tocar(campo)
  }

  const ids = {
    nombre: useId(),
    nombreAyuda: useId(),
    nombreError: useId(),
    otra: useId(),
    otraError: useId(),
    pais: useId(),
    paisError: useId(),
    terminosError: useId(),
    nota: useId(),
  }

  if (cargando && !enviando) {
    return <PantallaCuenta etiqueta="Crear cuenta profesional">{null}</PantallaCuenta>
  }

  // Al entrar con sesión (no mientras se está registrando).
  const entrada =
    uid && !enviando
      ? entradaRegistroProfesional(cuenta, desdeEleccion || confirmadoAlEntrar)
      : 'formulario'
  if (entrada === 'panel') return <Navigate to={RUTA_PANEL} replace />

  const registrar = async () => {
    if (!valido || enviando) return
    setEnviando(true)
    setError(null)
    const datos = datosProfesionalDe(form)
    try {
      const destino = await recorridoRegistroProfesional(
        {
          entrar: async () => (await entrarConGoogle()).uid,
          leerCuenta,
          crearOyente: async () => {},
          crearProfesional: (u) => crearCuentaProfesional(u, datos, form.novedades),
          pasarAProfesional: (u) => pasarAProfesional(u, datos, form.novedades),
          confirmarPaso: confirmacion.preguntar,
        },
        uid,
        desdeEleccion || confirmadoAlEntrar,
      )
      navigate(destino, { replace: true })
    } catch (e) {
      if (!esCancelacionDeGoogle(e)) {
        setError('No se pudo completar el registro. Revisa tu conexión e inténtalo de nuevo.')
      }
      setEnviando(false)
    }
  }

  const conSesion = Boolean(uid)
  let i = 0

  return (
    <PantallaCuenta
      etiqueta="Crear cuenta profesional"
      debajo={
        <>
          <p>
            ¿Ya tienes cuenta? <Link to={RUTA_LOGIN}>Iniciar sesión</Link>
          </p>
          <p>
            ¿Eres oyente? <Link to={RUTA_REGISTRO_OYENTE}>Entra aquí</Link>
          </p>
        </>
      }
    >
      {!conSesion && (
        <Escalon i={i++}>
          <ol className="registro__pasos" aria-label="Pasos del registro">
            <li className="registro__paso is-activo" aria-current="step">
              <span className="registro__paso-numero">1</span>
              Tus datos
            </li>
            <li className="registro__pasos-linea" aria-hidden="true" />
            <li className="registro__paso">
              <span className="registro__paso-numero">2</span>
              Entrar con Google
            </li>
          </ol>
        </Escalon>
      )}

      <Escalon i={i++}>
        <Titulo antes="Crea tu cuenta " clave="profesional" />
        <p className="registro__subtitulo">
          Gratis para empezar. Te llevará menos de un minuto.
        </p>
      </Escalon>

      <form
        className="registro__cuerpo"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void registrar()
        }}
      >
        <Escalon i={i++}>
          <div className="registro__campo">
            <label htmlFor={ids.nombre} className="registro__etiqueta">
              Nombre profesional
            </label>
            <input
              id={ids.nombre}
              className="registro__input"
              value={form.nombre}
              maxLength={LIMITES_REGISTRO.nombreMax}
              autoComplete="name"
              required
              aria-invalid={Boolean(ver('nombre'))}
              aria-describedby={`${ids.nombreAyuda}${ver('nombre') ? ` ${ids.nombreError}` : ''}`}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              onBlur={() => tocar('nombre')}
            />
            <p id={ids.nombreAyuda} className="registro__ayuda">
              Es el nombre que verán tus clientes. Podrás cambiarlo después.
            </p>
            {ver('nombre') && (
              <p id={ids.nombreError} className="registro__error" role="alert">
                {ver('nombre')}
              </p>
            )}
          </div>
        </Escalon>

        <Escalon i={i++}>
          <Pastillas
            etiqueta="¿A qué te dedicas?"
            nombre="dedicacion"
            opciones={DEDICACIONES}
            valor={form.dedicacion}
            onCambiar={(v) => cambiar('dedicacion', v)}
            error={ver('dedicacion')}
          />
          {form.dedicacion === 'otro' && (
            <div className="registro__campo" style={{ marginTop: 12 }}>
              <label htmlFor={ids.otra} className="registro__etiqueta">
                ¿Cuál?
              </label>
              <input
                id={ids.otra}
                className="registro__input"
                value={form.dedicacionOtra}
                maxLength={LIMITES_REGISTRO.otraMax}
                required
                autoFocus
                aria-invalid={Boolean(ver('dedicacionOtra'))}
                aria-describedby={ver('dedicacionOtra') ? ids.otraError : undefined}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dedicacionOtra: e.target.value }))
                }
                onBlur={() => tocar('dedicacionOtra')}
              />
              {ver('dedicacionOtra') && (
                <p id={ids.otraError} className="registro__error" role="alert">
                  {ver('dedicacionOtra')}
                </p>
              )}
            </div>
          )}
        </Escalon>

        <Escalon i={i++}>
          <div className="registro__campo">
            <label htmlFor={ids.pais} className="registro__etiqueta">
              País
            </label>
            <select
              id={ids.pais}
              className="registro__select"
              value={form.pais}
              required
              aria-invalid={Boolean(ver('pais'))}
              aria-describedby={ver('pais') ? ids.paisError : undefined}
              onChange={(e) => cambiar('pais', e.target.value)}
              onBlur={() => tocar('pais')}
            >
              <option value="">Elige tu país</option>
              {paises.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </select>
            {ver('pais') && (
              <p id={ids.paisError} className="registro__error" role="alert">
                {ver('pais')}
              </p>
            )}
          </div>
        </Escalon>

        <Escalon i={i++}>
          <Pastillas
            etiqueta="¿Cuántos clientes tienes?"
            opcional
            nombre="clientes"
            opciones={CLIENTES}
            valor={form.clientes}
            onCambiar={(v) => cambiar('clientes', v)}
          />
        </Escalon>

        <Escalon i={i++}>
          <div className="registro__campo" style={{ gap: 14 }}>
            <label className="registro__casilla">
              <input
                type="checkbox"
                checked={form.aceptaTerminos}
                required
                aria-invalid={Boolean(ver('aceptaTerminos'))}
                aria-describedby={ver('aceptaTerminos') ? ids.terminosError : undefined}
                onChange={(e) => cambiar('aceptaTerminos', e.target.checked)}
              />
              <span>
                Acepto <EnlacesLegales />, y confirmo que soy mayor de edad.
              </span>
            </label>
            {ver('aceptaTerminos') && (
              <p id={ids.terminosError} className="registro__error" role="alert">
                {ver('aceptaTerminos')}
              </p>
            )}
            <label className="registro__casilla">
              <input
                type="checkbox"
                checked={form.novedades}
                onChange={(e) => cambiar('novedades', e.target.checked)}
              />
              <span>
                Quiero recibir novedades y consejos de NeuroAudio por correo.{' '}
                <span className="registro__opcional">(Opcional)</span>
              </span>
            </label>
          </div>
        </Escalon>

        <Escalon i={i++}>
          <div className="registro__campo" style={{ gap: 12 }}>
            {error && (
              <p className="registro__alerta" role="alert">
                {error}
              </p>
            )}
            <BotonCuenta
              google={!conSesion}
              onClick={() => void registrar()}
              disabled={!valido}
              cargando={enviando}
              describedBy={conSesion ? undefined : ids.nota}
            >
              {conSesion ? 'Crear cuenta profesional' : 'Registrarse con Google'}
            </BotonCuenta>
            {!conSesion && (
              <p id={ids.nota} className="registro__nota">
                Usaremos el correo de tu cuenta de Google.
              </p>
            )}
          </div>
        </Escalon>
      </form>

      {(confirmacion.abierta || entrada === 'preguntar') && (
        <DialogoPasoAProfesional
          onCancelar={() => {
            if (confirmacion.abierta) confirmacion.responder(false)
            else navigate(RUTA_APP, { replace: true })
          }}
          onConfirmar={() => {
            if (confirmacion.abierta) confirmacion.responder(true)
            else setConfirmadoAlEntrar(true)
          }}
        />
      )}
    </PantallaCuenta>
  )
}

export default RegistroProfesionalPage
