import Fuse from 'fuse.js'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import type { LibraryAudio } from '../hooks/useUserAudios'

/** Un audio de un profesional que este oyente puede escuchar. */
export type AudioDeProfesional = {
  audio: AudioProfesional
  profesionalUid: string
  /** Nombre del profesional, tal como lo ve el oyente ('' si aún no se sabe). */
  profesional: string
  /** «Para una persona» hecho para él o enviado desde Mis audios. */
  paraTi: boolean
}

type ResultadoSinAviso =
  | { origen: 'propio'; audio: LibraryAudio }
  | ({ origen: 'profesional' } & AudioDeProfesional)

export type ResultadoBusqueda = ResultadoSinAviso & {
  /** Coincide por la descripción y no por el título. */
  porDescripcion: boolean
}

export const MAX_RESULTADOS = 30
export const MIN_LONGITUD_BUSQUEDA = 2

type Buscable = {
  titulo: string
  etiquetas: string[]
  profesional: string
  resultado: ResultadoSinAviso
}

/**
 * Busca entre los audios propios (solo por el nombre) y los de profesionales
 * (título, etiquetas y nombre del profesional, con erratas; la descripción,
 * solo si contiene lo escrito tal cual, porque en textos largos las erratas
 * dan coincidencias raras). Primero los títulos que empiezan por lo escrito
 * y después por parecido; las coincidencias solo por la descripción, al
 * final. Como mucho MAX_RESULTADOS.
 */
export function buscarAudios(
  termino: string,
  propios: LibraryAudio[],
  deProfesionales: AudioDeProfesional[],
): ResultadoBusqueda[] {
  const term = termino.trim()
  if (term.length < MIN_LONGITUD_BUSQUEDA) return []
  const termLower = term.toLowerCase()

  const buscables: Buscable[] = [
    ...propios.map((audio) => ({
      titulo: audio.name,
      etiquetas: [],
      profesional: '',
      resultado: { origen: 'propio' as const, audio },
    })),
    ...deProfesionales.map((a) => ({
      titulo: a.audio.titulo,
      etiquetas: a.audio.etiquetas,
      profesional: a.profesional,
      resultado: { origen: 'profesional' as const, ...a },
    })),
  ]

  const fuse = new Fuse(buscables, {
    keys: [
      { name: 'titulo', weight: 3 },
      { name: 'etiquetas', weight: 1.5 },
      { name: 'profesional', weight: 1.5 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
  })

  const enDescripcion = (b: Buscable) =>
    b.resultado.origen === 'profesional' &&
    b.resultado.audio.descripcion.toLowerCase().includes(termLower)

  const encontrados = new Map<Buscable, { score: number; porTitulo: boolean }>()
  for (const r of fuse.search(term)) {
    encontrados.set(r.item, {
      score: r.score ?? 0,
      porTitulo: Boolean(r.matches?.some((m) => m.key === 'titulo')),
    })
  }
  for (const b of buscables) {
    if (!encontrados.has(b) && enDescripcion(b)) {
      encontrados.set(b, { score: 1, porTitulo: false })
    }
  }

  const empieza = (b: Buscable) =>
    b.titulo.toLowerCase().startsWith(termLower) ? 0 : 1

  return [...encontrados]
    .sort(([a, da], [b, db]) => empieza(a) - empieza(b) || da.score - db.score)
    .slice(0, MAX_RESULTADOS)
    .map(
      ([b, { porTitulo }]) =>
        ({
          ...b.resultado,
          porDescripcion: !porTitulo && enDescripcion(b),
        }) as ResultadoBusqueda,
    )
}
