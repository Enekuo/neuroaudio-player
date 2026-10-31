// Señal de un solo uso entre el mini-reproductor y la pantalla completa:
// cuando se abre tocando (o deslizando) el mini-reproductor, la hoja de la
// pantalla completa empieza con su borde de arriba justo donde estaba el
// mini-reproductor, así parece que este crece hasta llenar la pantalla.
// null: se abrió desde otro sitio (sube desde abajo del todo).
let desdeMini: number | null = null

export function markOpenedFromMini(top: number) {
  desdeMini = top
}

export function consumeOpenedFromMini() {
  const value = desdeMini
  desdeMini = null
  return value
}
