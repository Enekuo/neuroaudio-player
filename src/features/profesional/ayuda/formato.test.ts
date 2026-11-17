import { describe, expect, it } from 'vitest'
import { textoPasos, trozosDeTexto } from './formato'

describe('ayuda: términos «entre comillas»', () => {
  it('separa los términos del texto normal y conserva las comillas', () => {
    expect(
      trozosDeTexto('Pulsa «Editar perfil» y luego «Guardar cambios».'),
    ).toEqual([
      { texto: 'Pulsa ', termino: false },
      { texto: '«Editar perfil»', termino: true },
      { texto: ' y luego ', termino: false },
      { texto: '«Guardar cambios»', termino: true },
      { texto: '.', termino: false },
    ])
  })

  it('sin comillas, un solo trozo normal', () => {
    expect(trozosDeTexto('Caben 200 audios.')).toEqual([
      { texto: 'Caben 200 audios.', termino: false },
    ])
  })

  it('al unir los trozos sale el texto original, letra por letra', () => {
    const t = '«Libre»: todos los pasos. Una «sin cerrar y «otra».'
    expect(
      trozosDeTexto(t)
        .map((x) => x.texto)
        .join(''),
    ).toBe(t)
  })

  it('una comilla sin cerrar no se resalta', () => {
    expect(trozosDeTexto('Una «sin cerrar').every((x) => !x.termino)).toBe(true)
  })
})

describe('ayuda: número de pasos', () => {
  it('singular y plural', () => {
    expect(textoPasos(1)).toBe('1 paso')
    expect(textoPasos(7)).toBe('7 pasos')
  })
})
