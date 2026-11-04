import { useEffect, useMemo, useState } from 'react'
import { escucharAudio } from '../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../audiosProfesional/modelo'
import { escucharInicioVinculo } from '../perfilProfesional/perfilService'
import { diaUno, type AccesoPrograma, type ProgramaProfesional } from './modelo'
import {
  escucharMisAccesosPrograma,
  escucharPrograma,
  escucharProgramasParaTodos,
  escucharProgreso,
} from './programaService'

export type ProgramaDelOyente = {
  programa: ProgramaProfesional
  /** Ids de audio completados (vacío si aún no ha empezado). */
  completados: string[]
  /** Su día 1 (null si aún no se sabe). */
  dia1: Date | null
}

/** Escucha un documento por cada id y guarda lo que llega, por id. */
function usePorId<T>(
  ids: string[],
  escuchar: (id: string, on: (valor: T) => void) => () => void,
) {
  const [valores, setValores] = useState<Record<string, T>>({})
  const clave = [...ids].sort().join(',')
  useEffect(() => {
    if (!clave) return
    const cancelar = clave
      .split(',')
      .map((id) => escuchar(id, (v) => setValores((a) => ({ ...a, [id]: v }))))
    return () => cancelar.forEach((c) => c())
    // `escuchar` es estable en cada uso (una función del servicio).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return valores
}

/**
 * Los programas de un profesional para este oyente, en vivo: los publicados
 * para todos y los privados que le han dado, cada uno con lo que ha
 * completado y su día 1. Solo con vínculo activo (`activo`); si se pausa,
 * las reglas cortan las lecturas y la lista queda vacía, sin errores. Al
 * reanudar vuelve todo, con su progreso.
 */
export function useProgramasDelOyente(
  profesionalUid: string,
  oyenteUid: string | null,
  activo: boolean,
) {
  const [paraTodos, setParaTodos] = useState<ProgramaProfesional[] | null>(null)
  const [accesos, setAccesos] = useState<AccesoPrograma[] | null>(null)
  const [inicioVinculo, setInicioVinculo] = useState<Date | null>(null)

  useEffect(() => {
    if (!activo || !oyenteUid) {
      setParaTodos(null)
      setAccesos(null)
      return
    }
    const cancelar = [
      escucharProgramasParaTodos(profesionalUid, setParaTodos, () =>
        setParaTodos([]),
      ),
      escucharMisAccesosPrograma(profesionalUid, oyenteUid, setAccesos, () =>
        setAccesos([]),
      ),
      escucharInicioVinculo(profesionalUid, oyenteUid, setInicioVinculo),
    ]
    return () => cancelar.forEach((c) => c())
  }, [profesionalUid, oyenteUid, activo])

  const idsPrivados = useMemo(
    () => (accesos ?? []).map((a) => a.programaId),
    [accesos],
  )
  const privadosLeidos = usePorId<ProgramaProfesional | null>(
    activo ? idsPrivados : [],
    escucharPrograma,
  )

  const todosIds = useMemo(
    () => [...(paraTodos ?? []).map((p) => p.id), ...idsPrivados],
    [paraTodos, idsPrivados],
  )
  const progresos = usePorId<string[]>(
    activo && oyenteUid ? todosIds : [],
    (id, on) => escucharProgreso(id, oyenteUid ?? '', on, () => on([])),
  )

  return useMemo(() => {
    if (!activo || !paraTodos || !accesos) {
      return { paraTodos: null, privados: null }
    }
    const conProgreso = (
      programa: ProgramaProfesional,
      accesoEn: Date | null,
    ): ProgramaDelOyente => ({
      programa,
      completados: progresos[programa.id] ?? [],
      dia1: diaUno(programa, { accesoEn, vinculoCreadoEn: inicioVinculo }),
    })
    const privados = accesos.flatMap((a) => {
      const p = privadosLeidos[a.programaId]
      return p && p.estado === 'publicado' && p.para === 'personas'
        ? [conProgreso(p, a.creadoEn)]
        : []
    })
    // Hasta saber de todos los privados, se esperan (sin pintar a medias).
    const faltan = accesos.some((a) => !(a.programaId in privadosLeidos))
    return {
      paraTodos: paraTodos.map((p) => conProgreso(p, null)),
      privados: faltan ? null : privados,
    }
  }, [activo, paraTodos, accesos, privadosLeidos, progresos, inicioVinculo])
}

/** Los audios de los pasos de un programa, en vivo (null: no se puede oír). */
export function useAudiosDePasos(pasos: string[]) {
  return usePorId<AudioProfesional | null>(pasos, escucharAudio)
}
