import { describe, expect, it } from 'vitest'
import { formatearEspacio } from './formato'

// Intl separa número y unidad con un espacio que no se parte: se compara
// con espacios normales.
const espacio = (bytes: number, idioma?: string) =>
  formatearEspacio(bytes, idioma).replace(/\s/g, ' ')
const MB = 1024 * 1024

describe('formatearEspacio', () => {
  it('en español (idioma común): coma decimal; 2 decimales por debajo de 10 MB, 1 hasta 1 GB y GB después', () => {
    expect(espacio(0)).toBe('0 MB')
    expect(espacio(-5)).toBe('0 MB')
    expect(espacio(Number.NaN)).toBe('0 MB')
    expect(espacio(3 * MB)).toBe('3,00 MB')
    expect(espacio(63.5 * MB)).toBe('63,5 MB')
    expect(espacio(250 * MB)).toBe('250,0 MB')
    expect(espacio(1.5 * 1024 * MB)).toBe('1,50 GB')
  })

  it('cambia solo con el idioma (sin comas ni unidades escritas a mano)', () => {
    expect(espacio(63.5 * MB, 'en-US')).toBe('63.5 MB')
    expect(espacio(1.5 * 1024 * MB, 'en-US')).toBe('1.50 GB')
    expect(espacio(63.5 * MB, 'fr-FR')).toBe('63,5 Mo')
  })
})
