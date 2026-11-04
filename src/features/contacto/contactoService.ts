import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { MensajeContacto } from './validacion'

/** Si Firestore no confirma en este tiempo, se avisa del error. */
const ESPERA_MAXIMA_MS = 15000

/**
 * Guarda un mensaje del formulario de contacto en `mensajesContacto`
 * (Firestore, en la UE). Lo puede crear cualquiera, también sin sesión;
 * nadie lo lee desde la app: se leen en la consola de Firebase.
 */
export async function enviarMensajeContacto(mensaje: MensajeContacto) {
  const escritura = addDoc(collection(db, 'mensajesContacto'), {
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
