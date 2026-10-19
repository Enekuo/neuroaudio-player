import { describe, expect, it } from 'vitest'
import { etiquetaOyente } from './modelo'

describe('etiquetaOyente', () => {
  it('usa el nombre del vínculo (oyenteNombre) si lo hay', () => {
    expect(
      etiquetaOyente({ oyenteUid: 'abc123xyz', nombre: ' Ana Gil ' }),
    ).toBe('Ana Gil')
  })

  it('sin nombre: «Oyente» y los 4 últimos caracteres del uid, en mayúsculas', () => {
    expect(etiquetaOyente({ oyenteUid: 'Kq81zXa97f3k', nombre: '' })).toBe(
      'Oyente 7F3K',
    )
    expect(etiquetaOyente({ oyenteUid: 'Kq81zXa97f3k', nombre: '   ' })).toBe(
      'Oyente 7F3K',
    )
  })
})
