import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  MAX_LISTAS_PROPIAS,
  PLANTILLAS_LISTA,
  audiosVisibles,
  huecoListaPropia,
  idListaPlantilla,
  idListaPropia,
  nombreLista,
  plantillasLibres,
  validarLista,
} from './modelo'

describe('ids de lista', () => {
  it('una por plantilla y profesional', () => {
    expect(idListaPlantilla('pro', 'dormir')).toBe('pro__plantilla__dormir')
  })

  it('las propias usan el primer hueco libre, hasta el máximo', () => {
    expect(huecoListaPropia('pro', [])).toBe('pro__propia__1')
    expect(
      huecoListaPropia('pro', [
        { id: 'pro__propia__1' },
        { id: 'pro__propia__3' },
      ]),
    ).toBe('pro__propia__2')
    const llenas = Array.from({ length: MAX_LISTAS_PROPIAS }, (_, i) => ({
      id: idListaPropia('pro', i + 1),
    }))
    expect(huecoListaPropia('pro', llenas)).toBeNull()
  })

  it('las plantillas ya usadas no se ofrecen otra vez', () => {
    const libres = plantillasLibres([
      { plantillaId: 'dormir' },
      { plantillaId: null },
    ])
    expect(libres.map((p) => p.id)).not.toContain('dormir')
    expect(libres).toHaveLength(PLANTILLAS_LISTA.length - 1)
  })
})

describe('nombre y audios visibles', () => {
  it('la de plantilla se llama como la plantilla; la propia, como su título', () => {
    expect(nombreLista({ plantillaId: 'dormir', titulo: '' })).toBe(
      'Para dormir',
    )
    expect(nombreLista({ plantillaId: null, titulo: 'Mi lista' })).toBe(
      'Mi lista',
    )
  })

  it('solo los audios disponibles (publicados), en el orden de la lista', () => {
    expect(
      audiosVisibles({ audios: ['c', 'a', 'b'] }, new Set(['a', 'c'])),
    ).toEqual(['c', 'a'])
  })
})

describe('validarLista', () => {
  const base = {
    titulo: 'Mi lista',
    descripcion: '',
    audios: ['a'],
    plantillaId: null,
  }
  it('acepta una lista correcta', () => {
    expect(validarLista(base)).toEqual([])
  })
  it('la propia necesita nombre; la de plantilla, no', () => {
    expect(validarLista({ ...base, titulo: '  ' })).toHaveLength(1)
    expect(
      validarLista({ ...base, titulo: '', plantillaId: 'dormir' }),
    ).toEqual([])
  })
  it('límites y audios repetidos', () => {
    expect(validarLista({ ...base, titulo: 'a'.repeat(81) })).toHaveLength(1)
    expect(
      validarLista({ ...base, descripcion: 'a'.repeat(2001) }),
    ).toHaveLength(1)
    expect(
      validarLista({
        ...base,
        audios: Array.from({ length: 101 }, (_, i) => `a${i}`),
      }),
    ).toHaveLength(1)
    expect(validarLista({ ...base, audios: ['a', 'a'] })).toHaveLength(1)
  })
})

describe('las reglas usan los mismos datos que el código', () => {
  for (const archivo of [
    'reglas/firestore.todos.rules',
    'reglas/firestore.solo-vinculados.rules',
  ]) {
    const reglas = readFileSync(archivo, 'utf8')
    it(`${archivo}: las mismas 8 plantillas`, () => {
      const bloque =
        reglas.match(/function plantillaListaValida[\s\S]*?\];/)?.[0] ?? ''
      const ids = [...bloque.matchAll(/'([a-z]+)'/g)].map((m) => m[1])
      expect(ids.sort()).toEqual([...PLANTILLAS_LISTA].sort())
    })
    it(`${archivo}: como mucho ${MAX_LISTAS_PROPIAS} listas propias`, () => {
      expect(reglas).toContain(
        `__propia__([1-9]|[12][0-9]|${MAX_LISTAS_PROPIAS})`,
      )
    })
  }
})
