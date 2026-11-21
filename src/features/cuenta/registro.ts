/**
 * Registro de cuentas: opciones, validación y lo que se guarda en
 * users/{uid}. Los límites y valores coinciden con la propuesta de reglas
 * (reglas/propuestas, match /users): si cambias uno, cambia el otro.
 */

export const LIMITES_REGISTRO = {
  nombreMin: 2,
  nombreMax: 80,
  otraMin: 2,
  otraMax: 60,
} as const

export const DEDICACIONES = [
  { valor: 'hipnosis', etiqueta: 'Hipnosis' },
  { valor: 'meditacion', etiqueta: 'Meditación' },
  { valor: 'coaching', etiqueta: 'Coaching' },
  { valor: 'psicologia', etiqueta: 'Psicología' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const

export type Dedicacion = (typeof DEDICACIONES)[number]['valor']

export const CLIENTES = [
  { valor: '1-10', etiqueta: '1 a 10' },
  { valor: '11-50', etiqueta: '11 a 50' },
  { valor: '51-200', etiqueta: '51 a 200' },
  { valor: '200+', etiqueta: 'Más de 200' },
] as const

export type Clientes = (typeof CLIENTES)[number]['valor']

/** Lo que hay en el formulario del profesional ('' si no se eligió nada). */
export type FormularioProfesional = {
  nombre: string
  dedicacion: string
  dedicacionOtra: string
  pais: string
  clientes: string
  aceptaTerminos: boolean
  novedades: boolean
}

export const FORMULARIO_VACIO: FormularioProfesional = {
  nombre: '',
  dedicacion: '',
  dedicacionOtra: '',
  pais: '',
  clientes: '',
  aceptaTerminos: false,
  novedades: false,
}

export type ErroresRegistro = Partial<
  Record<
    'nombre' | 'dedicacion' | 'dedicacionOtra' | 'pais' | 'clientes' | 'aceptaTerminos',
    string
  >
>

/** Los errores del formulario (vacío si todo vale). */
export function validarRegistroProfesional(
  f: FormularioProfesional,
  paisesValidos: ReadonlySet<string> = CODIGOS_PAIS_SET,
): ErroresRegistro {
  const errores: ErroresRegistro = {}
  const nombre = f.nombre.trim()
  if (!nombre) errores.nombre = 'Escribe tu nombre profesional.'
  else if (nombre.length < LIMITES_REGISTRO.nombreMin)
    errores.nombre = `Escribe al menos ${LIMITES_REGISTRO.nombreMin} caracteres.`
  else if (nombre.length > LIMITES_REGISTRO.nombreMax)
    errores.nombre = `Como mucho ${LIMITES_REGISTRO.nombreMax} caracteres.`

  if (!DEDICACIONES.some((d) => d.valor === f.dedicacion))
    errores.dedicacion = 'Elige a qué te dedicas.'
  else if (f.dedicacion === 'otro') {
    const otra = f.dedicacionOtra.trim()
    if (!otra) errores.dedicacionOtra = 'Escribe a qué te dedicas.'
    else if (otra.length < LIMITES_REGISTRO.otraMin)
      errores.dedicacionOtra = `Escribe al menos ${LIMITES_REGISTRO.otraMin} caracteres.`
    else if (otra.length > LIMITES_REGISTRO.otraMax)
      errores.dedicacionOtra = `Como mucho ${LIMITES_REGISTRO.otraMax} caracteres.`
  }

  if (!paisesValidos.has(f.pais)) errores.pais = 'Elige tu país.'

  if (f.clientes && !CLIENTES.some((c) => c.valor === f.clientes))
    errores.clientes = 'Elige una de las opciones.'

  if (!f.aceptaTerminos)
    errores.aceptaTerminos =
      'Tienes que aceptar los términos y confirmar que eres mayor de edad.'

  return errores
}

export const registroValido = (
  f: FormularioProfesional,
  paises?: ReadonlySet<string>,
) => Object.keys(validarRegistroProfesional(f, paises)).length === 0

/** Lo que se guarda en users/{uid}.profesional (sin fechas). */
export type DatosProfesional = {
  nombre: string
  dedicacion: Dedicacion
  /** Solo con «Otro»; null en las demás. */
  dedicacionOtra: string | null
  pais: string
  /** Opcional: null si no lo dijo. */
  clientes: Clientes | null
}

export function datosProfesionalDe(f: FormularioProfesional): DatosProfesional {
  return {
    nombre: f.nombre.trim(),
    dedicacion: f.dedicacion as Dedicacion,
    dedicacionOtra: f.dedicacion === 'otro' ? f.dedicacionOtra.trim() : null,
    pais: f.pais,
    clientes: (f.clientes || null) as Clientes | null,
  }
}

// ---------- Países ----------

/** Códigos ISO 3166-1 (dos letras) de todos los países y territorios. */
export const CODIGOS_PAIS = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ ' +
  'BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR ' +
  'CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
  'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ' +
  'ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ ' +
  'LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ ' +
  'MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF ' +
  'PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI ' +
  'SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR ' +
  'TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ')

const CODIGOS_PAIS_SET: ReadonlySet<string> = new Set(CODIGOS_PAIS)

/** Todos los países, con su nombre en español, por orden alfabético. */
export function paisesEnEspanol(): { codigo: string; nombre: string }[] {
  const nombres = new Intl.DisplayNames(['es'], { type: 'region' })
  return CODIGOS_PAIS.map((codigo) => ({
    codigo,
    nombre: nombres.of(codigo) ?? codigo,
  })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

/**
 * País del navegador (de sus idiomas, p. ej. «es-ES» → «ES»), si es uno de
 * la lista; si no, '' (sin preseleccionar).
 */
export function paisDelNavegador(idiomas: readonly string[]): string {
  for (const idioma of idiomas) {
    const partes = idioma.split(/[-_]/)
    const region = partes
      .slice(1)
      .find((p) => /^[A-Za-z]{2}$/.test(p))
      ?.toUpperCase()
    if (region && CODIGOS_PAIS_SET.has(region)) return region
  }
  return ''
}
