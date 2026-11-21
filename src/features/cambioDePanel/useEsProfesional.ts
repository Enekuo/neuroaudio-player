import { useAuth } from '../auth/context/AuthContext'
import { useUserProfile } from '../auth/hooks/useUserProfile'
import type { TipoCuenta } from '../cuenta/tipoCuenta'

/**
 * Tipo de cuenta del usuario con sesión, y si aún se está cargando.
 *
 * Criterio único: `users/{uid}.tipoCuenta` (sin el campo, oyente). Sale del
 * mismo documento que la app ya escucha (useUserProfile): ninguna lectura
 * nueva. Sin sesión: oyente.
 */
export function useTipoCuenta(): { tipo: TipoCuenta; cargando: boolean } {
  const { user, loading } = useAuth()
  const { profile, isLoading } = useUserProfile()
  if (loading) return { tipo: 'oyente', cargando: true }
  if (!user) return { tipo: 'oyente', cargando: false }
  return { tipo: profile?.tipoCuenta ?? 'oyente', cargando: isLoading }
}

/**
 * Si el usuario con sesión es profesional. Mientras no se sabe: false, para
 * que un oyente nunca vea nada de profesional.
 */
export function useEsProfesional(): boolean {
  const { tipo, cargando } = useTipoCuenta()
  return !cargando && tipo === 'profesional'
}
