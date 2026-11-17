/**
 * Un trozo de texto de la ayuda: normal, o un término entre «» (el nombre de
 * un botón, una pestaña o una opción), que se resalta para reconocerlo en
 * pantalla. Las comillas se conservan tal cual.
 */
export type Trozo = { texto: string; termino: boolean }

/** Parte un texto plano en trozos normales y términos «entre comillas». */
export function trozosDeTexto(texto: string): Trozo[] {
  return texto
    .split(/(«[^«»]*»)/g)
    .filter((t) => t !== '')
    .map((t) => ({ texto: t, termino: /^«[^«»]*»$/.test(t) }))
}

/** «1 paso», «3 pasos». */
export function textoPasos(n: number) {
  return n === 1 ? '1 paso' : `${n} pasos`
}
