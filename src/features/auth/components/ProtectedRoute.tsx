import { Navigate, Outlet } from 'react-router-dom'
import { useCuenta } from '../../cuenta/useCuenta'
import { RUTA_ELECCION, RUTA_LOGIN } from '../../cuenta/recorridos'

/**
 * Rutas con sesión. Sin sesión, a /login; con sesión pero SIN cuenta (no
 * existe users/{uid}: entró con Google y no eligió), a la pantalla de
 * elección: el /login ya no crea la cuenta al entrar.
 */
function ProtectedRoute() {
  const { uid, cuenta, cargando } = useCuenta()

  if (cargando) {
    return <div className="auth-loading">Cargando...</div>
  }

  if (!uid) {
    return <Navigate to={RUTA_LOGIN} replace />
  }

  if (cuenta === null) {
    return <Navigate to={RUTA_ELECCION} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
