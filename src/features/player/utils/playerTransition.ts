// Señal de un solo uso entre el mini-reproductor y la pantalla completa:
// cuando se abre con View Transitions (la imagen del recuadro crece hasta la
// imagen grande), la pantalla completa no debe hacer además su animación de
// "hoja que sube".
let openedWithViewTransition = false

export function markOpenedWithViewTransition() {
  openedWithViewTransition = true
}

export function consumeOpenedWithViewTransition() {
  const value = openedWithViewTransition
  openedWithViewTransition = false
  return value
}
