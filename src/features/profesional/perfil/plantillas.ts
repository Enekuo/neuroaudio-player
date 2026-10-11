// Secciones sugeridas al empezar el perfil. El profesional puede usarlas o
// crear las suyas; el texto de ayuda solo se ve mientras la sección está vacía.
export const PLANTILLAS_SECCION = [
  {
    titulo: 'Acerca de mí',
    ayuda: 'Quién eres y por qué haces lo que haces.',
  },
  {
    titulo: 'Cómo trabajo',
    ayuda:
      'Cómo son tus sesiones o tus audios, y qué puede esperar quien te escucha.',
  },
  {
    titulo: 'Formación',
    ayuda:
      'Tus estudios y tu experiencia, con tus palabras. NeuroAudio todavía no verifica títulos, así que no se mostrarán como credencial comprobada.',
  },
  {
    titulo: 'Preguntas frecuentes',
    ayuda: 'Las dudas que más te hacen, con su respuesta.',
  },
  {
    titulo: 'Otros servicios',
    ayuda: 'Qué más ofreces y cómo contratarlo (puedes indicar tu web).',
  },
] as const

export function ayudaDeSeccion(titulo: string) {
  return (
    PLANTILLAS_SECCION.find((p) => p.titulo === titulo.trim())?.ayuda ??
    'Escribe lo que quieras contar a tus oyentes.'
  )
}
