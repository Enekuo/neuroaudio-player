import { describe, expect, it } from 'vitest'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import type { LibraryAudio } from '../hooks/useUserAudios'
import { buscarAudios, type AudioDeProfesional } from './buscarAudios'

const propio = (id: string, name: string): LibraryAudio => ({
  id,
  name,
  url: '',
  size: 1,
  createdAt: new Date(0),
  isFavorite: false,
  favoritedAt: null,
  lastPlayedAt: null,
})

const dePro = (
  id: string,
  titulo: string,
  {
    descripcion = '',
    etiquetas = [] as string[],
    profesional = 'Lucía Ferrer',
    paraTi = false,
  } = {},
): AudioDeProfesional => ({
  audio: {
    id,
    profesionalUid: 'pro',
    titulo,
    descripcion,
    estado: 'publicado',
    tipo: 'general',
    destinatarioUid: null,
    archivo: '',
    duracionSegundos: 60,
    tamanoBytes: 1,
    contieneSalud: false,
    orden: 0,
    portada: 'defecto',
    portadaImagen: null,
    etiquetas,
    creadoEn: null,
    actualizadoEn: null,
  } as AudioProfesional,
  profesionalUid: 'pro',
  profesional,
  paraTi,
})

const ids = (r: ReturnType<typeof buscarAudios>) =>
  r.map((x) => (x.origen === 'propio' ? x.audio.id : x.audio.id))

describe('buscarAudios', () => {
  it('nada por debajo de 2 letras', () => {
    expect(buscarAudios('r', [propio('a', 'Respiración')], [])).toEqual([])
  })

  it('mezcla propios y de profesionales, primero los que empiezan por lo escrito', () => {
    const r = buscarAudios(
      'resp',
      [propio('a', 'Mi respiración')],
      [dePro('b', 'Respiración guiada')],
    )
    expect(ids(r)).toEqual(['b', 'a'])
    expect(r[0].origen).toBe('profesional')
  })

  it('tolera erratas en el título', () => {
    expect(
      ids(buscarAudios('respiracon', [], [dePro('b', 'Respiración')])),
    ).toEqual(['b'])
  })

  it('encuentra por etiqueta y por nombre del profesional, sin aviso de descripción', () => {
    const audios = [
      dePro('b', 'Calma', { etiquetas: ['ansiedad'] }),
      dePro('c', 'Dormir', { profesional: 'Mario Ruiz' }),
    ]
    const porEtiqueta = buscarAudios('ansiedad', [], audios)
    expect(ids(porEtiqueta)).toEqual(['b'])
    expect(porEtiqueta[0].porDescripcion).toBe(false)
    expect(ids(buscarAudios('mario', [], audios))).toEqual(['c'])
  })

  it('los propios, solo por el nombre', () => {
    expect(buscarAudios('lucía', [propio('a', 'Paseo')], [])).toEqual([])
  })

  it('la descripción, solo literal, al final y con aviso', () => {
    const audios = [
      dePro('b', 'Calma', { descripcion: 'Ideal para el insomnio leve.' }),
      dePro('c', 'Insomnio'),
    ]
    const r = buscarAudios('insomnio', [], audios)
    expect(ids(r)).toEqual(['c', 'b'])
    expect(r.map((x) => x.porDescripcion)).toEqual([false, true])
    // Con errata no basta para la descripción.
    expect(ids(buscarAudios('insomio', [], audios))).toEqual(['c'])
  })

  it('sin aviso si también coincide por el título', () => {
    const r = buscarAudios(
      'calma',
      [],
      [dePro('b', 'Calma', { descripcion: 'calma profunda' })],
    )
    expect(r[0].porDescripcion).toBe(false)
  })

  it('como mucho 30', () => {
    const muchos = Array.from({ length: 40 }, (_, i) =>
      propio(String(i), `Audio ${i}`),
    )
    expect(buscarAudios('audio', muchos, [])).toHaveLength(30)
  })
})
