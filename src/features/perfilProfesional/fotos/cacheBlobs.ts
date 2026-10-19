// Caché de enlaces locales (blob:) con contador de uso. La usan las fotos del
// perfil: cada pantalla que muestra una foto la «adquiere» y la «suelta» al
// salir. La misma ruta se descarga una sola vez aunque la usen varias
// pantallas, y su enlace se libera cuando ninguna la usa, tras un margen
// (para no volver a descargarla al ir y volver entre pantallas).

type Entrada = {
  url: Promise<string>
  usos: number
  temporizador?: ReturnType<typeof setTimeout>
}

export function crearCacheBlobs(
  cargar: (ruta: string) => Promise<Blob>,
  margenMs: number,
) {
  const entradas = new Map<string, Entrada>()

  const liberar = (ruta: string, entrada: Entrada) => {
    if (entradas.get(ruta) === entrada) entradas.delete(ruta)
    if (entrada.temporizador) clearTimeout(entrada.temporizador)
    entrada.url.then((url) => URL.revokeObjectURL(url)).catch(() => {})
  }

  return {
    /** URL local de la ruta. Llamar a `soltar(ruta)` al dejar de usarla. */
    adquirir(ruta: string) {
      let entrada = entradas.get(ruta)
      if (!entrada) {
        const nueva: Entrada = {
          url: cargar(ruta).then((blob) => URL.createObjectURL(blob)),
          usos: 0,
        }
        // Si falla (sin permiso, borrada…), que el próximo intento lo reintente.
        nueva.url.catch(() => {
          if (entradas.get(ruta) === nueva) entradas.delete(ruta)
        })
        entradas.set(ruta, nueva)
        entrada = nueva
      }
      if (entrada.temporizador) {
        clearTimeout(entrada.temporizador)
        entrada.temporizador = undefined
      }
      entrada.usos += 1
      return entrada.url
    },

    /** Deja de usarla; si nadie más la usa, se libera tras el margen. */
    soltar(ruta: string) {
      const entrada = entradas.get(ruta)
      if (!entrada) return
      entrada.usos = Math.max(0, entrada.usos - 1)
      if (entrada.usos > 0 || entrada.temporizador) return
      entrada.temporizador = setTimeout(() => {
        entrada.temporizador = undefined
        if (entrada.usos === 0) liberar(ruta, entrada)
      }, margenMs)
    },

    /** El archivo se ha borrado: fuera de memoria ya. */
    olvidar(ruta: string) {
      const entrada = entradas.get(ruta)
      if (entrada) liberar(ruta, entrada)
    },

    /** Rutas en memoria ahora mismo (para pruebas). */
    tamano: () => entradas.size,
  }
}
