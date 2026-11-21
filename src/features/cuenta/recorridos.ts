/**
 * Los recorridos de entrada y registro, sin Firebase: cada uno recibe lo que
 * necesita (entrar con Google, leer la cuenta, crearla…) y devuelve adónde
 * ir. Así se prueban todos los casos sin navegador.
 *
 * «Sin cuenta» = no existe users/{uid} (null). Una cuenta antigua sin
 * tipoCuenta cuenta como oyente.
 */
import type { TipoCuenta } from './tipoCuenta'

export type Cuenta = TipoCuenta | null

export const RUTA_APP = '/app'
export const RUTA_PANEL = '/profesional'
export const RUTA_LOGIN = '/login'
export const RUTA_ELECCION = '/registro/elegir'
export const RUTA_REGISTRO_PROFESIONAL = '/registro/profesional'
export const RUTA_REGISTRO_OYENTE = '/registro/oyente'

/** Destino de una cuenta ya creada. */
export const destinoDe = (cuenta: TipoCuenta) =>
  cuenta === 'profesional' ? RUTA_PANEL : RUTA_APP

/** Tras /login: profesional → panel; oyente → app; sin cuenta → elección. */
export function destinoTrasLogin(cuenta: Cuenta) {
  return cuenta === null ? RUTA_ELECCION : destinoDe(cuenta)
}

type Uid = string

export type Acciones = {
  /** Entra con Google (ventana de Google) y devuelve el uid. */
  entrar: () => Promise<Uid>
  leerCuenta: (uid: Uid) => Promise<Cuenta>
  crearOyente: (uid: Uid) => Promise<void>
  crearProfesional: (uid: Uid) => Promise<void>
  pasarAProfesional: (uid: Uid) => Promise<void>
  /** «¿Seguro que quieres crear una cuenta profesional?»: true si confirma. */
  confirmarPaso: () => Promise<boolean>
}

/** /login: entra y decide (sin crear nada). */
export async function recorridoLogin(a: Pick<Acciones, 'entrar' | 'leerCuenta'>) {
  const uid = await a.entrar()
  return destinoTrasLogin(await a.leerCuenta(uid))
}

/**
 * /registro/oyente: entra (si no había sesión) y, sin cuenta, la crea como
 * oyente. Con cuenta de cualquier tipo, no cambia nada. Siempre a la app.
 */
export async function recorridoRegistroOyente(
  a: Pick<Acciones, 'entrar' | 'leerCuenta' | 'crearOyente'>,
  uidConSesion: Uid | null,
) {
  const uid = uidConSesion ?? (await a.entrar())
  if ((await a.leerCuenta(uid)) === null) await a.crearOyente(uid)
  return RUTA_APP
}

/**
 * /registro/profesional, al pulsar el botón con el formulario válido:
 * - sin cuenta: se crea como profesional → panel;
 * - ya era profesional: nada → panel;
 * - era oyente: se pregunta (salvo que ya se haya confirmado antes); si
 *   confirma, pasa a profesional → panel; si no, nada → app.
 */
export async function recorridoRegistroProfesional(
  a: Acciones,
  uidConSesion: Uid | null,
  yaConfirmado = false,
) {
  const uid = uidConSesion ?? (await a.entrar())
  const cuenta = await a.leerCuenta(uid)
  if (cuenta === null) {
    await a.crearProfesional(uid)
    return RUTA_PANEL
  }
  if (cuenta === 'profesional') return RUTA_PANEL
  if (!yaConfirmado && !(await a.confirmarPaso())) return RUTA_APP
  await a.pasarAProfesional(uid)
  return RUTA_PANEL
}

/**
 * Al abrir /registro/profesional con la sesión ya iniciada: un profesional
 * va al panel; un oyente ve antes la pregunta (salvo si viene de la pantalla
 * de elección); sin cuenta, el formulario.
 */
export function entradaRegistroProfesional(
  cuenta: Cuenta,
  desdeEleccion: boolean,
): 'panel' | 'preguntar' | 'formulario' {
  if (cuenta === 'profesional') return 'panel'
  if (cuenta === 'oyente' && !desdeEleccion) return 'preguntar'
  return 'formulario'
}

/**
 * Pantalla de elección: solo con sesión y sin cuenta. Sin sesión, a /login;
 * con cuenta, a su sitio.
 */
export function entradaEleccion(
  conSesion: boolean,
  cuenta: Cuenta,
): 'login' | 'mostrar' | string {
  if (!conSesion) return 'login'
  return cuenta === null ? 'mostrar' : destinoDe(cuenta)
}

/** Si un error de Google es que la persona cerró la ventana (no es un fallo). */
export function esCancelacionDeGoogle(error: unknown) {
  const codigo = (error as { code?: unknown } | null)?.code
  return (
    codigo === 'auth/popup-closed-by-user' ||
    codigo === 'auth/cancelled-popup-request' ||
    codigo === 'auth/user-cancelled'
  )
}
