import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import type { PerfilProfesional } from '../../perfilProfesional/modelo'
import { escucharPerfil } from '../../perfilProfesional/perfilService'
import { nombreDelSaludo } from '../pages/saludo'

/**
 * Nombre con el que el panel llama al profesional (saludo del Dashboard e
 * inicial del icono de la cuenta), siempre el mismo: «¿Cómo quieres que te
 * llamemos?» → nombre del perfil profesional → nombre de Google.
 * También devuelve el perfil (en vivo) para «Primeros pasos».
 * `listo` es false hasta saber qué nombre toca (para no mostrar primero el
 * de Google y luego cambiarlo).
 */
export function useNombreProfesional() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const { profile, isLoading } = useUserProfile()
  // Sin entrada para este uid: aún cargando · perfil null: no hay o no se
  // pudo leer.
  const [leido, setLeido] = useState<{
    uid: string
    perfil: PerfilProfesional | null
    error: boolean
  } | null>(null)

  useEffect(() => {
    if (!uid) return
    return escucharPerfil(
      uid,
      (perfil) => setLeido({ uid, perfil, error: false }),
      () => setLeido({ uid, perfil: null, error: true }),
    )
  }, [uid])

  const preferido = profile?.displayNamePref?.trim()
  const actual = leido?.uid === uid ? leido : null
  const nombrePerfil = actual ? (actual.perfil?.nombre ?? null) : undefined
  const listo = !isLoading && (Boolean(preferido) || nombrePerfil !== undefined)
  const nombre = nombreDelSaludo(preferido, nombrePerfil, user?.displayName)

  return {
    nombre,
    listo,
    perfil: actual?.perfil ?? null,
    perfilCargado: actual !== null,
  }
}
