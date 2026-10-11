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
}

export function idVinculo(profesionalUid: string, oyenteUid: string) {
  return `${profesionalUid}_${oyenteUid}`
}

/** Iniciales para el avatar cuando no hay foto principal. */
export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primera = partes[0].charAt(0)
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ''
  return (primera + ultima).toUpperCase()
}
