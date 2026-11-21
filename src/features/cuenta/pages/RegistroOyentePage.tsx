import { useId, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  BotonCuenta,
  EnlacesLegales,
  Escalon,
  PantallaCuenta,
  Titulo,
} from '../componentes'
import { crearCuentaOyente, entrarConGoogle, leerCuenta } from '../cuentaService'
import {
  RUTA_APP,
  RUTA_LOGIN,
  RUTA_REGISTRO_PROFESIONAL,
  esCancelacionDeGoogle,
  recorridoRegistroOyente,
} from '../recorridos'
import { useCuenta } from '../useCuenta'

/**
 * /registro/oyente: entrar con Google. Sin cuenta, se crea como oyente
 * (aceptando términos: al registrarse); con cuenta de cualquier tipo, no
 * cambia nada. Siempre a la app.
 */
function RegistroOyentePage() {
  const navigate = useNavigate()
  const { uid, cuenta, cargando } = useCuenta()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idNota = useId()

  if (cargando && !enviando) {
    return <PantallaCuenta etiqueta="Entrar como oyente">{null}</PantallaCuenta>
  }
  // Ya tiene cuenta (de cualquier tipo): a la app, sin cambiar nada.
  if (uid && cuenta !== null && !enviando) return <Navigate to={RUTA_APP} replace />

  const registrar = async () => {
    if (enviando) return
    setEnviando(true)
    setError(null)
    try {
      const destino = await recorridoRegistroOyente(
        {
          entrar: async () => (await entrarConGoogle()).uid,
          leerCuenta,
          crearOyente: crearCuentaOyente,
        },
        uid,
      )
      navigate(destino, { replace: true })
    } catch (e) {
      if (!esCancelacionDeGoogle(e)) {
        setError('No se pudo completar el registro. Revisa tu conexión e inténtalo de nuevo.')
      }
      setEnviando(false)
    }
  }

  return (
    <PantallaCuenta
      etiqueta="Entrar como oyente"
      debajo={
        <>
          <p>
            ¿Eres profesional?{' '}
            <Link to={RUTA_REGISTRO_PROFESIONAL}>Crea tu cuenta aquí</Link>
          </p>
          <p>
            ¿Ya tienes cuenta? <Link to={RUTA_LOGIN}>Iniciar sesión</Link>
          </p>
        </>
      }
    >
      <Escalon i={0}>
        <Titulo antes="Entra como " clave="oyente" />
        <p className="registro__subtitulo">
          Escucha los audios que tu profesional ha preparado para ti.
        </p>
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
              onClick={() => void registrar()}
              cargando={enviando}
              describedBy={idNota}
            >
              Registrarse con Google
            </BotonCuenta>
            <p id={idNota} className="registro__nota">
              Al registrarte, aceptas <EnlacesLegales />, y confirmas que eres
              mayor de edad.
            </p>
          </div>
        </Escalon>
      </div>
    </PantallaCuenta>
  )
}

export default RegistroOyentePage
