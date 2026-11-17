import { describe, expect, it } from 'vitest'
import {
  modoContrario,
  modoEfectivo,
  preferenciaDesdeGuardado,
} from './modoColor'
import { crearTemaProfesional } from './profesionalTheme'
describe('apariencia del panel', () => {
  it('sin nada guardado, o con un valor raro, el panel es claro', () => {
    expect(preferenciaDesdeGuardado(null)).toBe('light')
    expect(preferenciaDesdeGuardado('')).toBe('light')
    expect(preferenciaDesdeGuardado('DARK')).toBe('light')
    expect(preferenciaDesdeGuardado('Sistema')).toBe('light')
    expect(preferenciaDesdeGuardado('light')).toBe('light')
  })

  it('recuerda el oscuro y el del sistema', () => {
    expect(preferenciaDesdeGuardado('dark')).toBe('dark')
    expect(preferenciaDesdeGuardado('sistema')).toBe('sistema')
  })

  it('«Sistema» sigue al dispositivo', () => {
    expect(modoEfectivo('sistema', true)).toBe('dark')
    expect(modoEfectivo('sistema', false)).toBe('light')
  })

  it('«Claro» y «Oscuro» no dependen del dispositivo', () => {
    expect(modoEfectivo('light', true)).toBe('light')
    expect(modoEfectivo('dark', false)).toBe('dark')
  })

  it('el botón de la luna alterna entre los dos (desde lo que se ve)', () => {
    expect(modoContrario('light')).toBe('dark')
    expect(modoContrario('dark')).toBe('light')
    // Con «Sistema» y el dispositivo en oscuro, la luna pasa a claro.
    expect(modoContrario(modoEfectivo('sistema', true))).toBe('light')
  })
})

describe('temas del panel', () => {
  it('el claro conserva los colores de siempre', () => {
    const t = crearTemaProfesional('light')
    expect(t.palette.mode).toBe('light')
    expect(t.palette.primary.main).toBe('#1a73e8')
    expect(t.palette.background.default).toBe('#f8f9fa')
    expect(t.palette.background.paper).toBe('#ffffff')
    expect(t.palette.text.primary).toBe('#202124')
  })

  it('el oscuro cambia fondos, textos y azul', () => {
    const t = crearTemaProfesional('dark')
    expect(t.palette.mode).toBe('dark')
    expect(t.palette.background.default).toBe('#131314')
    expect(t.palette.background.paper).toBe('#1e1f20')
    expect(t.palette.text.primary).toBe('#e3e3e3')
    expect(t.palette.primary.main).toBe('#a8c7fa')
  })

  it('en los dos temas, el seleccionado se lee (contraste ≥ 4,5:1)', () => {
    for (const modo of ['light', 'dark'] as const) {
      const t = crearTemaProfesional(modo)
      expect(
        contraste(t.palette.primary.dark, t.palette.primary.light),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contraste(t.palette.text.primary, t.palette.background.paper),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contraste(t.palette.text.secondary, t.palette.background.default),
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contraste(t.palette.pro.verdeTexto, t.palette.pro.verdeFondo),
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
