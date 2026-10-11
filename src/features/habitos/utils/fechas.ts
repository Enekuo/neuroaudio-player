// Utilidades de fechas del calendario de Hábitos. Todo en hora local: un
// «día» es la casilla que ve la persona, no un instante UTC.

/** Clave estable de un día: 'AAAA-MM-DD' (hora local). */
export function claveDia(fecha: Date) {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

export function mismoDia(a: Date, b: Date) {
  return claveDia(a) === claveDia(b)
}

export function sumarDias(fecha: Date, dias: number) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias)
}

export function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

/** Primer día del mes `desplazamiento` meses después (o antes) de `fecha`. */
export function inicioDeMes(fecha: Date, desplazamiento = 0) {
  return new Date(fecha.getFullYear(), fecha.getMonth() + desplazamiento, 1)
}

/**
 * Las 6 semanas (42 días, de lunes a domingo) que pinta la rejilla de un mes.
 * Siempre 6 filas: así la rejilla no cambia de alto al pasar de mes.
 */
export function diasDeLaRejilla(mes: Date) {
  const primero = inicioDeMes(mes)
  // getDay(): 0 = domingo. Semana europea: el lunes es la primera columna.
  const huecoInicial = (primero.getDay() + 6) % 7
  const inicio = sumarDias(primero, -huecoInicial)
  return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i))
}

/** Cabecera de la rejilla, de lunes a domingo. */
export const DIAS_SEMANA = [
  { corto: 'L', largo: 'lunes' },
  { corto: 'M', largo: 'martes' },
  { corto: 'X', largo: 'miércoles' },
  { corto: 'J', largo: 'jueves' },
  { corto: 'V', largo: 'viernes' },
  { corto: 'S', largo: 'sábado' },
  { corto: 'D', largo: 'domingo' },
] as const

const formatoMes = new Intl.DateTimeFormat('es-ES', { month: 'long' })
const formatoDiaLargo = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const conMayuscula = (texto: string) =>
  texto.charAt(0).toUpperCase() + texto.slice(1)

/** «Octubre». */
export function nombreMes(fecha: Date) {
  return conMayuscula(formatoMes.format(fecha))
}

/** «Miércoles, 14 de octubre». */
export function fechaLarga(fecha: Date) {
  const [diaSemana, ...resto] = formatoDiaLargo.format(fecha).split(' ')
  return `${conMayuscula(diaSemana.replace(',', ''))}, ${resto.join(' ')}`
}
