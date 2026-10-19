import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/context/AuthContext'
import type { PerfilProfesional } from './modelo'
import {
  ordenarProfesionales,
  type ProfesionalDelOyente,
} from './ordenProfesionales'
import {
  escucharPerfil,
  escucharProfesionalesDelOyente,
  type VinculoDelOyente,
} from './perfilService'

export type EstadoProfesionales = 'cargando' | 'listo' | 'error'

/**
 * Profesionales con los que el oyente con sesión tiene un vínculo activo,
 * con su perfil, ya ordenados (ver ordenarProfesionales). En vivo: si un
 * vínculo se pausa o se borra, o el profesional cambia su perfil, se
 * actualiza solo.
 * - Un perfil que no existe o no se puede leer se salta (no se pinta un
 *   hueco roto).
 * - Si falla la consulta de vínculos, el estado es 'error' y `reintentar`
 *   vuelve a intentarlo.
 */
export function useProfesionalesDelOyente() {
  const { user } = useAuth()
  const uidOyente = user?.uid ?? null
  const [intento, setIntento] = useState(0)
  const [vinculos, setVinculos] = useState<VinculoDelOyente[] | null>(null)
  const [errorVinculos, setErrorVinculos] = useState(false)
  // Sin entrada: cargando · null: no existe o no se puede leer.
  const [perfiles, setPerfiles] = useState<
    Record<string, PerfilProfesional | null>
  >({})

  useEffect(() => {
    if (!uidOyente) return
    setErrorVinculos(false)
    return escucharProfesionalesDelOyente(
      uidOyente,
      (lista) => {
        setVinculos(lista)
        setErrorVinculos(false)
      },
      () => setErrorVinculos(true),
    )
  }, [uidOyente, intento])

  const clave = (vinculos ?? []).map((v) => v.profesionalUid).join(',')
  useEffect(() => {
    if (!clave) return
    const cancelar = clave.split(',').map((uid) =>
      escucharPerfil(
        uid,
        (perfil) => setPerfiles((p) => ({ ...p, [uid]: perfil })),
        () => setPerfiles((p) => ({ ...p, [uid]: null })),
      ),
    )
    return () => cancelar.forEach((c) => c())
  }, [clave, intento])

  const profesionales = useMemo(() => {
    if (!vinculos) return []
    return ordenarProfesionales(
      vinculos
        .map((v) => ({
          uid: v.profesionalUid,
          perfil: perfiles[v.profesionalUid],
          creadoEn: v.creadoEn,
        }))
        .filter((p): p is ProfesionalDelOyente => Boolean(p.perfil)),
    )
  }, [vinculos, perfiles])

  let estado: EstadoProfesionales = 'listo'
  if (errorVinculos) estado = 'error'
  else if (!uidOyente || !vinculos) estado = 'cargando'
  else if (vinculos.some((v) => !(v.profesionalUid in perfiles)))
    estado = 'cargando'

  return {
    estado,
    profesionales,
    /** Cuántos vínculos activos hay (para saber cuántos esqueletos pintar). */
    totalVinculos: vinculos?.length ?? 0,
    reintentar: () => setIntento((n) => n + 1),
  }
}
