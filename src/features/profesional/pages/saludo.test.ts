import { describe, expect, it } from 'vitest'
import { nombreDelSaludo } from './saludo'

describe('nombreDelSaludo', () => {
  it('primero, «¿Cómo quieres que te llamemos?»', () => {
    expect(nombreDelSaludo('Lu', 'Lucía', 'Lucía Ferrer')).toBe('Lu')
  })

  it('si está vacío, el nombre del perfil profesional', () => {
    expect(nombreDelSaludo('  ', 'Lucía', 'Eneko Aramberri')).toBe('Lucía')
    expect(nombreDelSaludo(null, 'Lucía', 'Eneko Aramberri')).toBe('Lucía')
  })

  it('sin perfil profesional, el primer nombre de Google', () => {
    expect(nombreDelSaludo('', null, 'Eneko Aramberri')).toBe('Eneko')
    expect(nombreDelSaludo(undefined, '  ', ' Eneko Aramberri')).toBe('Eneko')
  })

  it('sin ninguno, null', () => {
    expect(nombreDelSaludo(null, null, null)).toBeNull()
  })
})
