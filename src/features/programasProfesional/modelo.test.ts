import { describe, expect, it } from 'vitest'
import {
  completadosAlMarcar,
  diaUno,
  fechaDeApertura,
  pasosPorCalendario,
  situacionPrograma,
  textoRitmo,
  validarPrograma,
  type ProgramaProfesional,
} from './modelo'

const dia = (d: number, m = 10, h = 12) => new Date(2026, m, d, h)

const programa = (
  extra: Partial<ProgramaProfesional> = {},
): Pick<ProgramaProfesional, 'pasos' | 'apertura' | 'ritmo' | 'ritmoDias'> => ({
  pasos: ['a', 'b', 'c'],
  apertura: 'orden',
  ritmo: 'diario',
  ritmoDias: null,
  ...extra,
})

const estados = (s: ReturnType<typeof situacionPrograma>) =>
  s.pasos.map((p) => p.estado)

describe('situacionPrograma', () => {
  it('en orden: el 1 abierto y los demás cerrados; al completarlo se abre el 2', () => {
    const antes = situacionPrograma(programa(), [], null, dia(1))
    expect(estados(antes)).toEqual(['siguiente', 'cerrado', 'cerrado'])
    expect(antes.pasoActual).toBe(1)
    expect(antes.pasos[1]).toEqual({ estado: 'cerrado', trasPaso: 1 })
    const despues = situacionPrograma(programa(), ['a'], null, dia(1))
    expect(estados(despues)).toEqual(['completado', 'siguiente', 'cerrado'])
    expect(despues.pasoActual).toBe(2)
  })

  it('desmarcar no cierra nada: solo cambia cuál es el siguiente', () => {
    // Completó a y b (c abierto); desmarca a.
    const s = situacionPrograma(programa(), ['b'], null, dia(1))
    expect(estados(s)).toEqual(['siguiente', 'completado', 'abierto'])
    expect(s.pasoActual).toBe(1)
  })

  it('desmarcar el último completado tampoco cierra lo que abrió', () => {
    // Completó a (se abrió b) y lo desmarca: a vuelve a tocar y b sigue abierto.
    const lista = completadosAlMarcar(['a'], 'a', false)
    expect(lista).toEqual(['~a'])
    const s = situacionPrograma(programa(), lista, null, dia(1))
    expect(estados(s)).toEqual(['siguiente', 'abierto', 'cerrado'])
    expect(s.completados).toBe(0)
    // Y al volver a marcarlo, sin repetir.
    expect(completadosAlMarcar(lista, 'a', true)).toEqual(['a'])
    expect(completadosAlMarcar(['a'], 'a', true)).toEqual(['a'])
  })

  it('libre: todos abiertos', () => {
    const s = situacionPrograma(
      programa({ apertura: 'libre' }),
      [],
      null,
      dia(1),
    )
    expect(estados(s)).toEqual(['siguiente', 'abierto', 'abierto'])
  })

  it('todos completados: sin paso actual', () => {
    const s = situacionPrograma(programa(), ['a', 'b', 'c'], null, dia(1))
    expect(s.pasoActual).toBeNull()
    expect(s.completados).toBe(3)
  })

  it('al reordenar o quitar pasos, conserva lo completado y sigue por el que falta', () => {
    const s = situacionPrograma(
      programa({ pasos: ['c', 'a', 'd'] }),
      ['a', 'b'],
      null,
      dia(1),
    )
    // c sin hacer: es el siguiente aunque a esté completado.
    expect(estados(s)).toEqual(['siguiente', 'completado', 'abierto'])
    expect(s.completados).toBe(1)
  })

  it('por calendario, diario: un paso por día desde su día 1 (con fecha de apertura)', () => {
    const p = programa({ apertura: 'calendario' })
    expect(
      estados(situacionPrograma(p, [], dia(1, 10, 9), dia(1, 10, 23))),
    ).toEqual(['siguiente', 'cerrado', 'cerrado'])
    const s = situacionPrograma(p, [], dia(1, 10, 23), dia(2, 10, 0))
    expect(estados(s)).toEqual(['siguiente', 'abierto', 'cerrado'])
    expect(s.pasos[2]).toEqual({
      estado: 'cerrado',
      abreEl: new Date(2026, 10, 3),
    })
    // Sin día 1 (aún no se sabe): todo cerrado.
    expect(estados(situacionPrograma(p, [], null, dia(5)))).toEqual([
      'cerrado',
      'cerrado',
      'cerrado',
    ])
  })
})

