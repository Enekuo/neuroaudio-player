import { describe, expect, it } from 'vitest'
import { textoIdentificacionEmpresa } from '../../config/empresa'
import {
  DOCUMENTOS_LEGALES,
  buscarDocumentoLegal,
  rutaLegal,
} from './documentos'
import {
  analizarTexto,
  huecosPendientes,
  partesEnLinea,
  rellenarDatosEmpresa,
} from './formato'

describe('documentos legales', () => {
  it('encuentra cada página por su ruta', () => {
    expect(buscarDocumentoLegal('cookies')?.titulo).toBe('Política de cookies')
    expect(buscarDocumentoLegal('normas')?.titulo).toBe(
      'Normas de la comunidad',
    )
    expect(rutaLegal('aviso-legal')).toBe('/legal/aviso-legal')
  })

  it('no inventa páginas que no existen', () => {
    expect(buscarDocumentoLegal('otra')).toBeNull()
    expect(buscarDocumentoLegal(undefined)).toBeNull()
  })

  it('las cinco tienen texto y ninguna dice «en preparación»', () => {
    expect(DOCUMENTOS_LEGALES.map((d) => d.slug)).toEqual([
      'aviso-legal',
      'privacidad',
      'cookies',
      'terminos',
      'normas',
    ])
    for (const d of DOCUMENTOS_LEGALES) {
      expect(d.texto).not.toMatch(/en preparación/)
      expect(analizarTexto(d.texto).length).toBeGreaterThan(3)
    }
  })

  it('las tablas tienen el mismo número de columnas en cada fila', () => {
    for (const d of DOCUMENTOS_LEGALES) {
      for (const b of analizarTexto(d.texto)) {
        if (b.tipo !== 'tabla') continue
        for (const fila of b.filas) expect(fila).toHaveLength(b.cabecera.length)
      }
    }
  })
})

describe('formato de los textos', () => {
  it('títulos, listas, numeradas, tablas y párrafos', () => {
    const bloques = analizarTexto(
      '### Uno\n\n- a\n- b\n\n1. x\n2. y\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nTexto\nseguido',
    )
    expect(bloques).toEqual([
      { tipo: 'titulo', texto: 'Uno' },
      { tipo: 'lista', numerada: false, elementos: ['a', 'b'] },
      { tipo: 'lista', numerada: true, elementos: ['x', 'y'] },
      { tipo: 'tabla', cabecera: ['A', 'B'], filas: [['1', '2']] },
      { tipo: 'parrafo', texto: 'Texto seguido' },
    ])
  })

  it('negrita sin interpretar HTML', () => {
    expect(partesEnLinea('**1. Qué.** Una <b>app</b>')).toEqual([
      { texto: '1. Qué.', negrita: true },
      { texto: ' Una <b>app</b>', negrita: false },
    ])
  })

  it('pone razón social y NIF solo cuando están rellenos', () => {
    const t = 'Titular: [nombre o razón social]\nNIF o CIF: [ ]\nNIF [ ], domicilio [ ]'
    expect(rellenarDatosEmpresa(t, { razonSocial: '', nif: '' })).toBe(t)
    expect(
      rellenarDatosEmpresa(t, { razonSocial: 'Ejemplo S.L.', nif: 'B1' }),
    ).toBe('Titular: Ejemplo S.L.\nNIF o CIF: B1\nNIF B1, domicilio [ ]')
  })

  it('encuentra los huecos pendientes', () => {
    expect(huecosPendientes('a [fecha] b [ ] c')).toEqual(['[fecha]', '[ ]'])
    expect(huecosPendientes('sin huecos')).toEqual([])
  })
})

describe('datos de la empresa en el pie', () => {
  it('sin datos no muestra nada', () => {
    expect(textoIdentificacionEmpresa({ razonSocial: '', nif: ' ' })).toBe('')
  })

  it('con datos, razón social y NIF', () => {
    expect(
      textoIdentificacionEmpresa({ razonSocial: 'Ejemplo S.L.', nif: 'B1' }),
    ).toBe('Ejemplo S.L. · NIF B1')
    expect(textoIdentificacionEmpresa({ razonSocial: '', nif: 'B1' })).toBe(
      'NIF B1',
    )
  })
})
