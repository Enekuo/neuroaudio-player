import type { AudioProfesional, EnvioAudio } from './modelo'

/** Un audio de «Mis audios» que el profesional le ha enviado a este oyente. */
export type AudioRecibido = { audio: AudioProfesional; recibidoEn: Date | null }

type Cancelar = () => void

/**
 * Junta los envíos de un oyente con sus audios: vigila cada audio enviado
 * mientras su envío exista (al retirarlo, deja de vigilarlo y desaparece).
 * Un audio que no se puede leer (borrado, vínculo en pausa…) no se muestra.
 * Avisa solo cuando ya sabe algo de todos, para no pintar la lista a medias.
 */
export function vigilarRecibidos(
  profesionalUid: string,
  escucharEnvios: (
    onEnvios: (envios: EnvioAudio[]) => void,
    onError: (error: Error) => void,
  ) => Cancelar,
  escucharAudio: (
    audioId: string,
    onAudio: (audio: AudioProfesional | null) => void,
  ) => Cancelar,
  onRecibidos: (recibidos: AudioRecibido[]) => void,
  onError: (error: Error) => void,
): Cancelar {
  // undefined: aún sin respuesta; null: no se puede leer.
  const vigilados = new Map<
    string,
    { cancelar: Cancelar; audio: AudioProfesional | null | undefined }
  >()
  let envios: EnvioAudio[] | null = null
  let activo = true

  const avisar = () => {
    if (!activo || !envios) return
    if (envios.some((e) => vigilados.get(e.audioId)?.audio === undefined))
      return
    onRecibidos(
      envios.flatMap((e) => {
        const audio = vigilados.get(e.audioId)?.audio
        return audio &&
          audio.tipo === 'biblioteca' &&
          audio.profesionalUid === profesionalUid
          ? [{ audio, recibidoEn: e.creadoEn }]
          : []
      }),
    )
  }

  const cancelarEnvios = escucharEnvios((nuevos) => {
    envios = nuevos
    const ids = new Set(nuevos.map((e) => e.audioId))
    for (const [id, vigilado] of vigilados) {
      if (!ids.has(id)) {
        vigilado.cancelar()
        vigilados.delete(id)
      }
    }
    for (const id of ids) {
      if (vigilados.has(id)) continue
      const vigilado = {
        cancelar: (() => {}) as Cancelar,
        audio: undefined as AudioProfesional | null | undefined,
      }
      vigilados.set(id, vigilado)
      vigilado.cancelar = escucharAudio(id, (audio) => {
        vigilado.audio = audio
        avisar()
      })
    }
    avisar()
  }, onError)

  return () => {
    activo = false
    cancelarEnvios()
    for (const vigilado of vigilados.values()) vigilado.cancelar()
    vigilados.clear()
  }
}

/**
 * «Para ti»: los audios personales y los recibidos de «Mis audios», juntos y
 * del más reciente al más antiguo (los recibidos, por la fecha del envío).
 */
export function juntarParaTi(
  personales: AudioProfesional[],
  recibidos: AudioRecibido[],
): AudioProfesional[] {
  return [
    ...personales.map((audio) => ({ audio, fecha: audio.creadoEn })),
    ...recibidos.map(({ audio, recibidoEn }) => ({ audio, fecha: recibidoEn })),
  ]
    .sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0))
    .map(({ audio }) => audio)
}
