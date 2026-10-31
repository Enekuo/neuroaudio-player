import { describe, expect, it } from 'vitest'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { resumirUso } from './uso'

const audio = (id: string, tamanoBytes: number) =>
  ({ id, tamanoBytes }) as AudioProfesional

// El formato del espacio (formatearEspacio) se prueba en src/lib/formato.test.ts.

describe('resumirUso', () => {
  it('suma generales, para una persona y Mis audios', () => {
    expect(
      resumirUso([[audio('g1', 100)], [audio('p1', 50)], [audio('b1', 25)]]),
    ).toEqual({ audios: 3, bytes: 175 })
  })

  it('no cuenta dos veces el mismo audio', () => {
    expect(resumirUso([[audio('a', 10)], [audio('a', 10)]])).toEqual({
      audios: 1,
      bytes: 10,
    })
  })

  it('un audio de Biblioteca que también está en Audios cuenta una vez (mismo archivo)', () => {
    const archivo = 'bibliotecaPro/pro/b1/archivo'
    const original = { ...audio('b1', 40), archivo } as AudioProfesional
    const general = { ...audio('b1__general', 40), archivo } as AudioProfesional
    expect(resumirUso([[general], [], [original]])).toEqual({
      audios: 1,
      bytes: 40,
    })
  })

  it('sin nada todavía: cero', () => {
    expect(resumirUso([[], [], []])).toEqual({ audios: 0, bytes: 0 })
  })

  it('un tamaño que falte o no sea válido no suma', () => {
    expect(
      resumirUso([[audio('a', Number.NaN), audio('b', -3), audio('c', 7)]]),
    ).toEqual({ audios: 3, bytes: 7 })
  })
})
