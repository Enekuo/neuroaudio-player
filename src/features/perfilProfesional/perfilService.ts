import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import {
  REDES,
  perfilVacio,
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

/**
 * Escucha los profesionales con los que el oyente tiene un vínculo activo y
 * devuelve sus uid.
 */
export function escucharProfesionalesDelOyente(
  oyenteUid: string,
  onProfesionales: (profesionalUids: string[]) => void,
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
      onProfesionales(
        snap.docs
          .map((d) => d.data().profesionalUid)
          .filter((uid): uid is string => typeof uid === 'string'),
      ),
    (error) => onError?.(error),
  )
}
