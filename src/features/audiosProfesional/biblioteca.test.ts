import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  LIMITES_BIBLIOTECA,
  idEnvio,
  normalizarEtiqueta,
  normalizarEtiquetas,
  rutaAudio,
  rutaPortadaAudio,
} from './modelo'

describe('etiquetas de «Mis audios»', () => {
  it('se guardan en minúsculas y sin espacios sobrantes', () => {
    expect(normalizarEtiqueta('  Ansiedad   Social ')).toBe('ansiedad social')
  })

  it('como mucho 30 caracteres', () => {
    expect(normalizarEtiqueta('a'.repeat(40))).toHaveLength(30)
  })

  it('sin vacías ni repetidas, y como mucho 5', () => {
    expect(
      normalizarEtiquetas([
        'Sueño',
        'sueño ',
        ' ',
        'dolor',
        'a',
        'b',
        'c',
        'd',
      ]),
    ).toEqual(['sueño', 'dolor', 'a', 'b', 'c'])
  })
})

describe('rutas y envíos', () => {
  it('el archivo y la portada de la biblioteca van en su carpeta', () => {
    expect(rutaAudio('pro', 'a1', true)).toBe('bibliotecaPro/pro/a1/archivo')
    expect(rutaPortadaAudio('pro', 'a1', 'img', true)).toBe(
      'bibliotecaPro/pro/a1/portadas/img',
    )
    expect(rutaAudio('pro', 'a1')).toBe('audiosPro/pro/a1/archivo')
  })

  it('un envío por audio y persona', () => {
    expect(idEnvio('a1', 'oyente')).toBe('a1__oyente')
  })
})

describe('las reglas usan los mismos límites que el código', () => {
  for (const archivo of [
    'reglas/firestore.todos.rules',
    'reglas/firestore.solo-vinculados.rules',
  ]) {
    it(archivo, () => {
      const reglas = readFileSync(archivo, 'utf8')
      expect(reglas).toContain(
        `d.etiquetas.size() <= ${LIMITES_BIBLIOTECA.etiquetas}`,
      )
      expect(reglas).toContain(`l[i].size() <= ${LIMITES_BIBLIOTECA.etiqueta}`)
    })
  }
})
