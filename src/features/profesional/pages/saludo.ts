/**
 * Nombre del saludo del Dashboard del panel («Bienvenido, …»), por este orden:
 * 1. «¿Cómo quieres que te llamemos?», si está escrito;
 * 2. el nombre del perfil profesional;
 * 3. el primer nombre de la cuenta de Google.
 * null si no hay ninguno (se saluda solo «Bienvenido»).
 */
export function nombreDelSaludo(
  preferido: string | null | undefined,
  nombrePerfil: string | null | undefined,
  nombreGoogle: string | null | undefined,
) {
  return (
    preferido?.trim() ||
    nombrePerfil?.trim() ||
    nombreGoogle?.trim().split(/\s+/)[0] ||
    null
  )
}
