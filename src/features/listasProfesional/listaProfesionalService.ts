import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Encuadre } from '../perfilProfesional/fotos/encuadre'
import {
  adquirirImagenPrivada,
  borrarImagenPrivada,
  soltarImagenPrivada,
  subirImagenCuadrada,
} from '../perfilProfesional/fotos/imagenPrivada'
import {
  PLANTILLAS_LISTA,
  huecoListaPropia,
  idListaPlantilla,
  type DatosLista,
  type ListaProfesional,
} from './modelo'

const COLECCION = 'listasProfesional'

export class ErrorLista extends Error {}

// ---------- Lectura ----------

const texto = (v: unknown) => (typeof v === 'string' ? v : '')
const fecha = (v: unknown) =>
  v && typeof (v as { toDate?: unknown }).toDate === 'function'
    ? (v as { toDate: () => Date }).toDate()
    : null

export function listaDesdeDocumento(
  id: string,
  d: DocumentData,
): ListaProfesional {
  return {
    id,
    profesionalUid: texto(d.profesionalUid),
    tipo: d.tipo === 'programa' ? 'programa' : 'lista',
    titulo: texto(d.titulo),
    descripcion: texto(d.descripcion),
    estado: d.estado === 'publicado' ? 'publicado' : 'borrador',
    plantillaId: typeof d.plantillaId === 'string' ? d.plantillaId : null,
    imagen: typeof d.imagen === 'string' ? d.imagen : null,
    audios: Array.isArray(d.audios)
      ? d.audios.filter((a: unknown): a is string => typeof a === 'string')
      : [],
    creadoEn: fecha(d.creadoEn),
    actualizadoEn: fecha(d.actualizadoEn),
  }
}

const porCreacion = (a: ListaProfesional, b: ListaProfesional) =>
  (a.creadoEn?.getTime() ?? Number.POSITIVE_INFINITY) -
    (b.creadoEn?.getTime() ?? Number.POSITIVE_INFINITY) ||
  a.id.localeCompare(b.id)

/** Todas las listas del profesional con sesión (también borradores), en vivo. */
export function escucharMisListas(
  profesionalUid: string,
  onListas: (listas: ListaProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
    ),
    (snap) =>
      onListas(
        snap.docs
          .map((d) => listaDesdeDocumento(d.id, d.data()))
          .sort(porCreacion),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Listas publicadas de un profesional, para un oyente con vínculo activo
 * (las reglas no dejan a nadie más), en vivo y por fecha de creación.
 */
export function escucharListasPublicadas(
  profesionalUid: string,
  onListas: (listas: ListaProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, COLECCION),
      where('profesionalUid', '==', profesionalUid),
      where('estado', '==', 'publicado'),
    ),
    (snap) =>
      onListas(
        snap.docs
          .map((d) => listaDesdeDocumento(d.id, d.data()))
          .sort(porCreacion),
      ),
    (error) => onError?.(error),
  )
}

/** Una lista, en vivo (null si no existe). */
export function escucharLista(
  listaId: string,
  onLista: (lista: ListaProfesional | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, COLECCION, listaId),
    (snap) =>
      onLista(snap.exists() ? listaDesdeDocumento(snap.id, snap.data()) : null),
    (error) => onError?.(error),
  )
}

// ---------- Escritura (solo el profesional dueño) ----------

function camposEditables(datos: DatosLista, deplantilla: boolean) {
  return {
    // Las de plantilla no guardan nombre ni imagen: son los de la plantilla.
    titulo: deplantilla ? '' : datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    estado: datos.estado,
    imagen: deplantilla ? null : datos.imagen,
    audios: datos.audios,
    actualizadoEn: serverTimestamp(),
  }
}

/**
 * Crea la lista de una plantilla. Su id es fijo por plantilla y profesional:
 * si ya existe, no se crea otra (las reglas tampoco dejarían pisarla).
 */
