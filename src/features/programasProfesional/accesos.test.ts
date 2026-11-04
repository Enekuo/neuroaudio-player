import { describe, expect, it } from 'vitest'
import type { AudioProfesional, EnvioAudio } from '../audiosProfesional/modelo'
import { calcularAccesos } from './accesos'
import type { AccesoPrograma, ProgramaProfesional } from './modelo'

const bib = (id: string, extra: Partial<AudioProfesional> = {}) =>
  ({
    id,
    tipo: 'biblioteca',
    publicoEnAudios: false,
    enProgramaPublico: false,
    ...extra,
  }) as AudioProfesional
const general = (deMisAudios: string, estado: 'publicado' | 'borrador') =>
  ({
    id: `${deMisAudios}__general`,
    tipo: 'general',
    deMisAudios,
    estado,
  }) as AudioProfesional
const envio = (audioId: string, oyenteUid: string) =>
  ({ audioId, oyenteUid }) as EnvioAudio
const programa = (
  id: string,
  extra: Partial<ProgramaProfesional>,
): ProgramaProfesional =>
  ({
    id,
    estado: 'publicado',
    para: 'personas',
    pasos: [],
    ...extra,
  }) as ProgramaProfesional
const acceso = (programaId: string, oyenteUid: string) =>
  ({ programaId, oyenteUid }) as AccesoPrograma
const vinculo = (oyenteUid: string, audiosBiblioteca: string[] = []) => ({
  oyenteUid,
  audiosBiblioteca,
})

const vacio = {
  biblioteca: [] as AudioProfesional[],
  generales: [] as AudioProfesional[],
  envios: [] as EnvioAudio[],
  programas: [] as ProgramaProfesional[],
  accesos: [] as AccesoPrograma[],
  vinculos: [] as ReturnType<typeof vinculo>[],
}

describe('calcularAccesos', () => {
  it('repara lo anterior: los envíos van a la lista de cada vínculo', () => {
    const c = calcularAccesos({
      ...vacio,
      biblioteca: [bib('b1'), bib('b2')],
      envios: [envio('b1', 'ana'), envio('b2', 'ana'), envio('b1', 'luis')],
      vinculos: [vinculo('ana'), vinculo('luis'), vinculo('marta')],
    })
    expect(c.vinculos).toEqual([
      { oyenteUid: 'ana', audiosBiblioteca: ['b1', 'b2'] },
      { oyenteUid: 'luis', audiosBiblioteca: ['b1'] },
    ])
  })

  it('suma los pasos de sus programas privados publicados (no los de borrador ni los ajenos)', () => {
    const c = calcularAccesos({
      ...vacio,
      biblioteca: [bib('b1'), bib('b2'), bib('b3')],
      programas: [
        programa('p1', { pasos: ['b2', 'b3'] }),
        programa('p2', { estado: 'borrador', pasos: ['b1'] }),
      ],
      accesos: [acceso('p1', 'ana'), acceso('p2', 'ana'), acceso('p1', 'luis')],
      envios: [envio('b1', 'luis')],
      vinculos: [vinculo('ana'), vinculo('luis')],
    })
    expect(c.vinculos).toEqual([
      { oyenteUid: 'ana', audiosBiblioteca: ['b2', 'b3'] },
      { oyenteUid: 'luis', audiosBiblioteca: ['b1', 'b2', 'b3'] },
    ])
  })

  it('quita lo que ya no le toca (retirado, quitado del programa o borrado)', () => {
    const c = calcularAccesos({
      ...vacio,
      biblioteca: [bib('b1')],
      vinculos: [vinculo('ana', ['b1', 'borrado'])],
    })
    expect(c.vinculos).toEqual([{ oyenteUid: 'ana', audiosBiblioteca: [] }])
  })

  it('si ya cuadra (en cualquier orden), no escribe nada', () => {
    const c = calcularAccesos({
      ...vacio,
      biblioteca: [bib('b1'), bib('b2')],
      envios: [envio('b1', 'ana'), envio('b2', 'ana')],
      vinculos: [vinculo('ana', ['b2', 'b1'])],
    })
    expect(c).toEqual({ vinculos: [], audios: [] })
  })

  it('marcas: publicado en Audios y en un programa para todos publicado', () => {
    const c = calcularAccesos({
      ...vacio,
      biblioteca: [
        bib('b1'),
        bib('b2', { publicoEnAudios: true }),
        bib('b3'),
        bib('b4', { enProgramaPublico: true }),
      ],
      generales: [general('b1', 'publicado'), general('b2', 'borrador')],
      programas: [
        programa('todos', { para: 'todos', pasos: ['b3'] }),
        programa('todos-borrador', {
          para: 'todos',
          estado: 'borrador',
          pasos: ['b4'],
        }),
      ],
    })
    expect(c.audios).toEqual([
      { audioId: 'b1', publicoEnAudios: true, enProgramaPublico: false },
      { audioId: 'b2', publicoEnAudios: false, enProgramaPublico: false },
      { audioId: 'b3', publicoEnAudios: false, enProgramaPublico: true },
      { audioId: 'b4', publicoEnAudios: false, enProgramaPublico: false },
    ])
  })
})
