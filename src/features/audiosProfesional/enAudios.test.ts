import { describe, expect, it } from 'vitest'
import {
  audioEnlazado,
  carpetaDePortada,
  idGeneralDeBiblioteca,
  type AudioProfesional,
} from './modelo'

const audio = (extra: Partial<AudioProfesional>) =>
  ({
    id: 'b1',
    tipo: 'biblioteca',
    deMisAudios: null,
    enAudios: false,
    ...extra,
  }) as AudioProfesional

describe('un audio de Biblioteca también en Audios', () => {
  it('el general se llama {id}__general', () => {
    expect(idGeneralDeBiblioteca('b1')).toBe('b1__general')
  })

  it('cada uno apunta al otro; los demás, a ninguno', () => {
    expect(audioEnlazado(audio({ enAudios: true }))).toBe('b1__general')
    expect(
      audioEnlazado(
        audio({ id: 'b1__general', tipo: 'general', deMisAudios: 'b1' }),
      ),
    ).toBe('b1')
    expect(audioEnlazado(audio({}))).toBeNull()
    expect(audioEnlazado(audio({ id: 'g', tipo: 'general' }))).toBeNull()
  })

  it('el general usa la carpeta de imágenes de su original', () => {
    expect(
      carpetaDePortada(
        audio({ id: 'b1__general', tipo: 'general', deMisAudios: 'b1' }),
      ),
    ).toEqual({ audioId: 'b1', biblioteca: true })
    expect(carpetaDePortada(audio({}))).toEqual({
      audioId: 'b1',
      biblioteca: true,
    })
    expect(carpetaDePortada(audio({ id: 'g', tipo: 'general' }))).toEqual({
      audioId: 'g',
      biblioteca: false,
    })
  })
})
