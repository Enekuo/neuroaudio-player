import { describe, expect, it } from 'vitest'
import {
  ZOOM_MAXIMO,
  encuadreInicial,
  esEncuadre,
  limitarEncuadre,
  moverEncuadre,
  recorteEnPixeles,
  zoomEncuadre,
} from './encuadre'

const dentro = (
  ancho: number,
  alto: number,
  r: { x: number; y: number; lado: number },
) =>
  r.x >= -1e-9 &&
  r.y >= -1e-9 &&
  r.x + r.lado <= ancho + 1e-9 &&
  r.y + r.lado <= alto + 1e-9

describe('encuadreInicial', () => {
  it('foto vertical: lado corto entero, centrada en horizontal y hacia arriba', () => {
    const e = encuadreInicial(1200, 1600)
    expect(e.zoom).toBe(1)
    expect(e.cx).toBeCloseTo(0.5)
    const r = recorteEnPixeles(1200, 1600, e)
    expect(r.lado).toBe(1200)
    expect(r.x).toBeCloseTo(0)
    // Sobran 400 px de alto: el recorte empieza al 20 % de ese hueco.
    expect(r.y).toBeCloseTo(80)
  })

  it('foto horizontal: centrada (no sobra alto)', () => {
    const r = recorteEnPixeles(1600, 900, encuadreInicial(1600, 900))
    expect(r).toEqual({ x: 350, y: 0, lado: 900 })
  })

  it('foto cuadrada: la imagen entera', () => {
    expect(recorteEnPixeles(800, 800, encuadreInicial(800, 800))).toEqual({
      x: 0,
      y: 0,
      lado: 800,
    })
  })
})

describe('limitarEncuadre', () => {
  it('nunca deja el recorte fuera de la imagen', () => {
    for (const [cx, cy, zoom] of [
      [0, 0, 1],
      [1, 1, 1],
      [-3, 7, 2.5],
      [0.99, 0.01, 4],
    ]) {
      const r = recorteEnPixeles(1000, 600, { cx, cy, zoom })
      expect(dentro(1000, 600, r)).toBe(true)
    }
  })

  it('el zoom no baja de 1 (lo justo para llenar el círculo) ni pasa del máximo', () => {
    expect(
      limitarEncuadre(1000, 600, { cx: 0.5, cy: 0.5, zoom: 0.2 }).zoom,
    ).toBe(1)
    expect(
      limitarEncuadre(1000, 600, { cx: 0.5, cy: 0.5, zoom: 99 }).zoom,
    ).toBe(ZOOM_MAXIMO)
  })

  it('valores rotos (NaN) vuelven a algo válido', () => {
    const e = limitarEncuadre(1000, 600, {
      cx: Number.NaN,
      cy: 0.5,
      zoom: Number.NaN,
    })
    expect(esEncuadre(e)).toBe(true)
  })
})

describe('mover y hacer zoom', () => {
  it('mover desplaza el recorte y se para en el borde', () => {
    const inicio = { cx: 0.5, cy: 0.5, zoom: 2 }
    const movido = moverEncuadre(1000, 1000, inicio, 100, 0)
    expect(recorteEnPixeles(1000, 1000, movido).x).toBeCloseTo(350)
    const alBorde = moverEncuadre(1000, 1000, inicio, 5000, 5000)
    expect(recorteEnPixeles(1000, 1000, alBorde)).toEqual({
      x: 500,
      y: 500,
      lado: 500,
    })
  })

  it('el zoom mantiene el centro si cabe', () => {
    const e = zoomEncuadre(1000, 1000, { cx: 0.4, cy: 0.6, zoom: 1.5 }, 3)
    expect(e.cx).toBeCloseTo(0.4)
    expect(e.cy).toBeCloseTo(0.6)
    expect(recorteEnPixeles(1000, 1000, e).lado).toBeCloseTo(1000 / 3)
  })

  it('al alejar el zoom, corrige el centro para no dejar hueco', () => {
    const e = zoomEncuadre(1000, 1000, { cx: 0.9, cy: 0.9, zoom: 4 }, 1)
    expect(recorteEnPixeles(1000, 1000, e)).toEqual({ x: 0, y: 0, lado: 1000 })
  })
})

describe('esEncuadre', () => {
  it('acepta solo encuadres con forma válida', () => {
    expect(esEncuadre({ cx: 0.5, cy: 0.3, zoom: 1.2 })).toBe(true)
    expect(esEncuadre({ cx: 1.5, cy: 0.3, zoom: 1 })).toBe(false)
    expect(esEncuadre({ cx: 0.5, cy: 0.3, zoom: 0.5 })).toBe(false)
    expect(esEncuadre({ cx: '0.5', cy: 0.3, zoom: 1 })).toBe(false)
    expect(esEncuadre(null)).toBe(false)
  })
})
