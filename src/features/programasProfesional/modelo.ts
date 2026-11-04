// Programas del profesional (colección `programasProfesional`): una lista
// ordenada de audios de su Biblioteca para seguir paso a paso, con un ritmo
// recomendado. Quién lo tiene:
// - para 'todos': todos sus oyentes con vínculo activo (también los que
//   entren después), cada uno desde el paso 1;
// - para 'personas': quien tiene su acceso (`accesosPrograma`).
// El progreso es del oyente (`progresoPrograma`): solo él lo lee y lo
// escribe.
//
// Los límites coinciden con firestore.rules: si cambias uno, cambia el otro.

export const LIMITES_PROGRAMA = {
  titulo: 80,
  descripcion: 2000,
  /** Pasos por programa (también en las reglas). */
  pasos: 50,
  /** Programas por profesional (lo cuenta la app). */
  programas: 30,
  /** Personas por programa privado (lo cuenta la app). */
  personas: 100,
  /** Días de «cada N días». */
  ritmoDias: 365,
} as const

export type EstadoPrograma = 'borrador' | 'publicado'
/** Cómo se abren los pasos. */
export type AperturaPrograma = 'libre' | 'orden' | 'calendario'
/** Ritmo recomendado (en «Por calendario», el que abre los pasos). */
export type RitmoPrograma = 'diario' | 'semanal' | 'mensual' | 'dias'
export type ParaPrograma = 'todos' | 'personas'

export type ProgramaProfesional = {
  id: string
  profesionalUid: string
  titulo: string
  /** Texto plano opcional. Nunca HTML. */
  descripcion: string
  estado: EstadoPrograma
  apertura: AperturaPrograma
  ritmo: RitmoPrograma
  /** Solo con ritmo 'dias': cada cuántos días. */
  ritmoDias: number | null
  para: ParaPrograma
  /** Ids de audios de su Biblioteca, en orden, sin repetir. */
  pasos: string[]
  /** La primera vez que se publicó (no cambia después); null si nunca. */
  publicadoEn: Date | null
  creadoEn: Date | null
  actualizadoEn: Date | null
}

/** Una persona que tiene un programa privado; `creadoEn` es su día 1. */
export type AccesoPrograma = {
  id: string
  profesionalUid: string
  programaId: string
  oyenteUid: string
  creadoEn: Date | null
}

export function idAccesoPrograma(programaId: string, oyenteUid: string) {
  return `${programaId}__${oyenteUid}`
}

export function idProgresoPrograma(programaId: string, oyenteUid: string) {
  return `${programaId}__${oyenteUid}`
}

/** «1 audio al día», «1 audio cada 3 días»… */
export function textoRitmo(ritmo: RitmoPrograma, ritmoDias: number | null) {
  if (ritmo === 'diario') return '1 audio al día'
  if (ritmo === 'semanal') return '1 audio a la semana'
  if (ritmo === 'mensual') return '1 audio al mes'
  const n = ritmoDias ?? 1
  return n === 1 ? '1 audio al día' : `1 audio cada ${n} días`
}

/** «Paso 2 de 7» o, si los ha completado todos, «Completado». */
export function textoPaso(pasoActual: number | null, total: number) {
  return pasoActual === null ? 'Completado' : `Paso ${pasoActual} de ${total}`
}

/** «Para todos» o «Para 3 personas» (etiqueta del panel). */
export const textoPara = (para: ParaPrograma, personas: number) =>
  para === 'todos'
    ? 'Para todos'
    : personas === 1
      ? 'Para 1 persona'
      : `Para ${personas} personas`

/**
 * El día 1 de esta persona: en uno privado, el día en que se lo dieron; en
 * uno para todos, el más tardío entre su publicación y la creación de su
 * vínculo. null si aún no se sabe.
 */
export function diaUno(
  programa: Pick<ProgramaProfesional, 'para' | 'publicadoEn'>,
  datos: { accesoEn?: Date | null; vinculoCreadoEn?: Date | null },
): Date | null {
  if (programa.para === 'personas') return datos.accesoEn ?? null
  const publicado = programa.publicadoEn
  const vinculo = datos.vinculoCreadoEn ?? null
  if (!publicado) return null
  if (!vinculo) return publicado
  return vinculo > publicado ? vinculo : publicado
}

