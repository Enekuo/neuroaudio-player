/**
 * Mensajes del panel de Soporte (colección `mensajesSoporte`): un problema o
 * un comentario del profesional. Los límites y valores coinciden con la
 * propuesta de reglas (reglas/propuestas, match /mensajesSoporte): si cambias
 * uno, cambia el otro.
 */

export const LIMITES_SOPORTE = {
  textoMin: 10,
  textoMax: 2000,
  nombre: 100,
  ruta: 200,
  navegador: 200,
} as const

export type TipoMensajeSoporte = 'problema' | 'comentario'

export const SUBTIPOS_COMENTARIO = [
  { valor: 'sugerencia', etiqueta: 'Una sugerencia' },
  { valor: 'me_gusta', etiqueta: 'Algo que me gusta' },
  { valor: 'no_me_gusta', etiqueta: 'Algo que no me gusta' },
] as const

export type SubtipoComentario = (typeof SUBTIPOS_COMENTARIO)[number]['valor']

/** «Otra o no lo sé» en «¿En qué página ocurre?». */
export const PAGINA_OTRA = 'otra'

/** El texto vale: al menos 10 caracteres sin contar espacios, y hasta 2.000. */
export function textoSoporteValido(texto: string) {
  return (
    texto.trim().length >= LIMITES_SOPORTE.textoMin &&
    texto.length <= LIMITES_SOPORTE.textoMax
  )
}

/** Lo que se guarda (sin la fecha, que pone el servidor). */
export type MensajeSoporte = {
  uid: string
  nombre: string
  correo: string
  tipo: TipoMensajeSoporte
  /** Solo en los comentarios; null en los problemas. */
  subtipo: SubtipoComentario | null
  /** Clave de la página del menú, o «otra». */
  pagina: string
  texto: string
  estado: 'nuevo'
  /** Lo mínimo para poder ayudar: dónde estaba, con qué navegador y modo. */
  contexto: {
    ruta: string
    navegador: string
    modo: 'claro' | 'oscuro'
  }
}

export type DatosEnvioSoporte = {
  /** De la cuenta con sesión: nunca lo escribe el profesional. */
  cuenta: { uid: string; nombre: string | null; correo: string }
  tipo: TipoMensajeSoporte
  subtipo: SubtipoComentario | null
  pagina: string
  texto: string
  ruta: string
  navegador: string
  modoOscuro: boolean
}

/** El mensaje tal como se guarda, con todo recortado a sus límites. */
export function construirMensajeSoporte(d: DatosEnvioSoporte): MensajeSoporte {
  return {
    uid: d.cuenta.uid,
    nombre: (d.cuenta.nombre ?? '').slice(0, LIMITES_SOPORTE.nombre),
    correo: d.cuenta.correo,
    tipo: d.tipo,
    subtipo: d.tipo === 'comentario' ? d.subtipo : null,
    pagina: d.pagina,
    texto: d.texto.trim(),
    estado: 'nuevo',
    contexto: {
      ruta: d.ruta.slice(0, LIMITES_SOPORTE.ruta),
      navegador: d.navegador.slice(0, LIMITES_SOPORTE.navegador),
      modo: d.modoOscuro ? 'oscuro' : 'claro',
    },
  }
}

// ---------- Borradores (lo escrito a medias, durante la sesión) ----------

export type BorradoresSoporte = {
  problema: { texto: string; pagina: string | null }
  comentario: { texto: string; subtipo: SubtipoComentario | null }
}

export const BORRADORES_VACIOS: BorradoresSoporte = {
  problema: { texto: '', pagina: null },
  comentario: { texto: '', subtipo: null },
}

const esSubtipo = (v: unknown): v is SubtipoComentario =>
  SUBTIPOS_COMENTARIO.some((s) => s.valor === v)

/**
 * Lee los borradores guardados. Lo que falte o no tenga la forma esperada
 * (un valor viejo, roto o manipulado) se queda vacío.
 */
export function leerBorradores(guardado: string | null): BorradoresSoporte {
  let datos: unknown = null
  try {
    datos = guardado ? JSON.parse(guardado) : null
  } catch {
    datos = null
  }
  const d = (datos ?? {}) as Record<string, Record<string, unknown> | undefined>
  const texto = (v: unknown) =>
    typeof v === 'string' ? v.slice(0, LIMITES_SOPORTE.textoMax) : ''
  return {
    problema: {
      texto: texto(d.problema?.texto),
      pagina: typeof d.problema?.pagina === 'string' ? d.problema.pagina : null,
    },
    comentario: {
      texto: texto(d.comentario?.texto),
      subtipo: esSubtipo(d.comentario?.subtipo) ? d.comentario.subtipo : null,
    },
  }
}
