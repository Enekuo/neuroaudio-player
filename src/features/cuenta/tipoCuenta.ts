/**
 * Tipo de cuenta de cada usuario: `users/{uid}.tipoCuenta`.
 *
 * - 'oyente' o 'profesional'. Sin el campo (cuentas anteriores a este dato),
 *   oyente.
 * - Solo puede pasar de oyente a profesional, nunca al revés (lo exigen las
 *   reglas).
 * - Todo lo que distingue a un profesional depende SOLO de este dato: el
 *   acceso a /profesional, el botón «Panel del profesional» y, en las reglas,
 *   cada escritura de profesional.
 */
export type TipoCuenta = 'oyente' | 'profesional'

export const TIPOS_CUENTA: readonly TipoCuenta[] = ['oyente', 'profesional']

/** Tipo de cuenta según el documento users/{uid} (lo que no sea 'profesional', oyente). */
export function tipoCuentaDe(datos: unknown): TipoCuenta {
  const valor =
    datos && typeof datos === 'object'
      ? (datos as { tipoCuenta?: unknown }).tipoCuenta
      : undefined
  return valor === 'profesional' ? 'profesional' : 'oyente'
}

/** Si una cuenta puede pasar de un tipo a otro (solo de oyente a profesional, o quedarse igual). */
export function cambioDeTipoValido(antes: TipoCuenta, despues: TipoCuenta) {
  return antes === despues || (antes === 'oyente' && despues === 'profesional')
}

/**
 * Qué hacer al abrir /profesional: mientras no se sabe el tipo, esperar; un
 * profesional entra; cualquier otro va a la app del oyente.
 */
export function accesoAlPanel(
  cargando: boolean,
  tipo: TipoCuenta,
): 'esperar' | 'entrar' | 'a-la-app' {
  if (cargando) return 'esperar'
  return tipo === 'profesional' ? 'entrar' : 'a-la-app'
}
