import { describe, expect, it } from 'vitest'
import {
  CADUCIDAD_MS,
  CLAVE_CONTINUAR,
  MAX_POSICIONES,
  PREFIJO_POSICIONES,
  anotarPosicion,
  borrarPosicionesDe,
  continuarActivado,
  guardarContinuarActivado,
  guardarPosicion,
  leerPosiciones,
  leerPosicionesDeTexto,
  minutosYSegundos,
  posicionParaPreguntar,
  quedaAMedias,
} from './posiciones'

const AHORA = 1_800_000_000_000
const DIA = 24 * 60 * 60 * 1000

/** Almacén en memoria con la misma forma que localStorage. */
function almacenFalso() {
  const datos = new Map<string, string>()
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  }
}

describe('cuándo se pregunta', () => {
  it('a medias: pasados 30 s y con más de 30 s por delante', () => {
    expect(quedaAMedias(30, 600)).toBe(true)
    expect(quedaAMedias(300, 600)).toBe(true)
    expect(quedaAMedias(570, 600)).toBe(true)
  })

  it('no, en los primeros 30 s', () => {
    expect(quedaAMedias(0, 600)).toBe(false)
    expect(quedaAMedias(29.9, 600)).toBe(false)
  })

  it('no, si faltaban menos de 30 s o se terminó', () => {
    expect(quedaAMedias(571, 600)).toBe(false)
    expect(quedaAMedias(599, 600)).toBe(false)
    expect(quedaAMedias(600, 600)).toBe(false)
  })

  it('sin duración conocida, basta con pasar de 30 s', () => {
    expect(quedaAMedias(45, 0)).toBe(true)
    expect(quedaAMedias(45, Number.NaN)).toBe(true)
    expect(quedaAMedias(10, 0)).toBe(false)
  })

  it('pregunta por la posición guardada; si no hay o no vale, no', () => {
    const pos = anotarPosicion({}, 'a1', 125.7, 600, AHORA)
    expect(posicionParaPreguntar(pos, 'a1', AHORA)).toBe(125)
    expect(posicionParaPreguntar(pos, 'otro', AHORA)).toBeNull()
  })

  it('al terminar o al quedarse al principio, se borra (la próxima vez, desde el principio)', () => {
    let pos = anotarPosicion({}, 'a1', 300, 600, AHORA)
    pos = anotarPosicion(pos, 'a1', 600, 600, AHORA + 1)
    expect(pos.a1).toBeUndefined()
    pos = anotarPosicion(pos, 'a2', 300, 600, AHORA)
    pos = anotarPosicion(pos, 'a2', 12, 600, AHORA + 1)
    expect(pos.a2).toBeUndefined()
  })

  it('formato mm:ss', () => {
    expect(minutosYSegundos(125)).toBe('02:05')
    expect(minutosYSegundos(59.9)).toBe('00:59')
    expect(minutosYSegundos(3725)).toBe('1:02:05')
  })
})

describe('límite de 50 y caducidad de 30 días', () => {
  it('guarda como mucho las 50 más recientes', () => {
    let pos = {}
    for (let i = 0; i < 60; i++) {
      pos = anotarPosicion(pos, `a${i}`, 100, 600, AHORA + i)
    }
    const ids = Object.keys(pos)
    expect(ids).toHaveLength(MAX_POSICIONES)
    // Se van las 10 más antiguas.
    expect(ids).not.toContain('a0')
    expect(ids).not.toContain('a9')
    expect(ids).toContain('a10')
    expect(ids).toContain('a59')
  })

  it('volver a guardar una vieja la hace reciente', () => {
    let pos = {}
    for (let i = 0; i < 50; i++)
      pos = anotarPosicion(pos, `a${i}`, 100, 600, AHORA + i)
    pos = anotarPosicion(pos, 'a0', 200, 600, AHORA + 100)
    pos = anotarPosicion(pos, 'nuevo', 100, 600, AHORA + 101)
    expect(Object.keys(pos)).toContain('a0')
    expect(Object.keys(pos)).not.toContain('a1')
  })

  it('las de más de 30 días ni se preguntan ni se guardan', () => {
    const pos = anotarPosicion({}, 'viejo', 300, 600, AHORA)
    expect(posicionParaPreguntar(pos, 'viejo', AHORA + CADUCIDAD_MS)).toBe(300)
    expect(
      posicionParaPreguntar(pos, 'viejo', AHORA + CADUCIDAD_MS + 1),
    ).toBeNull()
    const despues = anotarPosicion(pos, 'nuevo', 100, 600, AHORA + 31 * DIA)
    expect(Object.keys(despues)).toEqual(['nuevo'])
  })
})

describe('en el dispositivo', () => {
  it('el ajuste viene desactivado y se recuerda', () => {
    const a = almacenFalso()
    expect(continuarActivado(a)).toBe(false)
    guardarContinuarActivado(true, a)
    expect(a.datos.get(CLAVE_CONTINUAR)).toBe('true')
    expect(continuarActivado(a)).toBe(true)
    guardarContinuarActivado(false, a)
    expect(continuarActivado(a)).toBe(false)
  })

  it('una lista de posiciones por usuario', () => {
    const a = almacenFalso()
    guardarPosicion('ana', 'a1', 100, 600, AHORA, a)
    guardarPosicion('luis', 'a1', 200, 600, AHORA, a)
    expect(leerPosiciones('ana', a).a1.t).toBe(100)
    expect(leerPosiciones('luis', a).a1.t).toBe(200)
    expect([...a.datos.keys()].sort()).toEqual([
      `${PREFIJO_POSICIONES}ana`,
      `${PREFIJO_POSICIONES}luis`,
    ])
  })

  it('al cerrar sesión se borran las de ese usuario, y solo las suyas', () => {
    const a = almacenFalso()
    guardarContinuarActivado(true, a)
    guardarPosicion('ana', 'a1', 100, 600, AHORA, a)
    guardarPosicion('luis', 'a1', 200, 600, AHORA, a)
    borrarPosicionesDe('ana', a)
    expect(leerPosiciones('ana', a)).toEqual({})
    expect(leerPosiciones('luis', a).a1.t).toBe(200)
    // El ajuste es del dispositivo: no se toca.
    expect(continuarActivado(a)).toBe(true)
  })

  it('si no queda ninguna, no deja la clave vacía', () => {
    const a = almacenFalso()
    guardarPosicion('ana', 'a1', 100, 600, AHORA, a)
    guardarPosicion('ana', 'a1', 600, 600, AHORA, a)
    expect(a.datos.has(`${PREFIJO_POSICIONES}ana`)).toBe(false)
  })

  it('lo guardado roto o raro se ignora', () => {
    expect(leerPosicionesDeTexto('{roto')).toEqual({})
    expect(leerPosicionesDeTexto('[1,2]')).toEqual({})
    expect(
      leerPosicionesDeTexto(
        JSON.stringify({ ok: { t: 40, d: 600, f: 1 }, malo: { t: 'x' } }),
      ),
    ).toEqual({ ok: { t: 40, d: 600, f: 1 } })
  })

  it('sin almacenamiento disponible, no falla', () => {
    expect(continuarActivado(null)).toBe(false)
    expect(leerPosiciones('ana', null)).toEqual({})
    expect(() =>
      guardarPosicion('ana', 'a1', 100, 600, AHORA, null),
    ).not.toThrow()
  })
})
