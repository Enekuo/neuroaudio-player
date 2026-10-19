import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  MAX_OYENTES,
  REDES,
  idVinculo,
  oyenteDesdeVinculo,
  ordenarOyentes,
  perfilVacio,
  type OyenteDelProfesional,
  type Enlaces,
  type FotoPerfil,
  type PerfilProfesional,
  type SeccionPerfil,
} from './modelo'
import { esTiempoRespuesta } from './validacion'
import { esEncuadre } from './fotos/encuadre'

const texto = (valor: unknown) => (typeof valor === 'string' ? valor : '')

/**
 * Convierte el documento de Firestore en un perfil, tolerando campos que
 * falten o vengan mal: un perfil a medias se muestra con lo que haya.
 */
export function perfilDesdeDocumento(
  data: DocumentData | undefined,
): PerfilProfesional {
  const vacio = perfilVacio()
  if (!data) return vacio

  const enlaces: Enlaces = {}
  if (data.enlaces && typeof data.enlaces === 'object') {
    for (const red of REDES) {
      const url = texto(data.enlaces[red])
      if (url) enlaces[red] = url
    }
  }

  const fotos: FotoPerfil[] = Array.isArray(data.fotos)
    ? data.fotos
        .filter(
          (f: unknown): f is Record<string, unknown> =>
            !!f && typeof f === 'object',
        )
        .map((f) => ({
          id: texto(f.id),
          alt: texto(f.alt),
          ...(esEncuadre(f.encuadre) ? { encuadre: f.encuadre } : {}),
        }))
        .filter((f) => f.id)
    : []

  const secciones: SeccionPerfil[] = Array.isArray(data.secciones)
    ? data.secciones
        .filter(
          (s: unknown): s is Record<string, unknown> =>
            !!s && typeof s === 'object',
        )
        .map((s) => ({
          id: texto(s.id),
          titulo: texto(s.titulo),
          texto: texto(s.texto),
          fotoIds: Array.isArray(s.fotoIds)
            ? s.fotoIds.filter((id): id is string => typeof id === 'string')
            : [],
          visible: s.visible !== false,
        }))
        .filter((s) => s.id)
    : []

  const principal = texto(data.fotoPrincipalId)

  return {
    nombre: texto(data.nombre),
    frase: texto(data.frase),
    dedicacion: texto(data.dedicacion),
    enlaces,
    bienvenida: texto(data.bienvenida),
    respuesta: esTiempoRespuesta(data.respuesta ?? null)
      ? (data.respuesta ?? null)
      : null,
    fotos,
    fotoPrincipalId: fotos.some((f) => f.id === principal) ? principal : null,
    secciones,
  }
}

/**
 * Escucha en vivo el perfil de un profesional. Solo funciona para el propio
 * profesional o un oyente vinculado: las reglas rechazan al resto, y entonces
 * se llama a `onError`.
 */
export function escucharPerfil(
  profesionalUid: string,
  onPerfil: (perfil: PerfilProfesional | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, 'perfilesProfesionales', profesionalUid),
    (snap) =>
      onPerfil(snap.exists() ? perfilDesdeDocumento(snap.data()) : null),
    (error) => onError?.(error),
  )
}

/**
 * Guarda el perfil completo del profesional con sesión. Los enlaces deben
 * llegar ya normalizados (validarPerfil). Al guardar, los oyentes vinculados
 * ven los cambios en vivo.
 */
export async function guardarPerfil(
  profesionalUid: string,
  perfil: PerfilProfesional,
) {
  await setDoc(doc(db, 'perfilesProfesionales', profesionalUid), {
    nombre: perfil.nombre.trim(),
    frase: perfil.frase.trim(),
    dedicacion: perfil.dedicacion.trim(),
    enlaces: perfil.enlaces,
    bienvenida: perfil.bienvenida.trim(),
    respuesta: perfil.respuesta,
    // El encuadre va dentro de cada foto (Firestore no admite campos
    // undefined, así que solo se escribe si lo hay).
    fotos: perfil.fotos.map((f) => ({
      id: f.id,
      alt: f.alt.trim(),
      ...(f.encuadre ? { encuadre: f.encuadre } : {}),
    })),
    fotoPrincipalId: perfil.fotoPrincipalId,
    secciones: perfil.secciones.map((s) => ({
      id: s.id,
      titulo: s.titulo.trim(),
      texto: s.texto,
      fotoIds: s.fotoIds,
      visible: s.visible,
    })),
    actualizadoEn: serverTimestamp(),
  })
}

export type VinculoDelOyente = {
  profesionalUid: string
  /** Cuándo se creó el vínculo (campo opcional `creadoEn`), si lo tiene. */
  creadoEn: Date | null
}

