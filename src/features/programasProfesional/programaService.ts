import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { idVinculo } from '../perfilProfesional/modelo'
import type { CambiosDeAccesos } from './accesos'
import {
  completadosAlMarcar,
  idAccesoPrograma,
  idProgresoPrograma,
  type AccesoPrograma,
  type AperturaPrograma,
  type ParaPrograma,
  type ProgramaProfesional,
  type RitmoPrograma,
} from './modelo'

const PROGRAMAS = 'programasProfesional'
const ACCESOS = 'accesosPrograma'
const PROGRESO = 'progresoPrograma'
/** Escrituras por tanda (Firestore admite 500 por escritura). */
const POR_TANDA = 450

const texto = (v: unknown) => (typeof v === 'string' ? v : '')
const fecha = (v: unknown) =>
  v && typeof (v as { toDate?: unknown }).toDate === 'function'
    ? (v as { toDate: () => Date }).toDate()
    : null

function programaDesdeDocumento(
  id: string,
  d: DocumentData,
): ProgramaProfesional {
  return {
    id,
    profesionalUid: texto(d.profesionalUid),
    titulo: texto(d.titulo),
    descripcion: texto(d.descripcion),
    estado: d.estado === 'publicado' ? 'publicado' : 'borrador',
    apertura:
      d.apertura === 'libre' || d.apertura === 'calendario'
        ? d.apertura
        : 'orden',
    ritmo:
      d.ritmo === 'semanal' || d.ritmo === 'mensual' || d.ritmo === 'dias'
        ? d.ritmo
        : 'diario',
    ritmoDias: typeof d.ritmoDias === 'number' ? d.ritmoDias : null,
    para: d.para === 'todos' ? 'todos' : 'personas',
    pasos: Array.isArray(d.pasos)
      ? d.pasos.filter((p: unknown): p is string => typeof p === 'string')
      : [],
    publicadoEn: fecha(d.publicadoEn),
    creadoEn: fecha(d.creadoEn),
    actualizadoEn: fecha(d.actualizadoEn),
  }
}

function accesoDesdeDocumento(id: string, d: DocumentData): AccesoPrograma {
  return {
    id,
    profesionalUid: texto(d.profesionalUid),
    programaId: texto(d.programaId),
    oyenteUid: texto(d.oyenteUid),
    creadoEn: fecha(d.creadoEn),
  }
}

const porCreacion = (a: ProgramaProfesional, b: ProgramaProfesional) =>
  (b.creadoEn?.getTime() ?? 0) - (a.creadoEn?.getTime() ?? 0)

// ---------- Panel del profesional ----------

/** Sus programas (borradores y publicados), del más reciente al más antiguo. */
export function escucharMisProgramas(
  profesionalUid: string,
  onProgramas: (programas: ProgramaProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, PROGRAMAS),
      where('profesionalUid', '==', profesionalUid),
    ),
    (snap) =>
      onProgramas(
        snap.docs
          .map((d) =>
            programaDesdeDocumento(
              d.id,
              d.data({ serverTimestamps: 'estimate' }),
            ),
          )
          .sort(porCreacion),
      ),
    (error) => onError?.(error),
  )
}

/** Las personas de todos sus programas privados. */
export function escucharAccesosDeMisProgramas(
  profesionalUid: string,
  onAccesos: (accesos: AccesoPrograma[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, ACCESOS),
      where('profesionalUid', '==', profesionalUid),
    ),
    (snap) =>
      onAccesos(
        snap.docs.map((d) =>
          accesoDesdeDocumento(d.id, d.data({ serverTimestamps: 'estimate' })),
        ),
      ),
    (error) => onError?.(error),
  )
}

export type DatosPrograma = {
  titulo: string
  descripcion: string
  apertura: AperturaPrograma
  ritmo: RitmoPrograma
  ritmoDias: number | null
  pasos: string[]
}

const limpiar = (datos: DatosPrograma) => ({
  titulo: datos.titulo.trim(),
  descripcion: datos.descripcion.trim(),
  apertura: datos.apertura,
  ritmo: datos.ritmo,
  ritmoDias: datos.ritmo === 'dias' ? datos.ritmoDias : null,
  pasos: datos.pasos,
})

