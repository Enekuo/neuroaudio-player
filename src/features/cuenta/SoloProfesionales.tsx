import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useTipoCuenta } from '../cambioDePanel/useEsProfesional'
import { accesoAlPanel } from './tipoCuenta'

/**
 * Puerta del panel profesional (/profesional/*): solo entra una cuenta con
 * tipoCuenta 'profesional'; cualquier otra va a la app del oyente (/app).
 * Mientras se sabe el tipo, el fondo del panel (sin parpadeos de contenido).
 */
function SoloProfesionales({ children }: { children: ReactNode }) {
  const { tipo, cargando } = useTipoCuenta()
  const acceso = accesoAlPanel(cargando, tipo)
  if (acceso === 'esperar') {
    return (
      <div
        aria-busy="true"
        style={{ minHeight: '100dvh', background: '#f8f9fa' }}
      />
    )
  }
  if (acceso === 'a-la-app') {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}

export default SoloProfesionales