export async function crearListaDePlantilla(
  profesionalUid: string,
  plantillaId: string,
  datos: DatosLista,
) {
  if (!PLANTILLAS_LISTA.includes(plantillaId)) {
    throw new ErrorLista('Esa plantilla no existe.')
  }
  const id = idListaPlantilla(profesionalUid, plantillaId)
  const referencia = doc(db, COLECCION, id)
  if ((await getDoc(referencia)).exists()) {
    throw new ErrorLista('Ya tienes una lista con esta plantilla.')
  }
  await setDoc(referencia, {
    profesionalUid,
    tipo: 'lista',
    plantillaId,
    ...camposEditables(datos, true),
    creadoEn: serverTimestamp(),
  })
  return id
}

/**
 * Id para una lista propia nueva (el primer hueco libre), o error si ya
 * tiene el máximo. Se pide antes de subir su imagen, que va en una ruta con
 * ese id.
 */
export function nuevoIdListaPropia(
  profesionalUid: string,
  misListas: Pick<ListaProfesional, 'id'>[],
) {
  const id = huecoListaPropia(profesionalUid, misListas)
  if (!id) {
    throw new ErrorLista(
      'Has llegado al máximo de listas propias. Borra alguna para crear otra.',
    )
  }
  return id
}

/** Crea una lista propia con el id de `nuevoIdListaPropia`. */
export async function crearListaPropia(
  profesionalUid: string,
  id: string,
  datos: DatosLista,
) {
  const referencia = doc(db, COLECCION, id)
  if ((await getDoc(referencia)).exists()) {
    throw new ErrorLista('Esa lista ya existe. Vuelve a intentarlo.')
  }
  await setDoc(referencia, {
    profesionalUid,
    tipo: 'lista',
    plantillaId: null,
    ...camposEditables(datos, false),
    creadoEn: serverTimestamp(),
  })
}

export async function actualizarLista(
  lista: ListaProfesional,
  datos: DatosLista,
) {
  await updateDoc(
    doc(db, COLECCION, lista.id),
    camposEditables(datos, Boolean(lista.plantillaId)),
  )
}

export async function cambiarEstadoLista(
  lista: ListaProfesional,
  estado: ListaProfesional['estado'],
) {
  await updateDoc(doc(db, COLECCION, lista.id), {
    estado,
    actualizadoEn: serverTimestamp(),
  })
}

/** Borra la lista y su imagen propia, si tiene. */
export async function borrarLista(lista: ListaProfesional) {
  await deleteDoc(doc(db, COLECCION, lista.id))
  if (lista.imagen) {
    await borrarImagenLista(lista.profesionalUid, lista.id, lista.imagen)
  }
}

// ---------- Imagen propia (privada) ----------
// Mismo procesado, contador y lectura privada que la portada de los audios
// (perfilProfesional/fotos/imagenPrivada.ts).

export function rutaImagenLista(
  profesionalUid: string,
  listaId: string,
  imagenId: string,
) {
  return `listasPro/${profesionalUid}/${listaId}/${imagenId}`
}

/**
 * Comprueba, recorta (cuadrada, 512 px), limpia de metadatos y sube la
 * imagen propia de una lista. Usa el mismo contador de subidas por minuto
 * que las fotos del perfil. Devuelve el id de la imagen para guardarlo en la
 * lista (la anterior se borra al guardar) y la imagen ya recortada, para
 * enseñarla sin volver a descargarla.
 */
export function subirImagenLista(
  profesionalUid: string,
  listaId: string,
  file: File,
  encuadre?: Encuadre,
) {
  return subirImagenCuadrada(
    profesionalUid,
    (imagenId) => rutaImagenLista(profesionalUid, listaId, imagenId),
    file,
    encuadre,
  )
}

/** Borra una imagen de lista. Si ya no existe, no es un error. */
export function borrarImagenLista(
  profesionalUid: string,
  listaId: string,
  imagenId: string,
) {
  return borrarImagenPrivada(rutaImagenLista(profesionalUid, listaId, imagenId))
}

export function adquirirImagenLista(
  profesionalUid: string,
  listaId: string,
  imagenId: string,
) {
  return adquirirImagenPrivada(
    rutaImagenLista(profesionalUid, listaId, imagenId),
  )
}

export function soltarImagenLista(
  profesionalUid: string,
  listaId: string,
  imagenId: string,
) {
  soltarImagenPrivada(rutaImagenLista(profesionalUid, listaId, imagenId))
}
