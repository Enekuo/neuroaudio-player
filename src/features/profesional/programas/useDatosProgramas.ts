import { useEffect, useMemo, useState } from 'react'
import { escucharMiBiblioteca } from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import type { OyenteDelProfesional } from '../../perfilProfesional/modelo'
import { escucharMisOyentes } from '../../perfilProfesional/perfilService'
import type {
  AccesoPrograma,
  ProgramaProfesional,
} from '../../programasProfesional/modelo'
import {
  escucharAccesosDeMisProgramas,
  escucharMisProgramas,
} from '../../programasProfesional/programaService'
import { useMantenerAccesos } from '../../programasProfesional/useMantenerAccesos'

export type DatosProgramas = {
  uid: string
  programas: ProgramaProfesional[] | null
  /** Las personas de cada programa privado, por id del programa. */
  accesosPorPrograma: Map<string, AccesoPrograma[]>
  biblioteca: AudioProfesional[] | null
  oyentes: OyenteDelProfesional[] | null
  error: boolean
}

/**
 * Lo que necesitan la pestaña «Programas» y la página de un programa: sus
 * programas, sus personas, su Biblioteca y sus oyentes, en vivo. Mientras
 * está montado, mantiene al día quién puede oír cada audio de Biblioteca
 * (publicar, cambiar pasos, dar o quitar a alguien…).
 */
export function useDatosProgramas(uid: string): DatosProgramas {
  const [programas, setProgramas] = useState<ProgramaProfesional[] | null>(null)
  const [accesos, setAccesos] = useState<AccesoPrograma[] | null>(null)
  const [biblioteca, setBiblioteca] = useState<AudioProfesional[] | null>(null)
  const [oyentes, setOyentes] = useState<OyenteDelProfesional[] | null>(null)
  const [error, setError] = useState(false)

  useMantenerAccesos(uid)

  useEffect(() => {
    const fallo = () => setError(true)
    const cancelar = [
      escucharMisProgramas(uid, setProgramas, fallo),
      escucharAccesosDeMisProgramas(uid, setAccesos, fallo),
      escucharMiBiblioteca(uid, setBiblioteca, fallo),
      escucharMisOyentes(uid, setOyentes, fallo),
    ]
    return () => cancelar.forEach((c) => c())
  }, [uid])

  const accesosPorPrograma = useMemo(() => {
    const mapa = new Map<string, AccesoPrograma[]>()
    for (const a of accesos ?? []) {
      mapa.set(a.programaId, [...(mapa.get(a.programaId) ?? []), a])
    }
    return mapa
  }, [accesos])

  return {
    uid,
    programas: accesos ? programas : null,
    accesosPorPrograma,
    biblioteca,
    oyentes,
    error,
  }
}
