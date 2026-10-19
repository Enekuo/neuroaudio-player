// Modelo del perfil del profesional y del vínculo profesional ↔ oyente.
// Lo comparten el panel del profesional (que lo edita) y la app de usuario
// (donde el oyente vinculado lo ve). Los límites de aquí son los mismos que
// comprueban las reglas de Firestore (firestore.rules): si cambias uno,
// cambia el otro.

import type { Encuadre } from './fotos/encuadre'

/** Fotos adicionales permitidas además de la principal (fácil de cambiar). */
export const MAX_FOTOS_ADICIONALES = 8
export const MAX_FOTOS = MAX_FOTOS_ADICIONALES + 1

export const LIMITES = {
  nombre: 80,
  frase: 160,
  dedicacion: 4000,
  enlace: 300,
  bienvenida: 4000,
  altFoto: 200,
  tituloSeccion: 120,
  textoSeccion: 10000,
  secciones: 30,
} as const

export const OPCIONES_RESPUESTA = [
  { valor: 'mismo-dia', etiqueta: 'El mismo día' },
  { valor: '1-2-dias', etiqueta: 'En 1 o 2 días' },
  { valor: '3-5-dias', etiqueta: 'En 3 a 5 días' },
] as const

export type TiempoRespuesta = (typeof OPCIONES_RESPUESTA)[number]['valor']

export const REDES = ['web', 'instagram', 'youtube', 'tiktok'] as const
export type Red = (typeof REDES)[number]
export type Enlaces = Partial<Record<Red, string>>

export type FotoPerfil = {
  id: string
  /** Texto alternativo opcional (vacío si no lo hay). */
  alt: string
  /**
   * Encuadre elegido en «Ajustar foto» (solo si se ha usado como principal).
   * Se reutiliza al volver a ajustarla.
   */
  encuadre?: Encuadre
}

export type SeccionPerfil = {
  id: string
  titulo: string
  /** Texto plano con saltos de línea. Nunca HTML. */
  texto: string
  /** Fotos del propio perfil que acompañan a la sección. */
  fotoIds: string[]
  visible: boolean
}

/**
 * Documento `perfilesProfesionales/{uid}`. El orden de `fotos` y de
 * `secciones` es el orden en el que se muestran.
 */
export type PerfilProfesional = {
  nombre: string
  frase: string
  /** «A qué me dedico»: texto libre del propio profesional. */
  dedicacion: string
  enlaces: Enlaces
  bienvenida: string
  respuesta: TiempoRespuesta | null
  fotos: FotoPerfil[]
  /** Id de la foto principal (una de `fotos`), o null si no hay. */
  fotoPrincipalId: string | null
  secciones: SeccionPerfil[]
}

export function perfilVacio(): PerfilProfesional {
  return {
    nombre: '',
    frase: '',
    dedicacion: '',
    enlaces: {},
    bienvenida: '',
    respuesta: null,
    fotos: [],
    fotoPrincipalId: null,
    secciones: [],
  }
}

/**
 * Documento `vinculos/{profesionalUid}_{oyenteUid}`: da permiso al oyente para
 * ver el perfil (y, más adelante, lo que el profesional le asigne). De momento
 * solo se crea a mano desde la consola; lo creará la página Oyentes al invitar.
 */
export type Vinculo = {
  profesionalUid: string
  oyenteUid: string
  estado: 'activo' | 'pausado'
  // Opcionales: hoy se escriben a mano en la consola (`creadoEn`, como
  // timestamp). `estadoCambiadoEn` lo pone el profesional al pausar o
  // reanudar (hora del servidor).
  creadoEn?: Date
  oyenteNombre?: string
  oyenteEmail?: string
  estadoCambiadoEn?: Date
}

/** Máximo de oyentes que carga el panel de una vez. */
export const MAX_OYENTES = 500

/** Largo máximo de la nota privada del profesional sobre un oyente. */
export const MAX_NOTA_PRIVADA = 2000

/**
 * Un oyente del profesional, visto desde el panel (sale de su vínculo: el
 * profesional no puede leer el perfil de otro usuario). `nombre` es el campo
 * opcional `oyenteNombre` del vínculo; hoy se escribe a mano en la consola y
 * más adelante lo rellenará la página Oyentes al crear el vínculo.
 */
export type OyenteDelProfesional = {
  oyenteUid: string
  /** Vacío si el vínculo no tiene `oyenteNombre`. */
  nombre: string
  estado: Vinculo['estado']
  /** `oyenteEmail` del vínculo (vacío si no lo tiene). */
  email: string
  /** Fecha de entrada (`creadoEn`); null si falta. */
  creadoEn: Date | null
  /** Último cambio de estado (para «En pausa desde…»); null si nunca. */
  estadoCambiadoEn: Date | null
}

const fecha = (valor: unknown) =>
  valor && typeof (valor as { toDate?: unknown }).toDate === 'function'
    ? ((valor as { toDate: () => Date }).toDate() ?? null)
    : null

/**
 * Un vínculo (tal cual viene de Firestore) visto como oyente del panel. Los
 * datos que falten o tengan otro tipo quedan vacíos (se pintan como «—»).
 * Null si el documento no tiene oyente.
 */
export function oyenteDesdeVinculo(
  datos: Record<string, unknown>,
): OyenteDelProfesional | null {
  if (typeof datos.oyenteUid !== 'string' || !datos.oyenteUid) return null
  return {
    oyenteUid: datos.oyenteUid,
    nombre: typeof datos.oyenteNombre === 'string' ? datos.oyenteNombre : '',
    estado: datos.estado === 'activo' ? 'activo' : 'pausado',
    email:
      typeof datos.oyenteEmail === 'string' ? datos.oyenteEmail.trim() : '',
    creadoEn: fecha(datos.creadoEn),
    estadoCambiadoEn: fecha(datos.estadoCambiadoEn),
  }
}

/** Del más reciente al más antiguo; sin fecha, al final (por nombre). */
export function ordenarOyentes(oyentes: OyenteDelProfesional[]) {
  return [...oyentes].sort(
    (a, b) =>
      (b.creadoEn?.getTime() ?? -Infinity) -
        (a.creadoEn?.getTime() ?? -Infinity) ||
      etiquetaOyente(a).localeCompare(etiquetaOyente(b), 'es'),
  )
}

/**
 * Cómo se llama a un oyente en el panel: su `oyenteNombre` o, si no lo hay,
 * «Oyente» y los 4 últimos caracteres de su uid (estable y sin enseñar el uid
 * entero).
 */
export function etiquetaOyente(
  oyente: Pick<OyenteDelProfesional, 'oyenteUid' | 'nombre'>,
) {
  return (
    oyente.nombre.trim() || `Oyente ${oyente.oyenteUid.slice(-4).toUpperCase()}`
  )
}

export function idVinculo(profesionalUid: string, oyenteUid: string) {
  return `${profesionalUid}_${oyenteUid}`
}

/** Iniciales para el avatar cuando no hay foto principal. */
export function iniciales(nombre: string) {
  // Primera letra (o número) de cada palabra, sin contar símbolos.
  const letras = nombre
    .split(/\s+/)
    .map((palabra) => palabra.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((letra): letra is string => Boolean(letra))
  if (letras.length === 0) return '?'
  const ultima = letras.length > 1 ? letras[letras.length - 1] : ''
  return (letras[0] + ultima).toUpperCase()
}
