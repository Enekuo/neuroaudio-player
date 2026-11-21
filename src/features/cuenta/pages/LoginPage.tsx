import { useId, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BotonCuenta, Escalon, PantallaCuenta, Titulo } from '../componentes'
import { entrarConGoogle, leerCuenta } from '../cuentaService'
import {
  RUTA_REGISTRO_OYENTE,
  RUTA_REGISTRO_PROFESIONAL,
  destinoTrasLogin,
  esCancelacionDeGoogle,
  recorridoLogin,
} from '../recorridos'
import { useCuenta } from '../useCuenta'

/**
 * /login: entrar con Google, SIN crear nada. Profesional → panel; oyente →
 * app; sin cuenta (no existe users/{uid}) → pantalla de elección.
 */
function LoginPage() {
  const navigate = useNavigate()
  const { uid, cuenta, cargando } = useCuenta()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idNota = useId()

  if (cargando && !enviando) {
    return <PantallaCuenta etiqueta="Iniciar sesión">{null}</PantallaCuenta>
  }
  if (uid && !enviando) return <Navigate to={destinoTrasLogin(cuenta)} replace />

  const entrar = async () => {
    if (enviando) return
    setEnviando(true)
    setError(null)
    try {
      const destino = await recorridoLogin({
        entrar: async () => (await entrarConGoogle()).uid,
        leerCuenta,
      })
      navigate(destino, { replace: true })
    } catch (e) {
      if (!esCancelacionDeGoogle(e)) {
        setError('No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.')
      }
      setEnviando(false)
    }
  }

  return (
    <PantallaCuenta
      etiqueta="Iniciar sesión"
      debajo={
        <>
          <p>
            ¿Aún no tienes cuenta?{' '}
            <Link to={RUTA_REGISTRO_PROFESIONAL}>Empezar gratis</Link>
          </p>
          <p>
            ¿Eres oyente? <Link to={RUTA_REGISTRO_OYENTE}>Entra aquí</Link>
          </p>
        </>
      }
    >
      <Escalon i={0}>
        <Titulo antes="Inicia " clave="sesión" />
        <p className="registro__subtitulo">Entra en tu cuenta de NeuroAudio.</p>
      </Escalon>
      <div className="registro__cuerpo">
        <Escalon i={1}>
          <div className="registro__campo" style={{ gap: 14 }}>
            {error && (
              <p className="registro__alerta" role="alert">
                {error}
              </p>
            )}
            <BotonCuenta
              onClick={() => void entrar()}
              cargando={enviando}
              describedBy={idNota}
            >
              Iniciar sesión con Google
            </BotonCuenta>
            <p id={idNota} className="registro__nota">
              Si es tu primera vez, te preguntaremos si eres profesional u oyente.
            </p>
          </div>
        </Escalon>
      </div>
    </PantallaCuenta>
  )
}

export default LoginPage
