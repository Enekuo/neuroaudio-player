import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import {
  BORRADORES_VACIOS,
  leerBorradores,
  type BorradoresSoporte,
  type MensajeSoporte,
} from './modelo'

/** Si Firestore no confirma en este tiempo, se avisa del error. */
const ESPERA_MAXIMA_MS = 15000

/**
 * Guarda un mensaje de Soporte en `mensajesSoporte`. Solo se puede crear
 * (con sesión, con el uid y el correo de la cuenta); nadie lo lee desde la
 * app.
 */
export async function enviarMensajeSoporte(mensaje: MensajeSoporte) {
  const escritura = addDoc(collection(db, 'mensajesSoporte'), {
    ...mensaje,
    creadoEn: serverTimestamp(),
  })
  let reloj: ReturnType<typeof setTimeout> | undefined
  const tiempoAgotado = new Promise<never>((_, rechazar) => {
    reloj = setTimeout(
      () => rechazar(new Error('Tiempo de espera agotado')),
      ESPERA_MAXIMA_MS,
    )
  })
  try {
    await Promise.race([escritura, tiempoAgotado])
  } finally {
    clearTimeout(reloj)
  }
}

// Lo escrito a medias sigue ahí al volver a abrir el panel (y al recargar),
// mientras dure la sesión del navegador.
const CLAVE_BORRADORES = 'na-soporte-borradores'
// Copia en memoria: si el navegador bloquea el almacenamiento, el borrador
// sigue al cerrar y volver a abrir el panel (hasta recargar).
let enMemoria: BorradoresSoporte | null = null

export function cargarBorradores(): BorradoresSoporte {
  try {
    return leerBorradores(window.sessionStorage.getItem(CLAVE_BORRADORES))
  } catch {
    return enMemoria ?? BORRADORES_VACIOS
  }
}

export function guardarBorradores(borradores: BorradoresSoporte) {
  enMemoria = borradores
  try {
    window.sessionStorage.setItem(CLAVE_BORRADORES, JSON.stringify(borradores))
  } catch {
    // Sin almacenamiento: el borrador vale mientras el panel siga abierto.
  }
}