/** Crea un programa en borrador. «Para quién» no se cambia después. */
export async function crearPrograma(
  profesionalUid: string,
  datos: DatosPrograma,
  para: ParaPrograma,
) {
  const ref = doc(collection(db, PROGRAMAS))
  await setDoc(ref, {
    profesionalUid,
    ...limpiar(datos),
    estado: 'borrador',
    para,
    publicadoEn: null,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  })
  return ref.id
}

/** Edita nombre, descripción, apertura, ritmo y pasos (añadir, quitar, reordenar). */
export async function actualizarPrograma(
  programaId: string,
  datos: DatosPrograma,
) {
  await updateDoc(doc(db, PROGRAMAS, programaId), {
    ...limpiar(datos),
    actualizadoEn: serverTimestamp(),
  })
}

/**
 * Publica o pasa a borrador. La primera vez que se publica guarda la fecha
 * (el día 1 de un programa para todos), que ya no cambia.
 */
export async function cambiarEstadoPrograma(
  programa: Pick<ProgramaProfesional, 'id' | 'publicadoEn'>,
  estado: 'borrador' | 'publicado',
) {
  await updateDoc(doc(db, PROGRAMAS, programa.id), {
    estado,
    ...(estado === 'publicado' && !programa.publicadoEn
      ? { publicadoEn: serverTimestamp() }
      : {}),
    actualizadoEn: serverTimestamp(),
  })
}

/** Borra un programa y a todas sus personas, en una sola escritura. */
export async function borrarPrograma(
  programaId: string,
  accesos: Pick<AccesoPrograma, 'id'>[],
) {
  const lote = writeBatch(db)
  lote.delete(doc(db, PROGRAMAS, programaId))
  accesos.forEach((a) => lote.delete(doc(db, ACCESOS, a.id)))
  await lote.commit()
}

/**
 * Da un programa privado a varias personas (con vínculo activo: lo exigen
 * las reglas), una escritura por persona para que una que falle no tumbe a
 * las demás. Si está publicado, en la misma escritura se le añaden sus
 * audios a la lista de su vínculo. Devuelve a quién no se pudo dar.
 */
export async function darPrograma(
  programa: Pick<
    ProgramaProfesional,
    'id' | 'profesionalUid' | 'estado' | 'pasos'
  >,
  oyenteUids: string[],
) {
  const resultados = await Promise.allSettled(
    oyenteUids.map((oyenteUid) => {
      const lote = writeBatch(db)
      lote.set(doc(db, ACCESOS, idAccesoPrograma(programa.id, oyenteUid)), {
        profesionalUid: programa.profesionalUid,
        programaId: programa.id,
        oyenteUid,
        creadoEn: serverTimestamp(),
      })
      if (programa.estado === 'publicado' && programa.pasos.length > 0) {
        lote.update(
          doc(db, 'vinculos', idVinculo(programa.profesionalUid, oyenteUid)),
          { audiosBiblioteca: arrayUnion(...programa.pasos) },
        )
      }
      return lote.commit()
    }),
  )
  return oyenteUids.filter((_, i) => resultados[i].status === 'rejected')
}

/**
 * Quita un programa privado a una persona: deja de verlo al momento. Sus
 * audios se le quitan de la lista del vínculo al recalcular los accesos
 * (los puede seguir teniendo por otro programa o un envío). Conserva su
 * progreso por si se le vuelve a dar.
 */
export async function quitarPrograma(programaId: string, oyenteUid: string) {
  await deleteDoc(doc(db, ACCESOS, idAccesoPrograma(programaId, oyenteUid)))
}

/**
 * Escribe lo que no cuadra de los accesos (ver accesos.ts): la lista de
 * audios de cada vínculo y las marcas de cada audio de la Biblioteca. Por
 * tandas, por si fueran muchas.
 */
export async function aplicarCambiosDeAccesos(
  profesionalUid: string,
  cambios: CambiosDeAccesos,
) {
  const escrituras: ((lote: ReturnType<typeof writeBatch>) => void)[] = [
    ...cambios.vinculos.map(
      (v) => (lote: ReturnType<typeof writeBatch>) =>
        lote.update(
          doc(db, 'vinculos', idVinculo(profesionalUid, v.oyenteUid)),
          {
            audiosBiblioteca: v.audiosBiblioteca,
          },
        ),
    ),
    ...cambios.audios.map(
      (a) => (lote: ReturnType<typeof writeBatch>) =>
        lote.update(doc(db, 'audiosProfesional', a.audioId), {
          publicoEnAudios: a.publicoEnAudios,
          enProgramaPublico: a.enProgramaPublico,
          actualizadoEn: serverTimestamp(),
        }),
    ),
  ]
  for (let i = 0; i < escrituras.length; i += POR_TANDA) {
    const lote = writeBatch(db)
    escrituras.slice(i, i + POR_TANDA).forEach((escribir) => escribir(lote))
    await lote.commit()
  }
}

