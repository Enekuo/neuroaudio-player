import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../../lib/firebase'
import type { FotoPerfil } from '../modelo'
import type { Encuadre } from './encuadre'
import {
  ErrorFoto,
  VARIANTES_FOTO,
  generarCuadrada,
  procesarFoto,
  type VarianteFoto,
} from './procesarFoto'

/**
 * Fotos nuevas por minuto que puede subir un profesional. Lo hacen cumplir
 * las reglas (firestore.rules → limitesSubida, storage.rules); si lo
 * cambias aquí, cámbialo allí.
 */
export const SUBIDAS_POR_MINUTO = 10
const VENTANA_MS = 60_000

/** Ruta privada de una versión de una foto del perfil en Storage. */
export function rutaFoto(uid: string, fotoId: string, variante: VarianteFoto) {
  return `perfiles/${uid}/fotos/${fotoId}/${variante}`
}

/**
 * Reserva el permiso para subir UNA foto nueva. Es una escritura en
 * `limitesSubida/{uid}` que las reglas solo aceptan si no se ha pasado el
 * límite del minuto; Storage solo admite archivos de la foto reservada.
 * Así el límite lo comprueba el servidor, no solo esta pantalla.
 */
async function reservarSubida(uid: string, fotoId: string) {
  const limite = doc(db, 'limitesSubida', uid)
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(limite)
      const datos = snap.data()
      const inicio = datos?.ventanaInicio?.toMillis?.() as number | undefined
      const dentroDeVentana =
        inicio !== undefined && Date.now() < inicio + VENTANA_MS

      if (snap.exists() && dentroDeVentana) {
        if ((datos?.cuenta ?? 0) >= SUBIDAS_POR_MINUTO) {
          throw new ErrorFoto(
            'Has subido muchas fotos seguidas. Espera un minuto y vuelve a intentarlo.',
          )
        }
        tx.update(limite, {
          cuenta: (datos?.cuenta ?? 0) + 1,
          reservada: fotoId,
          reservadaEn: serverTimestamp(),
        })
      } else {
        tx.set(limite, {
          ventanaInicio: serverTimestamp(),
          cuenta: 1,
          reservada: fotoId,
          reservadaEn: serverTimestamp(),
        })
      }
    })
  } catch (error) {
    if (error instanceof ErrorFoto) throw error
    // Las reglas lo rechazan si el reloj del dispositivo y el del servidor
    // no coinciden con el límite; para la persona es lo mismo.
    throw new ErrorFoto(
      'No se pudo subir la foto ahora. Espera un minuto y vuelve a intentarlo.',
    )
  }
}

function nuevoIdFoto() {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Comprueba, limpia y sube una foto con sus tres versiones. Devuelve la
 * foto para añadirla al perfil (que se guarda aparte, con «Guardar cambios»).
 */
export async function subirFoto(
  uid: string,
  file: File,
  encuadre?: Encuadre,
): Promise<FotoPerfil> {
  const versiones = await procesarFoto(file, encuadre)
  const fotoId = nuevoIdFoto()
  await reservarSubida(uid, fotoId)
  await subirVersiones(uid, fotoId, versiones)
  return { id: fotoId, alt: '', ...(encuadre ? { encuadre } : {}) }
}

/**
 * Cambia el encuadre de una foto ya subida, sin pedir el archivo otra vez:
 * regenera la versión cuadrada a partir de la «normal» guardada. Devuelve la
 * foto con un id NUEVO (copiando tal cual la normal y la miniatura): las
 * reglas solo admiten subidas de una foto recién reservada, y no dejan
 * reservar dos veces seguidas la misma. La foto antigua se borra al guardar
 * el perfil, como cualquier foto quitada.
 */
export async function reencuadrarFoto(
  uid: string,
  foto: FotoPerfil,
  encuadre: Encuadre,
): Promise<FotoPerfil> {
  let normal: Blob
  let miniatura: Blob
  try {
    ;[normal, miniatura] = await Promise.all([
      getBlob(ref(storage, rutaFoto(uid, foto.id, 'normal'))),
      getBlob(ref(storage, rutaFoto(uid, foto.id, 'miniatura'))),
    ])
  } catch {
    throw new ErrorFoto('No se pudo leer la foto. Inténtalo de nuevo.')
  }
  const cuadrada = await generarCuadrada(normal, encuadre)
  const fotoId = nuevoIdFoto()
  await reservarSubida(uid, fotoId)
  await subirVersiones(uid, fotoId, { normal, miniatura, cuadrada })
  return { id: fotoId, alt: foto.alt, encuadre }
}

async function subirVersiones(
  uid: string,
  fotoId: string,
  versiones: Record<VarianteFoto, Blob>,
) {
  await Promise.all(
    VARIANTES_FOTO.map((variante) =>
      uploadBytes(
        ref(storage, rutaFoto(uid, fotoId, variante)),
        versiones[variante],
        {
          // Las reglas solo admiten WebP o JPEG (es lo que genera el procesado).
          contentType: versiones[variante].type || 'image/webp',
          cacheControl: 'private, max-age=3600',
        },
      ),
    ),
  )
}

/** Borra los archivos de una foto. Si alguno ya no existe, no es un error. */
export async function borrarFoto(uid: string, fotoId: string) {
  await Promise.all(
    VARIANTES_FOTO.map(async (variante) => {
      const ruta = rutaFoto(uid, fotoId, variante)
      olvidarFoto(ruta)
      try {
        await deleteObject(ref(storage, ruta))
      } catch (error) {
        if ((error as { code?: string }).code !== 'storage/object-not-found') {
          throw error
        }
      }
    }),
  )
}

// ---------- Lectura privada ----------
// Nunca se usa getDownloadURL (daría un enlace público permanente). La foto
// se descarga con getBlob, que pasa por las reglas de Storage en cada
// petición, y se muestra con una URL local (blob:) que solo existe en esta
// pestaña. Se guarda en memoria para no descargarla en cada render.

const cache = new Map<string, Promise<string>>()

function olvidarFoto(ruta: string) {
  const enCache = cache.get(ruta)
  cache.delete(ruta)
  enCache?.then((url) => URL.revokeObjectURL(url)).catch(() => {})
}

/** URL local (blob:) de una versión de la foto, si quien la pide tiene permiso. */
export function urlFoto(uid: string, fotoId: string, variante: VarianteFoto) {
  const ruta = rutaFoto(uid, fotoId, variante)
  let url = cache.get(ruta)
  if (!url) {
    url = getBlob(ref(storage, ruta)).then((blob) => URL.createObjectURL(blob))
    // Si falla (sin permiso, borrada…), que el próximo intento lo reintente.
    url.catch(() => cache.delete(ruta))
    cache.set(ruta, url)
  }
  return url
}
