import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../../../lib/firebase'
import { crearCacheBlobs } from './cacheBlobs'
import type { Encuadre } from './encuadre'
import { MARGEN_LIBERAR_FOTO_MS, reservarSubida } from './fotoService'
import { procesarCuadrada } from './procesarFoto'

// Imágenes cuadradas privadas del profesional fuera de su perfil: la imagen
// propia de una lista y la portada de un audio. Mismo procesado que la foto
// de perfil (tipo real comprobado, sin metadatos, 512 px), el mismo contador
// de subidas por minuto (limitesSubida) y lectura privada con getBlob.

/**
 * Comprueba, recorta (cuadrada, 512 px como mucho) y sube una imagen. `ruta`
 * da la ruta de Storage a partir del id nuevo de la imagen. Devuelve ese id
 * y la imagen ya recortada, para enseñarla sin volver a descargarla.
 */
export async function subirImagenCuadrada(
  profesionalUid: string,
  ruta: (imagenId: string) => string,
  file: File,
  encuadre?: Encuadre,
) {
  const cuadrada = await procesarCuadrada(file, encuadre)
  const imagenId = crypto.randomUUID().replace(/-/g, '')
  await reservarSubida(profesionalUid, imagenId)
  await uploadBytes(ref(storage, ruta(imagenId)), cuadrada, {
    contentType: cuadrada.type || 'image/webp',
    cacheControl: 'private, max-age=3600',
  })
  return { imagenId, imagen: cuadrada }
}

/** Borra una imagen. Si ya no existe, no es un error. */
export async function borrarImagenPrivada(ruta: string) {
  cache.olvidar(ruta)
  try {
    await deleteObject(ref(storage, ruta))
  } catch (error) {
    if ((error as { code?: string }).code !== 'storage/object-not-found') {
      throw error
    }
  }
}

// Lectura privada, como las fotos del perfil: getBlob (pasa por las reglas
// en cada descarga) y una URL blob: local, compartida entre pantallas.
const cache = crearCacheBlobs(
  (ruta) => getBlob(ref(storage, ruta)),
  MARGEN_LIBERAR_FOTO_MS,
)

/** URL local (blob:) de la imagen. Hay que soltarla al dejar de usarla. */
export function adquirirImagenPrivada(ruta: string) {
  return cache.adquirir(ruta)
}

export function soltarImagenPrivada(ruta: string) {
  cache.soltar(ruta)
}
