import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import { useAuth } from '../auth/context/AuthContext'
import type { PerfilProfesional } from './modelo'
import { MOSTRAR_TODOS_LOS_PROFESIONALES } from './modoProfesionales'
import { combinarProfesionales } from './ordenProfesionales'
import { escucharPerfil, obtenerProfesionales } from './perfilService'
import {
  useProfesionalesDelOyente,
  type EstadoProfesionales,
} from './useProfesionalesDelOyente'

type Carga = 'cargando' | 'listo' | 'error'

/**
 * Profesionales que ve el usuario en Inicio y en /app/profesionales.
 * - En los dos modos: los de sus vínculos activos, en vivo, y su propio
 *   perfil si es profesional (un profesional se ve a sí mismo).
 * - PRUEBA TEMPORAL — interruptor encendido («todos», ver
 *   modoProfesionales.ts): además, todos los perfiles con nombre, de 50 en
 *   50 (`cargarMas`).
 * Primero los vinculados y después el resto por nombre.
 */
export function useProfesionales() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const delOyente = useProfesionalesDelOyente()

  const [intento, setIntento] = useState(0)
  const [todos, setTodos] = useState<
    { uid: string; perfil: PerfilProfesional }[]
  >([])
  const [siguiente, setSiguiente] = useState<QueryDocumentSnapshot | null>(null)
  const [cargaTodos, setCargaTodos] = useState<Carga>(
    MOSTRAR_TODOS_LOS_PROFESIONALES ? 'cargando' : 'listo',
  )
  const [cargaMas, setCargaMas] = useState<Carga>('listo')
  // Su propio perfil, en vivo. undefined: aún no ha llegado · null: no es
  // profesional (no tiene perfil) o no se pudo leer (se salta, sin error).
  const [propio, setPropio] = useState<{
    uid: string
    perfil: PerfilProfesional | null
  } | null>(null)

  useEffect(() => {
    if (!uid) return
    return escucharPerfil(
      uid,
      (perfil) => setPropio({ uid, perfil }),
      () => setPropio({ uid, perfil: null }),
    )
  }, [uid, intento])
  const perfilPropio = propio && propio.uid === uid ? propio.perfil : undefined

  useEffect(() => {
    if (!MOSTRAR_TODOS_LOS_PROFESIONALES || !uid) return
    let vigente = true
    setCargaTodos('cargando')
    obtenerProfesionales()
      .then((pagina) => {
        if (!vigente) return
        setTodos(pagina.profesionales)
        setSiguiente(pagina.siguiente)
        setCargaTodos('listo')
      })
      .catch(() => {
        if (vigente) setCargaTodos('error')
      })
    return () => {
      vigente = false
    }
  }, [uid, intento])

  const cargarMas = useCallback(() => {
    if (!siguiente || cargaMas === 'cargando') return
    setCargaMas('cargando')
    obtenerProfesionales(siguiente)
      .then((pagina) => {
        setTodos((anteriores) => [...anteriores, ...pagina.profesionales])
        setSiguiente(pagina.siguiente)
        setCargaMas('listo')
      })
      .catch(() => setCargaMas('error'))
  }, [siguiente, cargaMas])

  const profesionales = useMemo(
    () =>
      combinarProfesionales(delOyente.profesionales, [
        // El propio, primero: su versión en vivo gana a la de la lista.
        ...(uid && perfilPropio ? [{ uid, perfil: perfilPropio }] : []),
        ...(MOSTRAR_TODOS_LOS_PROFESIONALES ? todos : []),
      ]),
    [delOyente.profesionales, todos, uid, perfilPropio],
  )

  let estado: EstadoProfesionales = delOyente.estado
  if (delOyente.estado === 'error' || cargaTodos === 'error') estado = 'error'
  else if (
    delOyente.estado === 'cargando' ||
    cargaTodos === 'cargando' ||
    perfilPropio === undefined
  )
    estado = 'cargando'

  return {
    estado,
    profesionales,
    /** Cuántos huecos grises pintar mientras carga. */
    esqueletos: MOSTRAR_TODOS_LOS_PROFESIONALES
      ? Math.max(delOyente.totalVinculos, 4)
      : delOyente.totalVinculos,
    reintentar: () => {
      delOyente.reintentar()
      setIntento((n) => n + 1)
    },
    /** Solo en modo «todos»: quedan más por cargar. */
    hayMas: MOSTRAR_TODOS_LOS_PROFESIONALES && siguiente !== null,
    cargarMas,
    cargaMas,
  }
}
