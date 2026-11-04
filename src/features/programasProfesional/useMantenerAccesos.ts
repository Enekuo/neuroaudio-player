import { useEffect, useMemo, useRef, useState } from 'react'
import {
  escucharMiBiblioteca,
  escucharMisAudiosGenerales,
  escucharMisEnvios,
} from '../audiosProfesional/audioProfesionalService'
import type { AudioProfesional, EnvioAudio } from '../audiosProfesional/modelo'
import type { OyenteDelProfesional } from '../perfilProfesional/modelo'
import { escucharMisOyentes } from '../perfilProfesional/perfilService'
import { calcularAccesos } from './accesos'
import type { AccesoPrograma, ProgramaProfesional } from './modelo'
import {
  aplicarCambiosDeAccesos,
  escucharAccesosDeMisProgramas,
  escucharMisProgramas,
} from './programaService'

type Datos = {
  biblioteca: AudioProfesional[] | null
  generales: AudioProfesional[] | null
  envios: EnvioAudio[] | null
  programas: ProgramaProfesional[] | null
  accesos: AccesoPrograma[] | null
  oyentes: OyenteDelProfesional[] | null
}

const VACIO: Datos = {
  biblioteca: null,
  generales: null,
  envios: null,
  programas: null,
  accesos: null,
  oyentes: null,
}

/**
 * Mantiene al día, mientras está montado, quién puede oír cada audio de la
 * Biblioteca (ver accesos.ts): la lista de cada vínculo y las marcas de
 * cada audio. La primera vez repara lo que ya existía (envíos y audios en
 * Audios de antes); después, cada cambio (enviar, retirar, publicar en
 * Audios, programas…) se escribe al momento. Solo escribe lo que no
 * cuadra, y no repite una escritura que ya ha fallado. Sin interfaz.
 *
 * Lo usan las páginas donde cambian esas cosas: Biblioteca, Audios y la
 * ficha de un oyente. Las consultas son las mismas que ya hacen esas
 * páginas (Firestore no las paga dos veces mientras coinciden).
 */
export function useMantenerAccesos(uid: string) {
  const [datos, setDatos] = useState<Datos>(VACIO)
  const [error, setError] = useState(false)
  const intentado = useRef<string | null>(null)
  const enMarcha = useRef(false)
  // Al terminar una escritura se vuelve a mirar (por si cambió algo entre tanto).
  const [pasada, setPasada] = useState(0)

  useEffect(() => {
    setDatos(VACIO)
    setError(false)
    const poner =
      <K extends keyof Datos>(clave: K) =>
      (valor: NonNullable<Datos[K]>) =>
        setDatos((d) => ({ ...d, [clave]: valor }))
    const fallo = () => setError(true)
    const cancelar = [
      escucharMiBiblioteca(uid, poner('biblioteca'), fallo),
      escucharMisAudiosGenerales(uid, poner('generales'), fallo),
      escucharMisEnvios(uid, poner('envios'), fallo),
      escucharMisProgramas(uid, poner('programas'), fallo),
      escucharAccesosDeMisProgramas(uid, poner('accesos'), fallo),
      escucharMisOyentes(uid, poner('oyentes'), fallo),
    ]
    return () => cancelar.forEach((c) => c())
  }, [uid])

  const cambios = useMemo(() => {
    const { biblioteca, generales, envios, programas, accesos, oyentes } = datos
    if (
      error ||
      !biblioteca ||
      !generales ||
      !envios ||
      !programas ||
      !accesos ||
      !oyentes
    )
      return null
    return calcularAccesos({
      biblioteca,
      generales,
      envios,
      programas,
      accesos,
      vinculos: oyentes,
    })
  }, [datos, error])

  useEffect(() => {
    if (!cambios || enMarcha.current) return
    if (cambios.vinculos.length === 0 && cambios.audios.length === 0) {
      intentado.current = null
      return
    }
    const firma = JSON.stringify(cambios)
    if (firma === intentado.current) return
    intentado.current = firma
    enMarcha.current = true
    aplicarCambiosDeAccesos(uid, cambios)
      .catch((e) =>
        console.error('No se pudieron actualizar los accesos de Biblioteca', e),
      )
      .finally(() => {
        enMarcha.current = false
        setPasada((n) => n + 1)
      })
  }, [cambios, uid, pasada])
}
