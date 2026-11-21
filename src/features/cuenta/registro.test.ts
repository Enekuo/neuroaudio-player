import { describe, expect, it } from 'vitest'
import {
  CODIGOS_PAIS,
  FORMULARIO_VACIO,
  datosProfesionalDe,
  paisDelNavegador,
  paisesEnEspanol,
  registroValido,
  validarRegistroProfesional,
  type FormularioProfesional,
} from './registro'

const valido: FormularioProfesional = {
  nombre: 'Lucía Ferrer',
  dedicacion: 'hipnosis',
  dedicacionOtra: '',
  pais: 'ES',
  clientes: '',
  aceptaTerminos: true,
  novedades: false,
}

const errores = (cambios: Partial<FormularioProfesional>) =>
  validarRegistroProfesional({ ...valido, ...cambios })

describe('validarRegistroProfesional', () => {
  it('un formulario completo es válido (clientes y novedades son opcionales)', () => {
    expect(errores({})).toEqual({})
    expect(registroValido(valido)).toBe(true)
    expect(registroValido({ ...valido, clientes: '51-200', novedades: true })).toBe(true)
  })

  it('el formulario vacío pide todo lo obligatorio', () => {
    expect(Object.keys(validarRegistroProfesional(FORMULARIO_VACIO)).sort()).toEqual(
      ['aceptaTerminos', 'dedicacion', 'nombre', 'pais'],
    )
    expect(registroValido(FORMULARIO_VACIO)).toBe(false)
  })

  it('nombre profesional: obligatorio, de 2 a 80 caracteres (sin contar espacios de los lados)', () => {
    expect(errores({ nombre: '   ' }).nombre).toBe('Escribe tu nombre profesional.')
    expect(errores({ nombre: ' L ' }).nombre).toBe('Escribe al menos 2 caracteres.')
    expect(errores({ nombre: 'Lu' }).nombre).toBeUndefined()
    expect(errores({ nombre: 'x'.repeat(80) }).nombre).toBeUndefined()
    expect(errores({ nombre: 'x'.repeat(81) }).nombre).toBe('Como mucho 80 caracteres.')
  })

  it('a qué te dedicas: una de las pastillas; con «Otro», de 2 a 60 caracteres', () => {
    expect(errores({ dedicacion: '' }).dedicacion).toBe('Elige a qué te dedicas.')
    expect(errores({ dedicacion: 'tarot' }).dedicacion).toBe('Elige a qué te dedicas.')
    for (const d of ['hipnosis', 'meditacion', 'coaching', 'psicologia']) {
      expect(errores({ dedicacion: d })).toEqual({})
    }
    expect(errores({ dedicacion: 'otro' }).dedicacionOtra).toBe('Escribe a qué te dedicas.')
    expect(errores({ dedicacion: 'otro', dedicacionOtra: 'R' }).dedicacionOtra).toBe(
      'Escribe al menos 2 caracteres.',
    )
    expect(
      errores({ dedicacion: 'otro', dedicacionOtra: 'x'.repeat(61) }).dedicacionOtra,
    ).toBe('Como mucho 60 caracteres.')
    expect(errores({ dedicacion: 'otro', dedicacionOtra: 'Reiki' })).toEqual({})
    // Sin «Otro», el texto no cuenta.
    expect(errores({ dedicacionOtra: 'x' })).toEqual({})
  })

  it('país: uno de la lista', () => {
    expect(errores({ pais: '' }).pais).toBe('Elige tu país.')
    expect(errores({ pais: 'XX' }).pais).toBe('Elige tu país.')
    expect(errores({ pais: 'es' }).pais).toBe('Elige tu país.')
    expect(errores({ pais: 'MX' })).toEqual({})
  })

  it('clientes: opcional, pero si se elige, una de las opciones', () => {
    for (const c of ['', '1-10', '11-50', '51-200', '200+']) {
      expect(errores({ clientes: c })).toEqual({})
    }
    expect(errores({ clientes: '1000' }).clientes).toBe('Elige una de las opciones.')
  })

  it('hay que aceptar los términos y confirmar la mayoría de edad', () => {
    expect(errores({ aceptaTerminos: false }).aceptaTerminos).toBe(
      'Tienes que aceptar los términos y confirmar que eres mayor de edad.',
    )
  })
})

describe('datosProfesionalDe', () => {
  it('guarda los datos limpios; dedicacionOtra y clientes, null si no van', () => {
    expect(datosProfesionalDe({ ...valido, nombre: '  Lucía  ' })).toEqual({
      nombre: 'Lucía',
      dedicacion: 'hipnosis',
      dedicacionOtra: null,
      pais: 'ES',
      clientes: null,
    })
    expect(
      datosProfesionalDe({
        ...valido,
        dedicacion: 'otro',
        dedicacionOtra: ' Reiki ',
        clientes: '11-50',
      }),
    ).toMatchObject({ dedicacion: 'otro', dedicacionOtra: 'Reiki', clientes: '11-50' })
  })

  it('no guarda los consentimientos dentro de los datos (van aparte, con su fecha)', () => {
    const datos = datosProfesionalDe({ ...valido, novedades: true })
    expect(Object.keys(datos).sort()).toEqual(
      ['clientes', 'dedicacion', 'dedicacionOtra', 'nombre', 'pais'],
    )
  })
})

describe('países', () => {
  it('todos los códigos son ISO de dos letras, sin repetir', () => {
    expect(CODIGOS_PAIS.length).toBeGreaterThan(240)
    expect(new Set(CODIGOS_PAIS).size).toBe(CODIGOS_PAIS.length)
    for (const c of CODIGOS_PAIS) expect(c).toMatch(/^[A-Z]{2}$/)
  })

  it('salen en español y por orden alfabético', () => {
    const paises = paisesEnEspanol()
    expect(paises).toHaveLength(CODIGOS_PAIS.length)
    expect(paises.find((p) => p.codigo === 'ES')?.nombre).toBe('España')
    expect(paises.find((p) => p.codigo === 'DE')?.nombre).toBe('Alemania')
    const nombres = paises.map((p) => p.nombre)
    expect([...nombres].sort((a, b) => a.localeCompare(b, 'es'))).toEqual(nombres)
  })

  it('el país del navegador sale de sus idiomas', () => {
    expect(paisDelNavegador(['es-ES', 'en'])).toBe('ES')
    expect(paisDelNavegador(['es', 'es-MX'])).toBe('MX')
    expect(paisDelNavegador(['zh-Hant-TW'])).toBe('TW')
    expect(paisDelNavegador(['en_us'])).toBe('US')
    expect(paisDelNavegador(['es-419'])).toBe('')
    expect(paisDelNavegador(['es'])).toBe('')
    expect(paisDelNavegador([])).toBe('')
  })
})