/** Medianoche (hora local) del día de `fecha`. */
const inicioDelDia = (fecha: Date) =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())

/** Días naturales entre dos fechas (hora local; los de pausa cuentan). */
function diasEntre(desde: Date, hasta: Date) {
  return Math.round(
    (inicioDelDia(hasta).getTime() - inicioDelDia(desde).getTime()) /
      86_400_000,
  )
}

const diasDelMes = (anio: number, mes: number) =>
  new Date(anio, mes + 1, 0).getDate()

/**
 * Meses naturales cumplidos desde `desde` hasta `hasta`. En un mes más
 * corto (del 31 de enero a febrero), se cumple el último día del mes.
 */
function mesesEntre(desde: Date, hasta: Date) {
  let meses =
    (hasta.getFullYear() - desde.getFullYear()) * 12 +
    (hasta.getMonth() - desde.getMonth())
  const diaQueToca = Math.min(
    desde.getDate(),
    diasDelMes(hasta.getFullYear(), hasta.getMonth()),
  )
  if (hasta.getDate() < diaQueToca) meses -= 1
  return meses
}

/**
 * «Por calendario»: cuántos pasos lleva abiertos desde su día 1 según el
 * ritmo (el día 1, uno; luego uno más por día, semana, mes o cada N días).
 */
export function pasosPorCalendario(
  dia1: Date,
  ahora: Date,
  ritmo: RitmoPrograma,
  ritmoDias: number | null,
) {
  if (ahora < inicioDelDia(dia1)) return 0
  const dias = diasEntre(dia1, ahora)
  if (ritmo === 'mensual') return Math.max(0, mesesEntre(dia1, ahora)) + 1
  const cada =
    ritmo === 'diario' ? 1 : ritmo === 'semanal' ? 7 : (ritmoDias ?? 1)
  return Math.floor(dias / Math.max(1, cada)) + 1
}

/** Fecha en que se abre el paso `indice` (0, 1…) «Por calendario». */
export function fechaDeApertura(
  dia1: Date,
  indice: number,
  ritmo: RitmoPrograma,
  ritmoDias: number | null,
) {
  const base = inicioDelDia(dia1)
  if (ritmo === 'mensual') {
    const meses = base.getMonth() + indice
    const anio = base.getFullYear() + Math.floor(meses / 12)
    const mes = meses % 12
    return new Date(anio, mes, Math.min(base.getDate(), diasDelMes(anio, mes)))
  }
  const cada =
    ritmo === 'diario' ? 1 : ritmo === 'semanal' ? 7 : (ritmoDias ?? 1)
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + indice * Math.max(1, cada),
  )
}

export type EstadoPaso =
  | { estado: 'completado' }
  /** El que le toca: el primero abierto sin completar. */
  | { estado: 'siguiente' }
  | { estado: 'abierto' }
  /** Cerrado: tras completar el paso `trasPaso` (1, 2…) o a partir de `abreEl`. */
  | { estado: 'cerrado'; trasPaso?: number; abreEl?: Date }

export type SituacionPrograma = {
  pasos: EstadoPaso[]
  /** Posición (1, 2…) del que le toca; null si ya los ha completado todos. */
  pasoActual: number | null
  total: number
  completados: number
}

/**
 * Cómo está cada paso para esta persona, con lo que ha completado (ids de
 * audio, aunque se hayan reordenado o quitado pasos):
 * - Libre: todos abiertos.
 * - En orden: abiertos hasta el siguiente al último completado (desmarcar
 *   no cierra nada; solo cambia cuál es el siguiente).
 * - Por calendario: los que el ritmo ha abierto desde su día 1.
 * Lo completado siempre se puede volver a escuchar.
 */
/**
 * En el progreso, un paso que se completó y luego se desmarcó se guarda como
 * «~id»: ya no cuenta como completado, pero lo que abrió sigue abierto.
 */
export const DESMARCADO = '~'

