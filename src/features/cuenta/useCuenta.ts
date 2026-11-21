import { useAuth } from '../auth/context/AuthContext'
import { useUserProfile } from '../auth/hooks/useUserProfile'
import type { Cuenta } from './recorridos'

/**
 * La cuenta del usuario con sesión, en vivo: su tipo, o null si aún no
 * tiene (no existe users/{uid}). Sale del documento que la app ya escucha:
 * ninguna lectura nueva.
 */
export function useCuenta(): {
  uid: string | null
  email: string | null
  nombre: string | null
  cuenta: Cuenta
  cargando: boolean
} {
  const { user, loading } = useAuth()
  const { profile, isLoading } = useUserProfile()
  if (loading)
    return { uid: null, email: null, nombre: null, cuenta: null, cargando: true }
  if (!user)
    return { uid: null, email: null, nombre: null, cuenta: null, cargando: false }
  return {
    uid: user.uid,
    email: user.email,
    nombre: profile?.displayNamePref?.trim() || user.displayName,
    cuenta: profile?.existe ? profile.tipoCuenta : null,
    // Hasta que llega el documento de esta persona (no el de la anterior).
    cargando: isLoading || profile === null,
  }
}
