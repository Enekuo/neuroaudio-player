import { MAX_TAMANO_AUDIO } from './modelo'

// Comprobación de los archivos de audio del profesional antes de subirlos.

export const FORMATOS_AUDIO = ['audio/mpeg', 'audio/mp4', 'audio/wav'] as const
export type FormatoAudio = (typeof FORMATOS_AUDIO)[number]

/** Lo que acepta el selector de archivos (extensiones y tipos habituales). */
export const ACEPTAR_AUDIO =
  '.mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav'

export class ErrorAudio extends Error {}

/**
 * Tipo real de un audio según sus primeros bytes, no según la extensión:
 * - MP3: etiqueta «ID3» o una cabecera de trama MPEG (11 bits a 1 y capa
 *   distinta de 0, que excluye el AAC «crudo»).
 * - M4A: caja «ftyp» en el byte 4 (contenedor MP4).
 * - WAV: «RIFF» … «WAVE».
 */
export function detectarTipoAudio(bytes: Uint8Array): FormatoAudio | null {
  const texto = (desde: number, largo: number) =>
    String.fromCharCode(...bytes.slice(desde, desde + largo))

  if (texto(0, 3) === 'ID3') return 'audio/mpeg'
  if (
    bytes[0] === 0xff &&
    (bytes[1] & 0xe0) === 0xe0 &&
    ((bytes[1] >> 1) & 0x03) !== 0
  ) {
    return 'audio/mpeg'
  }
  if (texto(4, 4) === 'ftyp') return 'audio/mp4'
  if (texto(0, 4) === 'RIFF' && texto(8, 4) === 'WAVE') return 'audio/wav'
  return null
}

/** Rechaza lo que no sea MP3, M4A o WAV de verdad, o pase del tamaño máximo. */
export async function comprobarArchivoAudio(file: File): Promise<FormatoAudio> {
  if (file.size === 0) {
    throw new ErrorAudio('El archivo está vacío.')
  }
  if (file.size > MAX_TAMANO_AUDIO) {
    throw new ErrorAudio(
      `El audio pesa más de ${Math.round(MAX_TAMANO_AUDIO / (1024 * 1024))} MB.`,
    )
  }
  const cabecera = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const tipo = detectarTipoAudio(cabecera)
  if (!tipo) {
    throw new ErrorAudio('El archivo no es un audio MP3, M4A o WAV.')
  }
  return tipo
}

/** Título de partida a partir del nombre del archivo («mi-audio_v2.mp3» → «mi audio v2»). */
export function tituloDesdeArchivo(nombre: string) {
  return nombre
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}