/** La lista de completados tras marcar o desmarcar un paso. */
export function completadosAlMarcar(
  actuales: readonly string[],
  audioId: string,
  completado: boolean,
) {
  const sinEl = actuales.filter(
    (c) => c !== audioId && c !== DESMARCADO + audioId,
  )
  return [...sinEl, completado ? audioId : DESMARCADO + audioId]
}

export function situacionPrograma(
  programa: Pick<
    ProgramaProfesional,
    'pasos' | 'apertura' | 'ritmo' | 'ritmoDias'
  >,
  completados: readonly string[],
  dia1: Date | null,
  ahora: Date,
): SituacionPrograma {
  const hechos = new Set(completados.filter((c) => !c.startsWith(DESMARCADO)))
  // Completados alguna vez (aunque luego se desmarcaran): lo que abrieron
  // sigue abierto.
  const tocados = new Set(
    completados.map((c) => (c.startsWith(DESMARCADO) ? c.slice(1) : c)),
  )
  const { pasos } = programa
  let abiertosHasta: number // índice exclusivo
  if (programa.apertura === 'libre') {
    abiertosHasta = pasos.length
  } else if (programa.apertura === 'orden') {
    let ultimo = -1
    pasos.forEach((id, i) => {
      if (tocados.has(id)) ultimo = i
    })
    abiertosHasta = ultimo + 2
  } else {
    abiertosHasta = dia1
      ? pasosPorCalendario(dia1, ahora, programa.ritmo, programa.ritmoDias)
      : 0
  }

  let siguiente: number | null = null
  const estados: EstadoPaso[] = pasos.map((id, i) => {
    if (hechos.has(id)) return { estado: 'completado' }
    if (i < abiertosHasta) {
      if (siguiente === null) {
        siguiente = i
        return { estado: 'siguiente' }
      }
      return { estado: 'abierto' }
    }
    return programa.apertura === 'calendario' && dia1
      ? {
          estado: 'cerrado',
          abreEl: fechaDeApertura(dia1, i, programa.ritmo, programa.ritmoDias),
        }
      : { estado: 'cerrado', trasPaso: i }
  })

  const primeroSinHacer = pasos.findIndex((id) => !hechos.has(id))
  return {
    pasos: estados,
    pasoActual: primeroSinHacer === -1 ? null : primeroSinHacer + 1,
    total: pasos.length,
    completados: pasos.filter((id) => hechos.has(id)).length,
  }
}

/** Errores de los datos antes de guardar (los mismos límites que las reglas). */
export function validarPrograma(
  datos: Pick<
    ProgramaProfesional,
    'titulo' | 'descripcion' | 'ritmo' | 'ritmoDias' | 'pasos'
  >,
  publicar: boolean,
) {
  const errores: string[] = []
  const titulo = datos.titulo.trim()
  if (!titulo) errores.push('Ponle un nombre al programa.')
  if (titulo.length > LIMITES_PROGRAMA.titulo)
    errores.push(
      `El nombre puede tener ${LIMITES_PROGRAMA.titulo} caracteres como mucho.`,
    )
  if (datos.descripcion.trim().length > LIMITES_PROGRAMA.descripcion)
    errores.push(
      `La descripción puede tener ${LIMITES_PROGRAMA.descripcion} caracteres como mucho.`,
    )
  if (
    datos.ritmo === 'dias' &&
    !(
      Number.isInteger(datos.ritmoDias) &&
      (datos.ritmoDias ?? 0) >= 1 &&
      (datos.ritmoDias ?? 0) <= LIMITES_PROGRAMA.ritmoDias
    )
  )
    errores.push(
      `Elige cada cuántos días (de 1 a ${LIMITES_PROGRAMA.ritmoDias}).`,
    )
  if (datos.pasos.length > LIMITES_PROGRAMA.pasos)
    errores.push(
      `Un programa puede tener ${LIMITES_PROGRAMA.pasos} pasos como mucho.`,
    )
  if (new Set(datos.pasos).size !== datos.pasos.length)
    errores.push('Hay un audio repetido.')
  if (publicar && datos.pasos.length === 0)
    errores.push('Añade al menos un audio para publicarlo.')
  return errores
}
