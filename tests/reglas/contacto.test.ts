// Tests de las reglas del formulario de contacto (mensajesContacto).
// Necesitan los emuladores (y Java):
//   npm run test:reglas
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { MODOS } from './modos'

let env: RulesTestEnvironment

const mensaje = (extra: Record<string, unknown> = {}) => ({
  nombre: 'Ana',
  correo: 'ana@correo.com',
  queEres: 'oyente',
  motivo: 'duda',
  mensaje: 'Hola, tengo una duda.',
  aceptoPrivacidad: true,
  creadoEn: serverTimestamp(),
  ...extra,
})

const sinSesion = () => env.unauthenticatedContext().firestore()
const conSesion = () => env.authenticatedContext('ana').firestore()
const crear = (datos: Record<string, unknown>, db = sinSesion()) =>
  addDoc(collection(db, 'mensajesContacto'), datos)

describe.each(MODOS)('modo «$nombre»', (modo) => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: 'demo-neuroaudio',
      firestore: { rules: readFileSync(modo.firestore, 'utf8') },
    })
  })

  afterAll(async () => {
    await env.cleanup()
  })

  beforeEach(async () => {
    await env.clearFirestore()
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'mensajesContacto', 'existente'), {
        ...mensaje(),
        creadoEn: Timestamp.now(),
      })
    })
  })

  describe('crear', () => {
    it('un visitante sin sesión puede enviar un mensaje correcto', async () => {
      await assertSucceeds(crear(mensaje()))
    })

    it('también con sesión', async () => {
      await assertSucceeds(crear(mensaje(), conSesion()))
    })

    it('las listas pueden ir sin elegir (null)', async () => {
      await assertSucceeds(crear(mensaje({ queEres: null, motivo: null })))
    })

    it('valores límite: nombre de 100, correo de 200, mensaje de 10 y de 2000', async () => {
      await assertSucceeds(
        crear(
          mensaje({
            nombre: 'a'.repeat(100),
            correo: 'a'.repeat(189) + '@correo.com',
            mensaje: '1234567890',
          }),
        ),
      )
      await assertSucceeds(crear(mensaje({ mensaje: 'a'.repeat(2000) })))
    })

    it('falta un campo', async () => {
      const sinMotivo: Record<string, unknown> = mensaje()
      delete sinMotivo.motivo
      await assertFails(crear(sinMotivo))
    })

    it('sobra un campo (p. ej. el de la trampa o un teléfono)', async () => {
      await assertFails(crear(mensaje({ web: 'spam' })))
      await assertFails(crear(mensaje({ telefono: '600000000' })))
    })

    it('sin aceptar la privacidad', async () => {
      await assertFails(crear(mensaje({ aceptoPrivacidad: false })))
      await assertFails(crear(mensaje({ aceptoPrivacidad: 'true' })))
    })

    it('la fecha tiene que ser la del servidor', async () => {
      await assertFails(crear(mensaje({ creadoEn: Timestamp.now() })))
    })

    it('nombre vacío, de solo espacios o de más de 100', async () => {
      await assertFails(crear(mensaje({ nombre: '' })))
      await assertFails(crear(mensaje({ nombre: '   ' })))
      await assertFails(crear(mensaje({ nombre: 'a'.repeat(101) })))
      await assertFails(crear(mensaje({ nombre: 42 })))
    })

    it('correo con formato incorrecto o de más de 200', async () => {
      for (const malo of ['ana', 'ana@', 'ana@correo', 'a na@correo.com', '@c.com'])
        await assertFails(crear(mensaje({ correo: malo })))
      await assertFails(
        crear(mensaje({ correo: 'a'.repeat(190) + '@correo.com' })),
      )
    })

    it('mensaje de menos de 10 (sin contar espacios) o de más de 2000', async () => {
      await assertFails(crear(mensaje({ mensaje: '123456789' })))
      await assertFails(crear(mensaje({ mensaje: '   123456789   ' })))
      await assertFails(crear(mensaje({ mensaje: 'a'.repeat(2001) })))
    })

    it('opciones que no están en la lista', async () => {
      await assertFails(crear(mensaje({ queEres: 'jefe' })))
      await assertFails(crear(mensaje({ queEres: '' })))
      await assertFails(crear(mensaje({ motivo: 'spam' })))
    })
  })

  describe('nadie lo lee, cambia ni borra desde la app', () => {
    it('leer uno o la lista: ni sin sesión ni con sesión', async () => {
      for (const db of [sinSesion(), conSesion()]) {
        await assertFails(getDoc(doc(db, 'mensajesContacto', 'existente')))
        await assertFails(getDocs(collection(db, 'mensajesContacto')))
      }
    })

    it('modificar o borrar: tampoco', async () => {
      for (const db of [sinSesion(), conSesion()]) {
        await assertFails(
          updateDoc(doc(db, 'mensajesContacto', 'existente'), {
            mensaje: 'Cambiado por otro.',
          }),
        )
        await assertFails(deleteDoc(doc(db, 'mensajesContacto', 'existente')))
      }
    })

    it('no se puede sobrescribir uno existente con «crear»', async () => {
      await assertFails(
        setDoc(doc(sinSesion(), 'mensajesContacto', 'existente'), mensaje()),
      )
    })
  })
})
