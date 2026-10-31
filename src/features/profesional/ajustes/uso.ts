import type { AudioProfesional } from '../../audiosProfesional/modelo'

/**
 * Uso del profesional: sus audios (generales, «para una persona» y Mis
 * audios) y el espacio de sus archivos de audio (sin fotos ni portadas, que
 * no guardan su tamaño). Se cuenta por archivo: un audio de Biblioteca que
 * también está en Audios es el mismo archivo y no suma dos veces.
 */
export function resumirUso(grupos: AudioProfesional[][]) {
  const porArchivo = new Map<string, AudioProfesional>()
  for (const audios of grupos)
    for (const a of audios) porArchivo.set(a.archivo || a.id, a)
  const audios = [...porArchivo.values()]
  return {
    audios: audios.length,
    bytes: audios.reduce(
      (total, a) =>
        total +
        (Number.isFinite(a.tamanoBytes) && a.tamanoBytes > 0
          ? a.tamanoBytes
          : 0),
      0,
    ),
  }
}
