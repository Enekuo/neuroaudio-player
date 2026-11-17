import { describe, expect, it } from 'vitest'
import { alternarPanel } from './utilidades'

describe('barra de utilidades: un panel abierto a la vez', () => {
  it('con todo cerrado, el botón abre su panel', () => {
    expect(alternarPanel(null, 'ayuda')).toBe('ayuda')
    expect(alternarPanel(null, 'soporte')).toBe('soporte')
  })

  it('abrir uno cierra el otro', () => {
    expect(alternarPanel('ayuda', 'soporte')).toBe('soporte')
    expect(alternarPanel('soporte', 'ayuda')).toBe('ayuda')
  })

  it('pulsar el botón del panel abierto lo cierra', () => {
    expect(alternarPanel('ayuda', 'ayuda')).toBeNull()
    expect(alternarPanel('soporte', 'soporte')).toBeNull()
  })
})
