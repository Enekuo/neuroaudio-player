// Convierte la foto elegida por el usuario en la portada de una lista: un
// cuadrado recortado al centro, de 512px (nítido hasta en pantallas 3x a los
// 172px a los que se muestra) y comprimido a JPEG. El resultado es un data URL
// pequeño (~40-90 KB) que se guarda directamente en el documento de la lista,
// sin necesidad de Firebase Storage ni de reglas nuevas.

const COVER_SIZE = 512
const JPEG_QUALITY = 0.82

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    image.src = url
  })
}

export async function crearPortadaLista(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen')
  }

  const image = await loadImage(file)
  const side = Math.min(image.naturalWidth, image.naturalHeight)
  const sx = (image.naturalWidth - side) / 2
  const sy = (image.naturalHeight - side) / 2
  const size = Math.min(COVER_SIZE, side)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo procesar la imagen')
  }

  // Fondo negro por si la imagen tiene transparencias (JPEG no las admite).
  context.fillStyle = '#000000'
  context.fillRect(0, 0, size, size)
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, sx, sy, side, side, 0, 0, size, size)

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
