// Aviso de «este audio ha llegado al final» (evento `ended` del reproductor),
// para quien lo necesite sin pasar por el estado del reproductor: por
// ejemplo, completar un paso de un programa. Con repetición llega en cada
// vuelta; quien escucha decide si le importa más de una vez.

type Oyente = (pistaId: string) => void

const oyentes = new Set<Oyente>()

export function avisarFinDePista(pistaId: string | null) {
  if (!pistaId) return
  oyentes.forEach((oyente) => oyente(pistaId))
}

/** Se suscribe al final de cada audio. Devuelve cómo dejar de escuchar. */
export function alTerminarPista(oyente: Oyente) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
