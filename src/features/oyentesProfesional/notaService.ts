import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { MAX_NOTA_PRIVADA } from '../perfilProfesional/modelo'

/**
 * Nota privada del profesional sobre un oyente:
 * `notasPrivadas/{profesionalUid}/oyentes/{oyenteUid}` → `{ texto,
 * actualizadoEn }`. Va aparte del vínculo (que también lee el oyente): las
 * reglas solo dejan leerla y escribirla al profesional, y solo sobre alguien
 * con quien tiene vínculo.
 */
export type NotaPrivada = { texto: string; actualizadoEn: Date | null }

const rutaNota = (profesionalUid: string, oyenteUid: string) =>
  doc(db, 'notasPrivadas', profesionalUid, 'oyentes', oyenteUid)

/** Texto que se guarda: sin espacios sobrantes y como mucho MAX_NOTA_PRIVADA. */
export const limpiarNota = (texto: string) =>
  texto.trim().slice(0, MAX_NOTA_PRIVADA)

/** La nota en vivo (null si aún no hay). */
export function escucharNotaPrivada(
  profesionalUid: string,
  oyenteUid: string,
  onNota: (nota: NotaPrivada | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    rutaNota(profesionalUid, oyenteUid),
    (snap) => {
      const datos = snap.data({ serverTimestamps: 'estimate' })
      onNota(
        snap.exists() && datos
          ? {
              texto: typeof datos.texto === 'string' ? datos.texto : '',
              actualizadoEn:
                typeof datos.actualizadoEn?.toDate === 'function'
                  ? (datos.actualizadoEn.toDate() as Date)
                  : null,
            }
          : null,
      )
    },
    (error) => onError?.(error),
  )
}

/** Guarda la nota; si queda vacía, la borra. */
export async function guardarNotaPrivada(
  profesionalUid: string,
  oyenteUid: string,
  texto: string,
) {
  const limpio = limpiarNota(texto)
  const ruta = rutaNota(profesionalUid, oyenteUid)
  if (!limpio) {
    await deleteDoc(ruta)
    return
  }
  await setDoc(ruta, { texto: limpio, actualizadoEn: serverTimestamp() })
}
