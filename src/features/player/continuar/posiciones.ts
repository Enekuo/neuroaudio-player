/**
 * «Continuar donde lo dejaste» (Ajustes → General → Reproducción).
 *
 * Todo se guarda en ESTE dispositivo (localStorage), nunca en Firestore:
 * - CLAVE_CONTINUAR: si el ajuste está activado ('true' / 'false').
 * - `${PREFIJO_POSICIONES}{uid}`: las posiciones de ese usuario, un objeto
 *   { [audioId]: { t: segundo, d: duración, f: cuándo se guardó (ms) } }.
 *
 * Con el ajuste desactivado no se guarda ni se lee ninguna posición.
 */

export const CLAVE_CONTINUAR = 'neuroaudio:continuar-donde-lo-dejaste'
export const PREFIJO_POSICIONES = 'neuroaudio:posiciones:'

/** Ni en los primeros 30 s ni en los últimos 30 s se pregunta. */
export const MARGEN_SEGUNDOS = 30
/** Como mucho, las 50 posiciones más recientes por usuario. */
export const MAX_POSICIONES = 50
/** Las de más de 30 días se borran. */
export const CADUCIDAD_MS = 30 * 24 * 60 * 60 * 1000

export type Posicion = { t: number; d: number; f: number }
export type Posiciones = Record<string, Posicion>

const esNumero = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v)

/**
 * Si un punto cuenta como «a medias»: pasados los primeros 30 s y con más de
 * 30 s por delante. Sin duración conocida, basta con lo primero.
 */
export function quedaAMedias(t: number, d: number) {
  if (!esNumero(t) || t < MARGEN_SEGUNDOS) return false
  if (!esNumero(d) || d <= 0) return true
  return d - t >= MARGEN_SEGUNDOS
}

/** Quita las caducadas y deja solo las 50 más recientes. */
export function podar(posiciones: Posiciones, ahora: number): Posiciones {
  return Object.fromEntries(
    Object.entries(posiciones)
      .filter(([, p]) => ahora - p.f <= CADUCIDAD_MS)
      .sort(([, a], [, b]) => b.f - a.f)
      .slice(0, MAX_POSICIONES),
  )
}

/**
 * Anota dónde va un audio. Si no está «a medias» (al principio, casi al
 * final o terminado), se quita: la próxima vez empieza desde el principio.
 */
export function anotarPosicion(
  posiciones: Posiciones,
  audioId: string,
  t: number,
  d: number,
  ahora: number,
): Posiciones {
  const siguientes = { ...posiciones }
  if (quedaAMedias(t, d)) {
    siguientes[audioId] = {
      t: Math.floor(t),
      d: esNumero(d) && d > 0 ? Math.floor(d) : 0,
      f: ahora,
    }
  } else {
    delete siguientes[audioId]
  }
  return podar(siguientes, ahora)
}

/** Segundo por el que preguntar al abrir un audio, o null si no hay que preguntar. */
export function posicionParaPreguntar(
  posiciones: Posiciones,
  audioId: string,
  ahora: number,
): number | null {
  const p = posiciones[audioId]
  if (!p || ahora - p.f > CADUCIDAD_MS) return null
  return quedaAMedias(p.t, p.d) ? p.t : null
}

/** Lee lo guardado; lo que esté roto o no tenga la forma esperada, se ignora. */
export function leerPosicionesDeTexto(texto: string | null): Posiciones {
  let datos: unknown
  try {
    datos = texto ? JSON.parse(texto) : {}
  } catch {
    return {}
  }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return {}
  const limpias: Posiciones = {}
  for (const [id, p] of Object.entries(datos as Record<string, unknown>)) {
    const q = p as Partial<Posicion> | null
    if (q && esNumero(q.t) && esNumero(q.d) && esNumero(q.f)) {
      limpias[id] = { t: q.t, d: q.d, f: q.f }
    }
  }
  return limpias
}

/** «mm:ss» (o «h:mm:ss» si pasa de una hora). */
export function minutosYSegundos(segundos: number) {
  const s = Math.max(0, Math.floor(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const dos = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${dos(m)}:${dos(s % 60)}` : `${dos(m)}:${dos(s % 60)}`
}

// ---------- En el dispositivo (con todo protegido: el almacenamiento puede
// no estar disponible en modo privado o con datos bloqueados) ----------

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const almacen = (): Almacen | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Por defecto, desactivado. */
export function continuarActivado(a: Almacen | null = almacen()): boolean {
  try {
    return a?.getItem(CLAVE_CONTINUAR) === 'true'
  } catch {
    return false
  }
}

export function guardarContinuarActivado(
  activado: boolean,
  a: Almacen | null = almacen(),
) {
  try {
    a?.setItem(CLAVE_CONTINUAR, String(activado))
  } catch {
    // Sin almacenamiento: no se recuerda.
  }
}

export function leerPosiciones(
  uid: string,
  a: Almacen | null = almacen(),
): Posiciones {
  try {
    return leerPosicionesDeTexto(a?.getItem(PREFIJO_POSICIONES + uid) ?? null)
  } catch {
    return {}
  }
}

export function guardarPosicion(
  uid: string,
  audioId: string,
  t: number,
  d: number,
  ahora = Date.now(),
  a: Almacen | null = almacen(),
) {
  try {
    const siguientes = anotarPosicion(
      leerPosiciones(uid, a),
      audioId,
      t,
      d,
      ahora,
    )
    if (Object.keys(siguientes).length === 0)
      a?.removeItem(PREFIJO_POSICIONES + uid)
    else a?.setItem(PREFIJO_POSICIONES + uid, JSON.stringify(siguientes))
  } catch {
    // Lleno o bloqueado: esta vez no se guarda.
  }
}

/** Al cerrar sesión: fuera las posiciones de ese usuario. */
export function borrarPosicionesDe(uid: string, a: Almacen | null = almacen()) {
  try {
    a?.removeItem(PREFIJO_POSICIONES + uid)
  } catch {
    // Nada que hacer.
  }
}
