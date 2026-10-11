// Encuadre de la foto principal: qué cuadrado de la imagen se ve dentro del
// círculo del perfil. Se guarda en fracciones de la imagen (no en píxeles),
// así vale igual para la foto original que para su versión «normal» reducida.

/**
 * - `cx`, `cy`: centro del recorte, en fracción del ancho y del alto (0–1).
 * - `zoom`: 1 = el recorte es el lado corto entero (lo mínimo para llenar
 *   el círculo); 2 = la mitad de ese lado; etc.
 */
export type Encuadre = { cx: number; cy: number; zoom: number }

export const ZOOM_MINIMO = 1
export const ZOOM_MAXIMO = 4

const limitar = (valor: number, min: number, max: number) =>
  Math.min(max, Math.max(min, valor))

/** Lado del recorte en píxeles de la imagen. */
export function ladoRecorte(ancho: number, alto: number, zoom: number) {
  return Math.min(ancho, alto) / limitar(zoom, ZOOM_MINIMO, ZOOM_MAXIMO)
}

/**
 * Corrige un encuadre para que el recorte quede siempre dentro de la imagen
 * (nunca hay espacio vacío en el círculo) y el zoom dentro de sus límites.
 */
export function limitarEncuadre(
  ancho: number,
  alto: number,
  encuadre: Encuadre,
): Encuadre {
  const zoom = limitar(
    Number.isFinite(encuadre.zoom) ? encuadre.zoom : ZOOM_MINIMO,
    ZOOM_MINIMO,
    ZOOM_MAXIMO,
  )
  const mitad = ladoRecorte(ancho, alto, zoom) / 2
  const cxPx = limitar(
    (Number.isFinite(encuadre.cx) ? encuadre.cx : 0.5) * ancho,
    mitad,
    ancho - mitad,
  )
  const cyPx = limitar(
    (Number.isFinite(encuadre.cy) ? encuadre.cy : 0.5) * alto,
    mitad,
    alto - mitad,
  )
  return { cx: cxPx / ancho, cy: cyPx / alto, zoom }
}

/**
 * Encuadre de partida: el más amplio posible, centrado en horizontal y
 * hacia la parte de arriba en las fotos verticales (donde suele estar la
 * cara): el recorte se coloca a un 20 % del espacio que sobra por arriba.
 */
export function encuadreInicial(ancho: number, alto: number): Encuadre {
  const lado = ladoRecorte(ancho, alto, ZOOM_MINIMO)
  const cyPx = lado / 2 + (alto - lado) * 0.2
  return limitarEncuadre(ancho, alto, {
    cx: 0.5,
    cy: cyPx / alto,
    zoom: ZOOM_MINIMO,
  })
}

/** Recorte en píxeles de la imagen: esquina superior izquierda y lado. */
export function recorteEnPixeles(
  ancho: number,
  alto: number,
  encuadre: Encuadre,
) {
  const e = limitarEncuadre(ancho, alto, encuadre)
  const lado = ladoRecorte(ancho, alto, e.zoom)
  return {
    x: e.cx * ancho - lado / 2,
    y: e.cy * alto - lado / 2,
    lado,
  }
}

/** Desplaza el recorte `dx`, `dy` píxeles de la imagen (sin salirse). */
export function moverEncuadre(
  ancho: number,
  alto: number,
  encuadre: Encuadre,
  dx: number,
  dy: number,
): Encuadre {
  return limitarEncuadre(ancho, alto, {
    ...encuadre,
    cx: encuadre.cx + dx / ancho,
    cy: encuadre.cy + dy / alto,
  })
}

/** Cambia el zoom manteniendo el mismo centro (y corrigiendo si se sale). */
export function zoomEncuadre(
  ancho: number,
  alto: number,
  encuadre: Encuadre,
  zoom: number,
): Encuadre {
  return limitarEncuadre(ancho, alto, { ...encuadre, zoom })
}

/** ¿Es un encuadre con forma válida (p. ej. leído de Firestore)? */
export function esEncuadre(valor: unknown): valor is Encuadre {
  if (!valor || typeof valor !== 'object') return false
  const { cx, cy, zoom } = valor as Record<string, unknown>
  return (
    typeof cx === 'number' &&
    typeof cy === 'number' &&
    typeof zoom === 'number' &&
    [cx, cy, zoom].every(Number.isFinite) &&
    cx >= 0 &&
    cx <= 1 &&
    cy >= 0 &&
    cy <= 1 &&
    zoom >= ZOOM_MINIMO &&
    zoom <= ZOOM_MAXIMO
  )
}
