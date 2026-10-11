// Tipos y textos de las programaciones del calendario de Hábitos. Todavía no
// hay programaciones reales conectadas: el calendario se muestra vacío.

export type ModoProgramacion = 'aviso' | 'automatico'

export type AudioProgramado = {
  id: string
  audioNombre: string
  /** 'HH:MM', hora local. */
  hora: string
  modo: ModoProgramacion
}

export const MODOS_PROGRAMACION: {
  valor: ModoProgramacion
  titulo: string
  /** Versión corta para listas estrechas. */
  corto: string
  descripcion: string
}[] = [
  {
    valor: 'aviso',
    titulo: 'Solo aviso',
    corto: 'Solo aviso',
    descripcion: 'Te avisamos a esa hora y tú decides cuándo escucharlo.',
  },
  {
    valor: 'automatico',
    titulo: 'Reproducir automáticamente',
    corto: 'Se reproduce solo',
    descripcion: 'A esa hora empieza a sonar sin que tengas que hacer nada.',
  },
]
