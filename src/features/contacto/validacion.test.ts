import { describe, expect, it } from 'vitest'
import {
  FORMULARIO_VACIO,
  LIMITES,
  pareceRobot,
  prepararMensaje,
  validarContacto,
  type FormularioContacto,
} from './validacion'

const bueno: FormularioContacto = {
  nombre: '  Ana  ',
  correo: ' ana@correo.com ',
  queEres: 'oyente',
  motivo: 'duda',
  mensaje: '  Hola, tengo una duda.  ',
  aceptoPrivacidad: true,
}

describe('validación del formulario de contacto', () => {
  it('un formulario correcto no tiene errores', () => {
    expect(validarContacto(bueno)).toEqual({})
    expect(validarContacto({ ...bueno, queEres: '', motivo: '' })).toEqual({})
  })

  it('vacío: pide nombre, correo, mensaje y aceptar la privacidad', () => {
    expect(Object.keys(validarContacto(FORMULARIO_VACIO)).sort()).toEqual([
      'aceptoPrivacidad',
      'correo',
      'mensaje',
      'nombre',
    ])
  })

  it('nombre: obligatorio y como máximo 100 caracteres', () => {
    expect(validarContacto({ ...bueno, nombre: '   ' }).nombre).toBeTruthy()
    expect(
      validarContacto({ ...bueno, nombre: 'a'.repeat(LIMITES.nombre) }).nombre,
    ).toBeUndefined()
    expect(
      validarContacto({ ...bueno, nombre: 'a'.repeat(LIMITES.nombre + 1) })
        .nombre,
    ).toMatch(/100/)
  })

  it('correo: formato válido y como máximo 200 caracteres', () => {
    for (const malo of ['ana', 'ana@', 'ana@correo', 'a na@correo.com', '@c.com'])
      expect(validarContacto({ ...bueno, correo: malo }).correo).toBeTruthy()
    const largo = 'a'.repeat(190) + '@correo.com'
    expect(validarContacto({ ...bueno, correo: largo }).correo).toMatch(/200/)
  })

  it('mensaje: entre 10 y 2000 caracteres (sin contar espacios de los lados)', () => {
    expect(validarContacto({ ...bueno, mensaje: '  123456789  ' }).mensaje).toMatch(/10/)
    expect(validarContacto({ ...bueno, mensaje: '1234567890' }).mensaje).toBeUndefined()
    expect(
      validarContacto({ ...bueno, mensaje: 'a'.repeat(LIMITES.mensajeMax + 1) })
        .mensaje,
    ).toMatch(/2000/)
  })

  it('listas: solo valores de la lista', () => {
    expect(validarContacto({ ...bueno, queEres: 'jefe' }).queEres).toBeTruthy()
    expect(validarContacto({ ...bueno, motivo: 'spam' }).motivo).toBeTruthy()
  })

  it('privacidad: hay que aceptarla', () => {
    expect(
      validarContacto({ ...bueno, aceptoPrivacidad: false }).aceptoPrivacidad,
    ).toBeTruthy()
  })
})

describe('mensaje que se guarda', () => {
  it('recorta los textos y usa null en las listas sin elegir', () => {
    expect(prepararMensaje(bueno)).toEqual({
      nombre: 'Ana',
      correo: 'ana@correo.com',
      queEres: 'oyente',
      motivo: 'duda',
      mensaje: 'Hola, tengo una duda.',
      aceptoPrivacidad: true,
    })
    const sinListas = prepararMensaje({ ...bueno, queEres: '', motivo: '' })
    expect(sinListas.queEres).toBeNull()
    expect(sinListas.motivo).toBeNull()
  })
})

describe('anti-spam', () => {
  it('campo trampa relleno o envío demasiado rápido', () => {
    expect(pareceRobot('', 5000)).toBe(false)
    expect(pareceRobot('http://spam', 5000)).toBe(true)
    expect(pareceRobot('', 800)).toBe(true)
  })
})