/**
 * Escucha los vínculos activos del oyente. La consulta pide solo los suyos
 * (oyenteUid == su uid) y activos: es lo que permiten las reglas.
 */
export function escucharProfesionalesDelOyente(
  oyenteUid: string,
  onVinculos: (vinculos: VinculoDelOyente[]) => void,
  onError?: (error: Error) => void,
) {
  const vinculos = query(
    collection(db, 'vinculos'),
    where('oyenteUid', '==', oyenteUid),
    where('estado', '==', 'activo'),
  )
  return onSnapshot(
    vinculos,
    (snap) =>
      onVinculos(
        snap.docs
          .map((d) => {
            const data = d.data()
            return {
              profesionalUid: data.profesionalUid,
              creadoEn:
                typeof data.creadoEn?.toDate === 'function'
                  ? (data.creadoEn.toDate() as Date)
                  : null,
            }
          })
          .filter(
            (v): v is VinculoDelOyente => typeof v.profesionalUid === 'string',
          ),
      ),
    (error) => onError?.(error),
  )
}

/** Profesionales por consulta en «todos los profesionales». */
export const PROFESIONALES_POR_PAGINA = 50

export type PaginaProfesionales = {
  profesionales: { uid: string; perfil: PerfilProfesional }[]
  /** Para pedir la siguiente página; null si no hay más. */
  siguiente: QueryDocumentSnapshot | null
}

/**
 * PRUEBA TEMPORAL (modo «todos», ver modoProfesionales.ts): una página de
 * todos los perfiles con nombre, por orden de nombre en Firestore (por bytes:
 * quien la usa reordena con el orden alfabético español). Una sola lectura,
 * no en vivo, para no releer 50 perfiles con cada cambio de cualquiera.
 * Necesita las reglas «modo todos».
 */
export async function obtenerProfesionales(
  desde: QueryDocumentSnapshot | null = null,
): Promise<PaginaProfesionales> {
  const filtros = [
    where('nombre', '>', ''),
    orderBy('nombre'),
    ...(desde ? [startAfter(desde)] : []),
    limit(PROFESIONALES_POR_PAGINA),
  ]
  const snap = await getDocs(
    query(collection(db, 'perfilesProfesionales'), ...filtros),
  )
  return {
    profesionales: snap.docs.map((d) => ({
      uid: d.id,
      perfil: perfilDesdeDocumento(d.data()),
    })),
    siguiente:
      snap.docs.length === PROFESIONALES_POR_PAGINA
        ? snap.docs[snap.docs.length - 1]
        : null,
  }
}

/**
 * ¿Tiene el oyente con sesión un vínculo activo con este profesional? En
 * vivo (si se pausa o se activa, la página cambia sola). Es una consulta y no
 * una lectura del documento para que «no hay vínculo» llegue como `false` y
 * no como un error de permiso.
 */
export function escucharVinculoActivo(
  profesionalUid: string,
  oyenteUid: string,
  onVinculado: (vinculado: boolean) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, 'vinculos'),
      where('profesionalUid', '==', profesionalUid),
      where('oyenteUid', '==', oyenteUid),
      where('estado', '==', 'activo'),
    ),
    (snap) => onVinculado(!snap.empty),
    (error) => onError?.(error),
  )
}

/**
 * Los oyentes del profesional con sesión: sus vínculos (activos y en pausa),
 * en vivo, con nombre, correo y fechas si los tienen; hasta MAX_OYENTES, del
 * más reciente al más antiguo (se ordenan aquí: sin índice nuevo). En «Para
 * una persona» los activos se pueden elegir como destinatario; los pausados
 * sirven para nombrar los audios que ya tenían.
 */
export function escucharMisOyentes(
  profesionalUid: string,
  onOyentes: (oyentes: OyenteDelProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, 'vinculos'),
      where('profesionalUid', '==', profesionalUid),
      limit(MAX_OYENTES),
    ),
    (snap) =>
      onOyentes(
        ordenarOyentes(
          snap.docs.flatMap((d) => {
            const oyente = oyenteDesdeVinculo(
              d.data({ serverTimestamps: 'estimate' }),
            )
            return oyente ? [oyente] : []
          }),
        ),
      ),
    (error) => onError?.(error),
  )
}

/**
 * Pausa o reanuda a un oyente (página «Oyentes»). En pausa deja de ver tus
 * audios al momento; al reanudar vuelve a verlo todo (no se borra nada).
 */
export async function cambiarEstadoVinculo(
  profesionalUid: string,
  oyenteUid: string,
  estado: 'activo' | 'pausado',
) {
  await updateDoc(doc(db, 'vinculos', idVinculo(profesionalUid, oyenteUid)), {
    estado,
    estadoCambiadoEn: serverTimestamp(),
  })
}
