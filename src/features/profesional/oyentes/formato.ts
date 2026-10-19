import type { OyenteDelProfesional } from '../../perfilProfesional/modelo'

export const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Inicial para el avatar (sin foto: el panel no lee perfiles ajenos). */
export const inicialOyente = (oyente: OyenteDelProfesional) =>
  oyente.nombre.match(/[\p{L}\p{N}]/u)?.[0].toUpperCase() ?? '?'
