// Procesado de las fotos del perfil EN EL NAVEGADOR, antes de subirlas
// (decisión provisional: más adelante lo hará una Cloud Function).
// - Comprueba el tipo real por los primeros bytes, no por la extensión.
// - Redibuja la imagen en un canvas y la vuelve a codificar: el archivo nuevo
//   no lleva ninguno de los metadatos del original (EXIF, GPS, cámara…).
// - Genera tres versiones: miniatura, normal y cuadrada (la que se usa
//   como foto principal, recortada con el encuadre elegido en «Ajustar
//   foto»; la normal sirve para volver a encuadrar sin subirla otra vez).

import { encuadreInicial, recorteEnPixeles, type Encuadre } from './encuadre'

export const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024
export const FORMATOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'] as const
export type FormatoFoto = (typeof FORMATOS_FOTO)[number]

export const VARIANTES_FOTO = ['miniatura', 'normal', 'cuadrada'] as const
export type VarianteFoto = (typeof VARIANTES_FOTO)[number]

const LADO_MAXIMO: Record<Exclude<VarianteFoto, 'cuadrada'>, number> = {
  miniatura: 400,
  normal: 1600,
}
const LADO_CUADRADA = 512
const CALIDAD = 0.85
/** Por encima de esto (≈ 50 megapíxeles) no se intenta decodificar. */
const PIXELES_MAXIMOS = 50_000_000

export class ErrorFoto extends Error {}

/** Tipo real de una imagen según su firma (los primeros bytes del archivo). */
export function detectarTipoImagen(bytes: Uint8Array): FormatoFoto | null {
  const empiezaPor = (firma: number[], desde = 0) =>
    firma.every((byte, i) => bytes[desde + i] === byte)

  if (empiezaPor([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (empiezaPor([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png'
  }
  // RIFF....WEBP
  if (
    empiezaPor([0x52, 0x49, 0x46, 0x46]) &&
    empiezaPor([0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp'
  }
  return null
}

/** Rechaza lo que no sea JPG, PNG o WebP de verdad, o pase de 5 MB. */
export async function comprobarArchivoFoto(file: File): Promise<FormatoFoto> {
  if (file.size > TAMANO_MAXIMO_FOTO) {
    throw new ErrorFoto('La foto pesa más de 5 MB.')
  }
  const cabecera = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const tipo = detectarTipoImagen(cabecera)
  if (!tipo) {
    throw new ErrorFoto('El archivo no es una imagen JPG, PNG o WebP.')
  }
  return tipo
}

/** Dimensiones para que el lado mayor no pase de `maximo` (nunca agranda). */
export function ajustarTamano(ancho: number, alto: number, maximo: number) {
  const escala = Math.min(1, maximo / Math.max(ancho, alto))
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  }
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, CALIDAD))
}

/** WebP si el navegador sabe codificarlo; si no (algunos Safari), JPEG. */
async function codificar(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await aBlob(canvas, 'image/webp')
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await aBlob(canvas, 'image/jpeg')
  if (!jpeg) throw new ErrorFoto('No se pudo procesar la imagen.')
  return jpeg
}

function dibujar(
  imagen: ImageBitmap,
  origen: { x: number; y: number; ancho: number; alto: number },
  destino: { ancho: number; alto: number },
) {
  const canvas = document.createElement('canvas')
  canvas.width = destino.ancho
  canvas.height = destino.alto
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ErrorFoto('No se pudo procesar la imagen.')
  // Fondo blanco por si hay transparencias y acaba en JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, destino.ancho, destino.alto)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    imagen,
    origen.x,
    origen.y,
    origen.ancho,
    origen.alto,
    0,
    0,
    destino.ancho,
    destino.alto,
  )
  return canvas
}

/**
 * Comprueba la foto y genera sus tres versiones limpias de metadatos. La
 * orientación de la cámara se aplica antes de descartar el EXIF, para que
 * la foto no salga girada.
 */
export async function procesarFoto(
  file: File,
  encuadre?: Encuadre,
): Promise<Record<VarianteFoto, Blob>> {
  await comprobarArchivoFoto(file)

  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ErrorFoto('No se pudo leer la imagen. ¿Está dañada?')
  }

  try {
    const { width: ancho, height: alto } = imagen
    if (ancho * alto > PIXELES_MAXIMOS) {
      throw new ErrorFoto('La foto tiene demasiados píxeles.')
    }
    const entera = { x: 0, y: 0, ancho, alto }

    const [miniatura, normal, cuadrada] = await Promise.all([
      codificar(
        dibujar(
          imagen,
          entera,
          ajustarTamano(ancho, alto, LADO_MAXIMO.miniatura),
        ),
      ),
      codificar(
        dibujar(imagen, entera, ajustarTamano(ancho, alto, LADO_MAXIMO.normal)),
      ),
      codificarCuadrada(imagen, encuadre ?? encuadreInicial(ancho, alto)),
    ])
    return { miniatura, normal, cuadrada }
  } finally {
    imagen.close()
  }
}

/** Recorte cuadrado (512 px como mucho, sin agrandar) según el encuadre. */
function codificarCuadrada(imagen: ImageBitmap, encuadre: Encuadre) {
  const { x, y, lado } = recorteEnPixeles(imagen.width, imagen.height, encuadre)
  const salida = Math.max(1, Math.round(Math.min(LADO_CUADRADA, lado)))
  return codificar(
    dibujar(
      imagen,
      { x, y, ancho: lado, alto: lado },
      { ancho: salida, alto: salida },
    ),
  )
}

/**
 * Vuelve a generar la versión cuadrada a partir de la versión «normal» ya
 * guardada (limpia de metadatos), con un encuadre nuevo. Así se cambia el
 * encuadre de la foto principal sin tener que subirla otra vez.
 */
export async function generarCuadrada(normal: Blob, encuadre: Encuadre) {
  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(normal)
  } catch {
    throw new ErrorFoto('No se pudo leer la foto. Inténtalo de nuevo.')
  }
  try {
    return await codificarCuadrada(imagen, encuadre)
  } finally {
    imagen.close()
  }
}
