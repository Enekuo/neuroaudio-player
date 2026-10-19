/**
 * PRUEBA TEMPORAL — interruptor único de qué profesionales ve cada usuario.
 *
 * - true («modo todos»): la fila de Inicio y /app/profesionales muestran a
 *   todos los profesionales con perfil (primero los vinculados). Sirve para
 *   ver y ajustar el diseño antes del lanzamiento.
 * - false («modo solo vinculados», el de lanzamiento): solo los profesionales
 *   con los que el usuario tiene un vínculo activo.
 *
 * Los audios no dependen de esto: siempre son solo para oyentes vinculados.
 *
 * Va SIEMPRE a la vez que las reglas desplegadas (firestore.rules y
 * storage.rules): ver reglas/LEEME.md. Un test comprueba que las reglas de la
 * raíz coinciden con este valor.
 */
export const MOSTRAR_TODOS_LOS_PROFESIONALES = true

/**
 * PRUEBA TEMPORAL: título de la fila de Inicio y de /app/profesionales. En
 * modo «todos» la fila muestra a todos (primero los tuyos), así que no es
 * «Tus profesionales».
 */
export const TITULO_PROFESIONALES = MOSTRAR_TODOS_LOS_PROFESIONALES
  ? 'Profesionales'
  : 'Tus profesionales'

/** PRUEBA TEMPORAL: aviso de error de la fila y de /app/profesionales. */
export const AVISO_ERROR_PROFESIONALES = MOSTRAR_TODOS_LOS_PROFESIONALES
  ? 'No se pudieron cargar los profesionales.'
  : 'No se pudieron cargar tus profesionales.'