/**
 * Quita un audio (que se va a borrar de Biblioteca) de los programas que lo
 * tienen, en una sola escritura. Uno publicado que se queda sin pasos pasa
 * a borrador (publicado tiene que tener alguno).
 */
export async function quitarAudioDeProgramas(
  programas: ProgramaProfesional[],
  audioId: string,
) {
  const afectados = programas.filter((p) => p.pasos.includes(audioId))
  if (afectados.length === 0) return
  const lote = writeBatch(db)
  afectados.forEach((p) => {
    const pasos = p.pasos.filter((id) => id !== audioId)
    lote.update(doc(db, PROGRAMAS, p.id), {
      pasos,
      ...(pasos.length === 0 && p.estado === 'publicado'
        ? { estado: 'borrador' }
        : {}),
      actualizadoEn: serverTimestamp(),
    })
  })
  await lote.commit()
}

// ---------- App del oyente ----------

/** Los programas para todos publicados de un profesional. */
export function escucharProgramasParaTodos(
  profesionalUid: string,
  onProgramas: (programas: ProgramaProfesional[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, PROGRAMAS),
      where('profesionalUid', '==', profesionalUid),
      where('estado', '==', 'publicado'),
      where('para', '==', 'todos'),
    ),
    (snap) =>
      onProgramas(
        snap.docs
          .map((d) => programaDesdeDocumento(d.id, d.data()))
          .sort(porCreacion),
      ),
    (error) => onError?.(error),
  )
}

/** Los programas privados de un profesional que tiene este oyente. */
export function escucharMisAccesosPrograma(
  profesionalUid: string,
  oyenteUid: string,
  onAccesos: (accesos: AccesoPrograma[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, ACCESOS),
      where('profesionalUid', '==', profesionalUid),
      where('oyenteUid', '==', oyenteUid),
    ),
    (snap) =>
      onAccesos(snap.docs.map((d) => accesoDesdeDocumento(d.id, d.data()))),
    (error) => onError?.(error),
  )
}

/** Un programa, en vivo (null si no existe o no se puede leer). */
export function escucharPrograma(
  programaId: string,
  onPrograma: (programa: ProgramaProfesional | null) => void,
) {
  return onSnapshot(
    doc(db, PROGRAMAS, programaId),
    (snap) =>
      onPrograma(
        snap.exists() ? programaDesdeDocumento(snap.id, snap.data()) : null,
      ),
    () => onPrograma(null),
  )
}

/** Los pasos completados por este oyente (vacío si aún no ha empezado). */
export function escucharProgreso(
  programaId: string,
  oyenteUid: string,
  onCompletados: (completados: string[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, PROGRESO, idProgresoPrograma(programaId, oyenteUid)),
    (snap) => {
      const completados = snap.data()?.completados
      onCompletados(
        Array.isArray(completados)
          ? completados.filter(
              (c: unknown): c is string => typeof c === 'string',
            )
          : [],
      )
    },
    (error) => onError?.(error),
  )
}

/**
 * Marca o desmarca un paso como completado (ver completadosAlMarcar: al
 * desmarcar, lo que abrió sigue abierto). Marcar dos veces no repite nada.
 * Crea el progreso la primera vez.
 */
export async function marcarPaso(
  programa: Pick<ProgramaProfesional, 'id' | 'profesionalUid'>,
  oyenteUid: string,
  audioId: string,
  completado: boolean,
  /** Lo que tiene ahora (el progreso que se está escuchando). */
  actuales: readonly string[],
) {
  await setDoc(
    doc(db, PROGRESO, idProgresoPrograma(programa.id, oyenteUid)),
    {
      oyenteUid,
      programaId: programa.id,
      profesionalUid: programa.profesionalUid,
      completados: completadosAlMarcar(actuales, audioId, completado),
      actualizadoEn: serverTimestamp(),
    },
    { merge: true },
  )
}
