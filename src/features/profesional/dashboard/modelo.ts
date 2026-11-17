import type { PerfilProfesional } from '../../perfilProfesional/modelo'

/**
 * Datos del Dashboard del panel: qué cuenta cada número (colección y
 * filtros, siempre del propio profesional) y cuándo se marca cada uno de los
 * «Primeros pasos». Sin Firebase: el servicio convierte estas consultas en
 * consultas de conteo (getCountFromServer), que no leen los documentos.
 */

export type ClaveConteo =
  | 'audiosPublicados'
  | 'audiosTotales'
  | 'oyentesActivos'
  | 'vinculosTotales'
  | 'programasPublicados'
  | 'programasTotales'

export type Filtro =
  | [campo: string, operador: '==', valor: string]
  | [campo: string, operador: 'in', valor: string[]]

export type ConsultaConteo = {
  clave: ClaveConteo
  coleccion: 'audiosProfesional' | 'vinculos' | 'programasProfesional'
  filtros: Filtro[]
}

export type Conteos = Record<ClaveConteo, number>

/** Las 6 consultas de conteo del Dashboard para un profesional. */
export function consultasDashboard(uid: string): ConsultaConteo[] {
  const delProfesional: Filtro = ['profesionalUid', '==', uid]
  return [
    // «Audios publicados»: los que ven sus oyentes (generales y personales
    // publicados). Los de Biblioteca son privados y no cuentan.
    {
      clave: 'audiosPublicados',
      coleccion: 'audiosProfesional',
      filtros: [
        delProfesional,
        ['estado', '==', 'publicado'],
        ['tipo', 'in', ['general', 'personal']],
      ],
    },
    // «Sube tu primer audio»: cualquier audio suyo (también en Biblioteca o
    // en borrador).
    {
      clave: 'audiosTotales',
      coleccion: 'audiosProfesional',
      filtros: [delProfesional],
    },
    // «Oyentes»: vínculos activos (los pausados no cuentan).
    {
      clave: 'oyentesActivos',
      coleccion: 'vinculos',
      filtros: [delProfesional, ['estado', '==', 'activo']],
    },
    // «Invita a tu primer oyente»: cualquier vínculo (activo o en pausa).
    {
      clave: 'vinculosTotales',
      coleccion: 'vinculos',
      filtros: [delProfesional],
    },
    // «Programas»: publicados (no borradores).
    {
      clave: 'programasPublicados',
      coleccion: 'programasProfesional',
      filtros: [delProfesional, ['estado', '==', 'publicado']],
    },
    // «Crea tu primer programa»: cualquier programa (también borradores).
    {
      clave: 'programasTotales',
      coleccion: 'programasProfesional',
      filtros: [delProfesional],
    },
  ]
}

/**
 * Perfil completo: tiene nombre, frase, «A qué me dedico» y foto principal
 * (lo que ve un oyente arriba del todo en su página).
 */
export function perfilCompleto(
  perfil: Pick<
    PerfilProfesional,
    'nombre' | 'frase' | 'dedicacion' | 'fotoPrincipalId'
  > | null,
) {
  return Boolean(
    perfil &&
      perfil.nombre.trim() &&
      perfil.frase.trim() &&
      perfil.dedicacion.trim() &&
      perfil.fotoPrincipalId,
  )
}

/** Adónde lleva el enlace de un paso pendiente. */
export type AccionPaso =
  | { tipo: 'ruta'; destino: string }
  | { tipo: 'subirAudio' }
  | { tipo: 'crearPrograma' }

export type PasoInicial = {
  id: 'perfil' | 'audio' | 'oyente' | 'programa'
  texto: string
  hecho: boolean
  /** Enlace corto del paso pendiente (null: hoy no hay forma de hacerlo). */
  accion: { texto: string; destino: AccionPaso } | null
}

/**
 * Los 4 «Primeros pasos», con datos reales (no se guarda nada nuevo).
 * «Invita a tu primer oyente» no lleva enlace: hoy no se puede añadir un
 * oyente desde el panel (los vínculos no se crean desde la app).
 */
export function primerosPasos(
  perfil: Parameters<typeof perfilCompleto>[0],
  conteos: Pick<Conteos, 'audiosTotales' | 'vinculosTotales' | 'programasTotales'>,
): PasoInicial[] {
  return [
    {
      id: 'perfil',
      texto: 'Completa tu perfil',
      hecho: perfilCompleto(perfil),
      accion: {
        texto: 'Completar',
        destino: { tipo: 'ruta', destino: '/profesional/perfil' },
      },
    },
    {
      id: 'audio',
      texto: 'Sube tu primer audio',
      hecho: conteos.audiosTotales > 0,
      accion: { texto: 'Subir', destino: { tipo: 'subirAudio' } },
    },
    {
      id: 'oyente',
      texto: 'Invita a tu primer oyente',
      hecho: conteos.vinculosTotales > 0,
      accion: null,
    },
    {
      id: 'programa',
      texto: 'Crea tu primer programa',
      hecho: conteos.programasTotales > 0,
      accion: { texto: 'Crear', destino: { tipo: 'crearPrograma' } },
    },
  ]
}

/** Aviso que se pasa al navegar para abrir un flujo de otra página. */
export const ABRIR_SUBIDA = 'subirAudio'
export const ABRIR_NUEVO_PROGRAMA = 'crearPrograma'
export type EstadoNavegacion = { abrir?: string } | null

export const RUTA_SUBIR_AUDIO = '/profesional/mis-audios'
export const RUTA_CREAR_PROGRAMA = '/profesional/listas/programas'
