import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MOSTRAR_TODOS_LOS_PROFESIONALES } from './modoProfesionales'

// PRUEBA TEMPORAL: el interruptor del código y las reglas de la raíz (las que
// se despliegan) tienen que ir a la vez. Ver reglas/LEEME.md.
const modo = MOSTRAR_TODOS_LOS_PROFESIONALES ? 'todos' : 'solo-vinculados'
const leer = (ruta: string) => readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n')

describe(`reglas en modo «${modo}»`, () => {
  it('firestore.rules es la versión de este modo', () => {
    expect(leer('firestore.rules')).toBe(leer(`reglas/firestore.${modo}.rules`))
  })

  it('storage.rules es la versión de este modo', () => {
    expect(leer('storage.rules')).toBe(leer(`reglas/storage.${modo}.rules`))
  })
})

describe('las dos versiones solo se diferencian en el perfil y sus fotos', () => {
  // Quita la cabecera de modo y el bloque marcado; el resto (audios,
  // vínculos, límites, biblioteca…) debe ser idéntico.
  const resto = (texto: string, bloque: RegExp) =>
    texto
      .replace(/^\/\/ MODO[\s\S]*?\n\n/m, '')
      .replace(bloque, '')

  it('firestore.rules', () => {
    const bloque = /\n {4}\/\/ [^\n]*\n(?: {4}\/\/[^\n]*\n)*\s*match \/perfilesProfesionales\/\{profesionalUid\} \{\n {6}allow read:[^;]*;/
    expect(resto(leer('reglas/firestore.todos.rules'), bloque)).toBe(
      resto(leer('reglas/firestore.solo-vinculados.rules'), bloque),
    )
  })

  it('storage.rules', () => {
    const bloque = /\n {4}\/\/ perfiles\/\{uid\}[\s\S]*?allow read:[^;]*;/
    expect(resto(leer('reglas/storage.todos.rules'), bloque)).toBe(
      resto(leer('reglas/storage.solo-vinculados.rules'), bloque),
    )
  })
})
