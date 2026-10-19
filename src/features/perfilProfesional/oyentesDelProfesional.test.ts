import { describe, expect, it } from 'vitest'
import {
  oyenteDesdeVinculo,
  ordenarOyentes,
  type OyenteDelProfesional,
} from './modelo'

// Un Timestamp de Firestore, a efectos de lectura.
const ts = (d: Date) => ({ toDate: () => d })

describe('oyenteDesdeVinculo', () => {
  it('lee nombre, estado, correo y fechas', () => {
    expect(
      oyenteDesdeVinculo({
        profesionalUid: 'pro',
        oyenteUid: 'ana',
        estado: 'pausado',
        oyenteNombre: 'Ana Gil',
        oyenteEmail: '  ana@gmail.com ',
        creadoEn: ts(new Date(2026, 0, 2)),
        estadoCambiadoEn: ts(new Date(2026, 9, 1)),
      }),
    ).toEqual({
      oyenteUid: 'ana',
      nombre: 'Ana Gil',
      estado: 'pausado',
      email: 'ana@gmail.com',
      creadoEn: new Date(2026, 0, 2),
      estadoCambiadoEn: new Date(2026, 9, 1),
    })
  })

  it('con datos que faltan o mal escritos a mano, quedan vacíos', () => {
    expect(
      oyenteDesdeVinculo({
        oyenteUid: 'ana',
        estado: 'activo',
        oyenteEmail: 7,
        creadoEn: '2026-01-02',
      }),
    ).toEqual({
      oyenteUid: 'ana',
      nombre: '',
      estado: 'activo',
      email: '',
      creadoEn: null,
      estadoCambiadoEn: null,
    })
  })

  it('un estado desconocido cuenta como en pausa (no ve nada)', () => {
    expect(oyenteDesdeVinculo({ oyenteUid: 'a', estado: 'baja' })?.estado).toBe(
      'pausado',
    )
  })

  it('sin oyente, no es un oyente', () => {
    expect(oyenteDesdeVinculo({ estado: 'activo' })).toBeNull()
    expect(oyenteDesdeVinculo({ oyenteUid: '' })).toBeNull()
  })
})

describe('ordenarOyentes', () => {
  const o = (
    oyenteUid: string,
    nombre: string,
    creadoEn: Date | null,
  ): OyenteDelProfesional => ({
    oyenteUid,
    nombre,
    estado: 'activo',
    email: '',
    creadoEn,
    estadoCambiadoEn: null,
  })

  it('del más reciente al más antiguo; sin fecha, al final y por nombre', () => {
    const lista = [
      o('1', 'Zoe', null),
      o('2', 'Ana', new Date(2026, 0, 1)),
      o('3', 'Luis', new Date(2026, 5, 1)),
      o('4', 'Bea', null),
    ]
    expect(ordenarOyentes(lista).map((x) => x.nombre)).toEqual([
      'Luis',
      'Ana',
      'Bea',
      'Zoe',
    ])
    // No cambia la lista original.
    expect(lista[0].nombre).toBe('Zoe')
  })
})
