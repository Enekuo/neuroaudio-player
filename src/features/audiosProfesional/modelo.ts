// Audios del profesional (colección `audiosProfesional`, Storage en
// `audiosPro/{uid}/{audioId}/archivo`). Separados de los audios que cada
// usuario sube para sí mismo (`audios`), que no se tocan.
//
// Tres tipos:
// - general: los que ven todos los oyentes con vínculo activo.
// - personal: para un oyente concreto (`destinatarioUid`), de un solo uso.
// - biblioteca («Mis audios»): privados del profesional; los ve solo quien
//   los recibe por un envío (`enviosAudio`). Su archivo y su portada van en
//   `bibliotecaPro/{uid}/{audioId}/…`, para que la regla de Storage solo
//   tenga que mirar el envío y el vínculo.
//
// Los límites coinciden con firestore.rules y storage.rules: si cambias uno,
// cambia el otro.

export const LIMITES_AUDIO = {
  titulo: 120,
  descripcion: 2000,
} as const

/** Tamaño máximo de un archivo de audio (fácil de cambiar; repetir en storage.rules). */
export const MAX_TAMANO_AUDIO = 100 * 1024 * 1024

/** Audios nuevos por minuto que puede subir un profesional (repetir en firestore.rules). */
export const SUBIDAS_AUDIO_POR_MINUTO = 10

export type EstadoAudio = 'borrador' | 'publicado'
export type TipoAudio = 'general' | 'personal' | 'biblioteca'

/** Límites de «Mis audios» (provisionales hasta que haya planes). */
export const LIMITES_BIBLIOTECA = {
  /** Audios en la biblioteca (lo controla la app; las reglas no cuentan). */
  audios: 200,
  /** Personas a las que se envía un audio de una vez. */
  enviosALaVez: 20,
  /** Etiquetas por audio y largo de cada una (repetir en firestore.rules). */
  etiquetas: 5,
  etiqueta: 30,
} as const

/**
 * Etiqueta tal como se guarda: sin espacios sobrantes, en minúsculas y
 * cortada al máximo («Ansiedad » y «ansiedad» son la misma).
 */
export function normalizarEtiqueta(texto: string) {
  return texto
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, LIMITES_BIBLIOTECA.etiqueta)
    .trim()
}

/** Etiquetas sin vacías ni repetidas, como mucho las permitidas. */
export function normalizarEtiquetas(etiquetas: string[]) {
  return [...new Set(etiquetas.map(normalizarEtiqueta).filter(Boolean))].slice(
    0,
    LIMITES_BIBLIOTECA.etiquetas,
  )
}

/**
 * Envío de un audio de la biblioteca a un oyente
 * (`enviosAudio/{audioId}__{oyenteUid}`). Retirarlo es borrarlo.
 */
export type EnvioAudio = {
  id: string
  profesionalUid: string
  audioId: string
  oyenteUid: string
  creadoEn: Date | null
}

export function idEnvio(audioId: string, oyenteUid: string) {
  return `${audioId}__${oyenteUid}`
}

/**
 * Portada que elige el profesional para el audio (reproductor, pantalla de
 * bloqueo y miniaturas):
 * - 'defecto': la de NeuroAudio (el orbe en el reproductor grande; el logo
 *   en la pantalla de bloqueo y en las miniaturas).
 * - 'profesional': su foto principal (si no tiene, la de NeuroAudio).
 * - 'propia': una imagen que sube él (`portadaImagen`).
 * Los audios anteriores a la portada no tienen el campo: son 'defecto'.
 */
export type TipoPortadaAudio = 'defecto' | 'profesional' | 'propia'
export const TIPOS_PORTADA_AUDIO: TipoPortadaAudio[] = [
  'defecto',
  'profesional',
  'propia',
]

export type AudioProfesional = {
  id: string
  profesionalUid: string
  titulo: string
  descripcion: string
  estado: EstadoAudio
  tipo: TipoAudio
  /** Solo en los `personal`: el oyente al que va dirigido. */
  destinatarioUid: string | null
  /** Ruta del archivo en Storage. */
  archivo: string
  duracionSegundos: number
  tamanoBytes: number
  contieneSalud: boolean
  orden: number
  portada: TipoPortadaAudio
  /** Id de la imagen propia (solo con portada 'propia'). */
  portadaImagen: string | null
  /** Temas (solo en la biblioteca), normalizados. */
  etiquetas: string[]
  /**
   * En un general añadido desde Biblioteca: el id de su audio original (usa
   * su mismo archivo y su imagen). null en los demás.
   */
  deMisAudios: string | null
  /** En uno de Biblioteca: también está en Audios (su general existe). */
  enAudios: boolean
  /**
   * En uno de Biblioteca: su general en Audios está publicado. Lo mira
   * Storage para dejar oírlo a cualquier oyente vinculado.
   */
  publicoEnAudios: boolean
  /** En uno de Biblioteca: está en un programa para todos publicado. */
  enProgramaPublico: boolean
  creadoEn: Date | null
  actualizadoEn: Date | null
}

/** Id del audio general que se crea al añadir a Audios uno de Biblioteca. */
export function idGeneralDeBiblioteca(audioId: string) {
  return `${audioId}__general`
}

/**
 * El otro documento del mismo audio (el de Biblioteca y su general en
 * Audios), si lo tiene: título, descripción, imagen y salud se guardan en
 * los dos a la vez.
 */
export function audioEnlazado(
  audio: Pick<AudioProfesional, 'id' | 'tipo' | 'deMisAudios' | 'enAudios'>,
) {
  if (audio.deMisAudios) return audio.deMisAudios
  return audio.tipo === 'biblioteca' && audio.enAudios
    ? idGeneralDeBiblioteca(audio.id)
    : null
}

/**
 * Dónde está la imagen propia de un audio: un general añadido desde
 * Biblioteca usa la de su original.
 */
export function carpetaDePortada(
  audio: Pick<AudioProfesional, 'id' | 'tipo' | 'deMisAudios'>,
) {
  return audio.deMisAudios
    ? { audioId: audio.deMisAudios, biblioteca: true }
    : { audioId: audio.id, biblioteca: audio.tipo === 'biblioteca' }
}

/** Carpeta de Storage de un audio: la de la biblioteca va aparte. */
function carpetaAudio(
  profesionalUid: string,
  audioId: string,
  biblioteca: boolean,
) {
  return `${biblioteca ? 'bibliotecaPro' : 'audiosPro'}/${profesionalUid}/${audioId}`
}

/** Imagen propia de la portada de un audio, junto a su archivo. */
export function rutaPortadaAudio(
  profesionalUid: string,
  audioId: string,
  imagenId: string,
  biblioteca = false,
) {
  return `${carpetaAudio(profesionalUid, audioId, biblioteca)}/portadas/${imagenId}`
}

export function rutaAudio(
  profesionalUid: string,
  audioId: string,
  biblioteca = false,
) {
  return `${carpetaAudio(profesionalUid, audioId, biblioteca)}/archivo`
}
