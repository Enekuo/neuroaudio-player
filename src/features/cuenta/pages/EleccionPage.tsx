import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signOutUser } from '../../auth/services/authService'
import { EnlacesLegales, Escalon, PantallaCuenta } from '../componentes'
import { crearCuentaOyente } from '../cuentaService'
import {
  RUTA_APP,
  RUTA_LOGIN,
  RUTA_REGISTRO_PROFESIONAL,
  entradaEleccion,
} from '../recorridos'
import { useCuenta } from '../useCuenta'

function IconoMaletin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M3 12.5h18" />
    </svg>
  )
}

function IconoAuriculares() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3" y="14" width="4.5" height="6.5" rx="1.6" />
      <rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6" />
    </svg>
  )
}

function Flecha() {
  return (
    <svg className="registro__opcion-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/**
 * Pantalla de elección (/registro/elegir): solo con sesión y SIN cuenta
 * (tras /login con una cuenta de Google sin registrar). Si se cierra sin
 * elegir, no se crea nada.
 */
function EleccionPage() {
  const navigate = useNavigate()
  const { uid, email, cuenta, cargando } = useCuenta()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (cargando && !creando) {
    return <PantallaCuenta etiqueta="Elige tu tipo de cuenta">{null}</PantallaCuenta>
  }
  const entrada = entradaEleccion(Boolean(uid), cuenta)
  if (!creando) {
    if (entrada === 'login') return <Navigate to={RUTA_LOGIN} replace />
    if (entrada !== 'mostrar') return <Navigate to={entrada} replace />
  }

  const soyOyente = async () => {
    if (!uid || creando) return
    setCreando(true)
    setError(null)
    try {
      await crearCuentaOyente(uid)
      navigate(RUTA_APP, { replace: true })
    } catch {
      setError('No se pudo crear la cuenta. Revisa tu conexión e inténtalo de nuevo.')
      setCreando(false)
    }
  }

  const otraCuenta = async () => {
    await signOutUser()
    navigate(RUTA_LOGIN, { replace: true })
  }

  const inicial = (email ?? '?').charAt(0).toUpperCase()

  return (
    <PantallaCuenta
      etiqueta="Elige tu tipo de cuenta"
      debajo={
        <p>
          <button
            type="button"
            className="registro__boton-enlace registro__enlace"
            onClick={() => void otraCuenta()}
          >
            Usar otra cuenta de Google
          </button>
        </p>
      }
    >
      <Escalon i={0}>
        <p className="registro__cuenta">
          <span className="registro__cuenta-inicial" aria-hidden="true">
            {inicial}
          </span>
          <span className="registro__cuenta-correo">{email}</span>
        </p>
        <h1 className="registro__titulo">
          ¿Eres <em>profesional</em> u <em>oyente</em>?
        </h1>
        <p className="registro__subtitulo">
          Todavía no tienes cuenta en NeuroAudio. Elige cómo quieres empezar.
        </p>
      </Escalon>

      <div className="registro__cuerpo">
        <Escalon i={1}>
          <div className="registro__opciones">
            <button
              type="button"
              className="registro__opcion"
              disabled={creando}
              onClick={() =>
                navigate(RUTA_REGISTRO_PROFESIONAL, { state: { desdeEleccion: true } })
              }
            >
              <span className="registro__opcion-icono">
                <IconoMaletin />
              </span>
              <span className="registro__opcion-titulo">
                Soy profesional
                <Flecha />
              </span>
              <span className="registro__opcion-texto">
                Crea tus audios y compártelos con tus clientes.
              </span>
            </button>
            <button
              type="button"
              className="registro__opcion registro__opcion--oyente"
              disabled={creando}
              aria-busy={creando}
              onClick={() => void soyOyente()}
            >
              <span className="registro__opcion-icono">
                {creando ? (
                  <span className="registro__cargando" aria-hidden="true" />
                ) : (
                  <IconoAuriculares />
                )}
              </span>
              <span className="registro__opcion-titulo">
                Soy oyente
                <Flecha />
              </span>
              <span className="registro__opcion-texto">
                Escucha los audios que tu profesional ha preparado para ti.
              </span>
            </button>
          </div>
        </Escalon>
        <Escalon i={2}>
          {error && (
            <p className="registro__alerta" role="alert" style={{ marginBottom: 12 }}>
              {error}
            </p>
          )}
          <p className="registro__nota">
            Si eliges «Soy oyente», aceptas <EnlacesLegales />, y confirmas que
            eres mayor de edad.
          </p>
        </Escalon>
      </div>
    </PantallaCuenta>
  )
}

export default EleccionPage
