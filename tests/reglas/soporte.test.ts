// Tests de las reglas del panel de Soporte (mensajesSoporte), en los dos
// modos (ver ./modos).
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

const CORREO = 'lucia@correo.com'

const mensaje = (extra: Record<string, unknown> = {}) => ({
  uid: 'lucia',
  nombre: 'Lucía Pérez',
  correo: CORREO,
  tipo: 'problema',
  subtipo: null,
  pagina: 'audios',
  texto: 'No me deja subir el audio.',
  creadoEn: serverTimestamp(),
  estado: 'nuevo',
  contexto: {
    ruta: '/profesional/audios',
    navegador: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130',
    modo: 'claro',
  },
  ...extra,
})

const comentario = (extra: Record<string, unknown> = {}) =>
  mensaje({ tipo: 'comentario', subtipo: 'sugerencia', ...extra })

const lucia = (token: Record<string, unknown> = {}) =>
  env
    .authenticatedContext('lucia', {
      email: CORREO,
      email_verified: true,
      ...token,
    })
    .firestore()
const sinSesion = () => env.unauthenticatedContext().firestore()
const crear = (datos: Record<string, unknown>, db = lucia()) =>
  addDoc(collection(db, 'mensajesSoporte'), datos)

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
      await setDoc(doc(ctx.firestore(), 'mensajesSoporte', 'existente'), {
        ...mensaje(),
        creadoEn: Timestamp.now(),
      })
    })
  })

  describe('crear', () => {
    it('un problema correcto, con sesión', async () => {
      await assertSucceeds(crear(mensaje()))
    })

    it('un comentario de cada tipo', async () => {
      for (const subtipo of ['sugerencia', 'me_gusta', 'no_me_gusta'])
        await assertSucceeds(crear(comentario({ subtipo })))
    })

    it('todas las páginas admitidas, también «otra»', async () => {
      for (const pagina of [
        'dashboard',
        'perfil',
        'oyentes',
        'mis-audios',
        'audios',
        'listas',
        'mensajes',
        'estadisticas',
        'ajustes',
        'otra',
      ])
        await assertSucceeds(crear(mensaje({ pagina })))
    })

    it('valores límite: texto de 10 y de 2000, nombre vacío o de 100, modo oscuro', async () => {
      await assertSucceeds(crear(mensaje({ texto: '1234567890' })))
      await assertSucceeds(crear(mensaje({ texto: 'a'.repeat(2000) })))
      await assertSucceeds(crear(mensaje({ nombre: '' })))
      await assertSucceeds(crear(mensaje({ nombre: 'a'.repeat(100) })))
      await assertSucceeds(
        crear(
          mensaje({
            contexto: {
              ruta: '/profesional',
              navegador: 'x'.repeat(200),
              modo: 'oscuro',
            },
          }),
        ),
      )
    })
  })

  describe('quién', () => {
    it('sin sesión, no', async () => {
      await assertFails(crear(mensaje(), sinSesion()))
    })

    it('con el uid de otra persona, no', async () => {
      await assertFails(crear(mensaje({ uid: 'otra' })))
    })

    it('con un correo que no es el de la cuenta, no', async () => {
      await assertFails(crear(mensaje({ correo: 'otro@correo.com' })))
      await assertFails(crear(mensaje({ correo: 'LUCIA@correo.com' })))
    })

    it('una cuenta sin correo o con el correo sin verificar, no', async () => {
      await assertFails(
        crear(mensaje(), env.authenticatedContext('lucia').firestore()),
      )
      await assertFails(crear(mensaje(), lucia({ email_verified: false })))
    })
  })

  describe('campos', () => {
    it('falta un campo', async () => {
      for (const campo of [
        'uid',
        'nombre',
        'correo',
        'tipo',
        'subtipo',
        'pagina',
        'texto',
        'creadoEn',
        'estado',
        'contexto',
      ]) {
        const datos: Record<string, unknown> = mensaje()
        delete datos[campo]
        await assertFails(crear(datos))
      }
    })

    it('sobra un campo (p. ej. datos de un oyente o de la pantalla)', async () => {
      await assertFails(crear(mensaje({ oyenteUid: 'ana' })))
      await assertFails(crear(mensaje({ captura: 'data:image/png;base64,…' })))
      await assertFails(
        crear(
          mensaje({
            contexto: {
              ruta: '/profesional',
              navegador: 'x',
              modo: 'claro',
              pantalla: '1440x900',
            },
          }),
        ),
      )
    })

    it('la fecha tiene que ser la del servidor', async () => {
      await assertFails(crear(mensaje({ creadoEn: Timestamp.now() })))
    })

    it('el estado tiene que ser «nuevo»', async () => {
      await assertFails(crear(mensaje({ estado: 'respondido' })))
    })

    it('tipos y subtipos que no están en la lista', async () => {
      await assertFails(crear(mensaje({ tipo: 'queja' })))
      // Un problema no lleva subtipo; un comentario, siempre uno válido.
      await assertFails(crear(mensaje({ subtipo: 'sugerencia' })))
      await assertFails(crear(comentario({ subtipo: null })))
      await assertFails(crear(comentario({ subtipo: 'spam' })))
    })

    it('página que no está en la lista', async () => {
      await assertFails(crear(mensaje({ pagina: 'ingresos' })))
      await assertFails(crear(mensaje({ pagina: '' })))
    })

    it('texto de menos de 10 (sin contar espacios), de más de 2000 o que no es texto', async () => {
      await assertFails(crear(mensaje({ texto: '123456789' })))
      await assertFails(crear(mensaje({ texto: '   123456789   ' })))
      await assertFails(crear(mensaje({ texto: 'a'.repeat(2001) })))
      await assertFails(crear(mensaje({ texto: 1234567890 })))
    })

    it('nombre de más de 100 o que no es texto', async () => {
      await assertFails(crear(mensaje({ nombre: 'a'.repeat(101) })))
      await assertFails(crear(mensaje({ nombre: null })))
    })

    it('contexto: ruta fuera del panel o larga, navegador largo, modo raro', async () => {
      const contexto = (c: Record<string, unknown>) => ({
        contexto: {
          ruta: '/profesional/audios',
          navegador: 'x',
          modo: 'claro',
          ...c,
        },
      })
      await assertFails(crear(mensaje(contexto({ ruta: '/app/inicio' }))))
      await assertFails(crear(mensaje(contexto({ ruta: '/profesionalx' }))))
      await assertFails(
        crear(mensaje(contexto({ ruta: '/profesional/' + 'a'.repeat(200) }))),
      )
      await assertFails(
        crear(mensaje(contexto({ navegador: 'x'.repeat(201) }))),
      )
      await assertFails(crear(mensaje(contexto({ modo: 'sistema' }))))
      await assertFails(crear(mensaje({ contexto: 'claro' })))
    })
  })

  describe('nadie lo lee, cambia ni borra desde la app', () => {
    const ref = (db = lucia()) => doc(db, 'mensajesSoporte', 'existente')

    it('ni quien lo envió', async () => {
      await assertFails(getDoc(ref()))
      await assertFails(getDocs(collection(lucia(), 'mensajesSoporte')))
      await assertFails(updateDoc(ref(), { estado: 'respondido' }))
      await assertFails(deleteDoc(ref()))
    })

    it('ni sin sesión', async () => {
      await assertFails(getDoc(ref(sinSesion())))
      await assertFails(deleteDoc(ref(sinSesion())))
    })
  })
})