describe('calendario según el ritmo (los días de pausa cuentan)', () => {
  it('diario, semanal, cada N días y mensual', () => {
    const d1 = dia(1)
    expect(pasosPorCalendario(d1, dia(1), 'diario', null)).toBe(1)
    expect(pasosPorCalendario(d1, dia(4), 'diario', null)).toBe(4)
    expect(pasosPorCalendario(d1, dia(7), 'semanal', null)).toBe(1)
    expect(pasosPorCalendario(d1, dia(8), 'semanal', null)).toBe(2)
    expect(pasosPorCalendario(d1, dia(3), 'dias', 3)).toBe(1)
    expect(pasosPorCalendario(d1, dia(4), 'dias', 3)).toBe(2)
    expect(pasosPorCalendario(dia(15, 0), dia(14, 1), 'mensual', null)).toBe(1)
    expect(pasosPorCalendario(dia(15, 0), dia(15, 1), 'mensual', null)).toBe(2)
    // Antes de su día 1, ninguno.
    expect(pasosPorCalendario(dia(5), dia(4), 'diario', null)).toBe(0)
  })

  it('fecha en que se abre cada paso', () => {
    expect(fechaDeApertura(dia(1), 2, 'semanal', null)).toEqual(
      new Date(2026, 10, 15),
    )
    // Del 31 de enero: el 28 de febrero, y ese día ya cuenta como abierto.
    expect(fechaDeApertura(dia(31, 0), 1, 'mensual', null)).toEqual(
      new Date(2026, 1, 28),
    )
    expect(pasosPorCalendario(dia(31, 0), dia(28, 1), 'mensual', null)).toBe(2)
    expect(pasosPorCalendario(dia(31, 0), dia(27, 1), 'mensual', null)).toBe(1)
    expect(fechaDeApertura(dia(15, 11), 1, 'mensual', null)).toEqual(
      new Date(2027, 0, 15),
    )
  })
})

describe('diaUno', () => {
  it('privado: el día en que se lo dieron', () => {
    expect(
      diaUno({ para: 'personas', publicadoEn: dia(1) }, { accesoEn: dia(5) }),
    ).toEqual(dia(5))
  })

  it('para todos: lo más tardío entre la publicación y su vínculo', () => {
    const p = { para: 'todos' as const, publicadoEn: dia(10) }
    expect(diaUno(p, { vinculoCreadoEn: dia(1, 0) })).toEqual(dia(10))
    expect(diaUno(p, { vinculoCreadoEn: dia(12) })).toEqual(dia(12))
    expect(diaUno({ para: 'todos', publicadoEn: null }, {})).toBeNull()
  })
})

describe('textoRitmo y validarPrograma', () => {
  it('el ritmo como texto', () => {
    expect(textoRitmo('diario', null)).toBe('1 audio al día')
    expect(textoRitmo('semanal', null)).toBe('1 audio a la semana')
    expect(textoRitmo('mensual', null)).toBe('1 audio al mes')
    expect(textoRitmo('dias', 3)).toBe('1 audio cada 3 días')
  })

  it('los mismos límites que las reglas', () => {
    const base = {
      titulo: 'Dormir',
      descripcion: '',
      ritmo: 'diario' as const,
      ritmoDias: null,
      pasos: ['a'],
    }
    expect(validarPrograma(base, true)).toEqual([])
    expect(validarPrograma({ ...base, titulo: ' ' }, false)).toHaveLength(1)
    expect(validarPrograma({ ...base, pasos: ['a', 'a'] }, false)).toHaveLength(
      1,
    )
    expect(validarPrograma({ ...base, pasos: [] }, true)).toHaveLength(1)
    expect(validarPrograma({ ...base, pasos: [] }, false)).toEqual([])
    expect(
      validarPrograma({ ...base, ritmo: 'dias', ritmoDias: 0 }, false),
    ).toHaveLength(1)
  })
})
