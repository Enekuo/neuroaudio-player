// Listas del profesional (colección `listasProfesional`, imagen propia en
// Storage en `listasPro/{uid}/{listaId}/{imagenId}`). Separadas de las listas
// que cada usuario crea para sí mismo (`listas`), que no se tocan.
//
// Dos clases de lista, las dos solo para agrupar audios:
// - de plantilla: una de las 8 listas de la app (nombre e imagen fijos, los
//   de la plantilla); cada profesional usa cada plantilla una vez como mucho.
// - propia: nombre e imagen propios; como mucho MAX_LISTAS_PROPIAS.
// Las dos cosas las garantiza el id del documento (ver idListaPlantilla e
// idListaPropia), que comprueban las reglas.
//
// `tipo` deja sitio a los programas (secuencias con calendario): ahora solo
// se crean 'lista'; los campos propios de un programa llegarán con él.
//
// Los límites coinciden con firestore.rules y storage.rules: si cambias uno,
// cambia el otro.

import { LIST_TEMPLATES } from '../library/data/plantillasListas'

export const LIMITES_LISTA = {
  titulo: 80,
  descripcion: 2000,
  audios: 100,
} as const

/** Listas propias (no de plantilla) que puede tener un profesional. */
export const MAX_LISTAS_PROPIAS = 30

export type TipoLista = 'lista' | 'programa'
export type EstadoLista = 'borrador' | 'publicado'

/** Ids de las plantillas que puede usar un profesional (las 8 de la app). */
export const PLANTILLAS_LISTA = LIST_TEMPLATES.map((p) => p.id)

export type ListaProfesional = {
  id: string
  profesionalUid: string
  tipo: TipoLista
  /** Vacío en las de plantilla: su nombre es el de la plantilla. */
  titulo: string
  /** Texto plano opcional («para quién es / para quién no es»). Nunca HTML. */
  descripcion: string
  estado: EstadoLista
  /** Id de la plantilla, o null si es propia. */
  plantillaId: string | null
  /** Id de la imagen propia en Storage, o null (la de la plantilla, o ninguna). */
  imagen: string | null
  /** Ids de audios del propio profesional, en orden. */
  audios: string[]
  creadoEn: Date | null
  actualizadoEn: Date | null
}

/** Lo que se guarda al crear o editar (el resto lo pone el servicio). */
export type DatosLista = Pick<
  ListaProfesional,
  'titulo' | 'descripcion' | 'estado' | 'imagen' | 'audios'
>

/** Id de la lista de una plantilla: uno por plantilla y profesional. */
export function idListaPlantilla(profesionalUid: string, plantillaId: string) {
  return `${profesionalUid}__plantilla__${plantillaId}`
}

/** Id de la lista propia número `n` (de 1 a MAX_LISTAS_PROPIAS). */
export function idListaPropia(profesionalUid: string, n: number) {
  return `${profesionalUid}__propia__${n}`
}

/**
 * Primer hueco libre para una lista propia, o null si ya tiene el máximo.
 * Reutiliza los números de las listas borradas.
 */
export function huecoListaPropia(
  profesionalUid: string,
  listas: Pick<ListaProfesional, 'id'>[],
): string | null {
  const ocupados = new Set(listas.map((l) => l.id))
  for (let n = 1; n <= MAX_LISTAS_PROPIAS; n++) {
    const id = idListaPropia(profesionalUid, n)
    if (!ocupados.has(id)) return id
  }
  return null
}

/** Plantillas que aún no ha usado este profesional. */
export function plantillasLibres(
  listas: Pick<ListaProfesional, 'plantillaId'>[],
) {
  const usadas = new Set(listas.map((l) => l.plantillaId))
  return LIST_TEMPLATES.filter((p) => !usadas.has(p.id))
}

/** Nombre visible: el de la plantilla (fijo) o el suyo. */
export function nombreLista(
  lista: Pick<ListaProfesional, 'titulo' | 'plantillaId'>,
) {
  if (lista.plantillaId) {
    return (
      LIST_TEMPLATES.find((p) => p.id === lista.plantillaId)?.label ??
      lista.titulo
    )
  }
  return lista.titulo
}

/** Ids de audios de la lista que están en `disponibles`, en el orden de la lista. */
export function audiosVisibles(
  lista: Pick<ListaProfesional, 'audios'>,
  disponibles: ReadonlySet<string>,
) {
  return lista.audios.filter((id) => disponibles.has(id))
}

/** Errores de los datos antes de guardar (los mismos límites que las reglas). */
export function validarLista(
  datos: Pick<
    ListaProfesional,
    'titulo' | 'descripcion' | 'audios' | 'plantillaId'
  >,
) {
  const errores: string[] = []
  if (!datos.plantillaId && !datos.titulo.trim()) {
    errores.push('Ponle un nombre a la lista.')
  }
  if (datos.titulo.trim().length > LIMITES_LISTA.titulo) {
    errores.push(
      `El nombre puede tener ${LIMITES_LISTA.titulo} caracteres como mucho.`,
    )
  }
  if (datos.descripcion.trim().length > LIMITES_LISTA.descripcion) {
    errores.push(
      `La descripción puede tener ${LIMITES_LISTA.descripcion} caracteres como mucho.`,
    )
  }
  if (datos.audios.length > LIMITES_LISTA.audios) {
    errores.push(
      `Una lista puede tener ${LIMITES_LISTA.audios} audios como mucho.`,
    )
  }
  if (new Set(datos.audios).size !== datos.audios.length) {
    errores.push('Hay un audio repetido en la lista.')
  }
  return errores
}
