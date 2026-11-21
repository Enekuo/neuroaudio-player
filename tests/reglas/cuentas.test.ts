// Tests de la PROPUESTA de tipos de cuenta (reglas/propuestas, en los dos
// modos): users/{uid}.tipoCuenta y que las escrituras de profesional exijan
// cuenta profesional. Al adoptarla, cambiar MODOS_PROPUESTA por MODOS.
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
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { MODOS_PROPUESTA } from './modos'

let env: RulesTestEnvironment

const PRO = 'pro-nuevo'
const OYENTE = 'oyente-nuevo'
const ANTIGUO = 'pro-sin-marcar' // tiene perfil y datos, pero no tipoCuenta
const SIN_CUENTA = 'sin-cuenta' // ni siquiera users/{uid}
const PRO_A_MANO = 'lucia' // profesional marcado a mano, sin datos de registro

const db = (uid: string) => env.authenticatedContext(uid).firestore()
const usuario = (uid: string, de = uid) => doc(db(de), 'users', uid)

// Lo que escribe la app (src/features/cuenta/cuentaService.ts).
const oyenteNuevo = (uid: string) => ({
  uid,
  email: `${uid}@correo.com`,
  displayName: 'Ana',
  createdAt: serverTimestamp(),
  aceptoTerminosEn: serverTimestamp(),
  tipoCuenta: 'oyente',
})

const datosPro = () => ({
  nombre: 'Lucía Ferrer',
  dedicacion: 'hipnosis',
  dedicacionOtra: null,
  pais: 'ES',
  clientes: '11-50',
})

const novedades = (acepta = true) => ({ acepta, en: serverTimestamp() })

const hacerseProfesional = () => ({
  tipoCuenta: 'profesional',
  aceptoTerminosEn: serverTimestamp(),
  profesional: datosPro(),
  novedades: novedades(),
})

const perfil = () => ({
  nombre: 'Lucía Ferrer',
  frase: '',
  dedicacion: '',
  enlaces: {},
  bienvenida: '',
  respuesta: null,
  fotos: [],
  fotoPrincipalId: null,
  secciones: [],
  actualizadoEn: serverTimestamp(),
})

const audioGeneral = (uid: string, id = 'audio-nuevo') => ({
  profesionalUid: uid,
  titulo: 'Respiración para dormir',
  descripcion: '',
  estado: 'publicado',
  tipo: 'general',
  destinatarioUid: null,
  archivo: `audiosPro/${uid}/${id}/archivo`,
  duracionSegundos: 600,
  tamanoBytes: 1000,
  contieneSalud: false,
  orden: 0,
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp(),
})

const audioBiblioteca = (uid: string, id: string) => ({
  profesionalUid: uid,
  titulo: `Audio ${id}`,
  descripcion: '',
  estado: 'publicado',
  tipo: 'biblioteca',
  destinatarioUid: null,
  archivo: `bibliotecaPro/${uid}/${id}/archivo`,
  duracionSegundos: 600,
  tamanoBytes: 1000,
  contieneSalud: false,
  orden: 0,
  creadoEn: Timestamp.now(),
  actualizadoEn: Timestamp.now(),
})

const lista = (uid: string) => ({
  profesionalUid: uid,
  tipo: 'lista',
  titulo: 'Para dormir',
  descripcion: '',
  estado: 'borrador',
  plantillaId: null,
  imagen: null,
  audios: [],
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp(),
})

const programa = (uid: string) => ({
  profesionalUid: uid,
  titulo: 'Dormir mejor en 7 días',
  descripcion: '',
  estado: 'borrador',
  apertura: 'orden',
  ritmo: 'diario',
  ritmoDias: null,
  para: 'todos',
  pasos: [],
  publicadoEn: null,
  creadoEn: serverTimestamp(),
  actualizadoEn: serverTimestamp(),
})

const reserva = () => ({
  ventanaInicio: serverTimestamp(),
  cuenta: 1,
  reservada: 'foto1',
  reservadaEn: serverTimestamp(),
})

/** Todas las escrituras de profesional que se prueban, para una cuenta. */
const accionesDeProfesional = (uid: string) =>
  [
    [
      'perfil',
      () => setDoc(doc(db(uid), 'perfilesProfesionales', uid), perfil()),
    ],
    [
      'reserva de foto',
      () => setDoc(doc(db(uid), 'limitesSubida', uid), reserva()),
    ],
    [
      'reserva de audio',
      () => setDoc(doc(db(uid), 'limitesSubidaAudio', uid), reserva()),
    ],
    [
      'audio general',
      () =>
        setDoc(
          doc(db(uid), 'audiosProfesional', 'audio-nuevo'),
          audioGeneral(uid),
        ),
    ],
    [
      'lista',
      () =>
        setDoc(
          doc(db(uid), 'listasProfesional', `${uid}__propia__1`),
          lista(uid),
        ),
    ],
    [
      'programa',
      () =>
        setDoc(
          doc(db(uid), 'programasProfesional', 'programa-nuevo'),
          programa(uid),
        ),
    ],
    [
      'nota privada',
      () =>
        setDoc(doc(db(uid), 'notasPrivadas', uid, 'oyentes', 'ana'), {
          texto: 'Avanza bien.',
          actualizadoEn: serverTimestamp(),
        }),
    ],
    [
      'pausar un vínculo',
      () =>
        updateDoc(doc(db(uid), 'vinculos', `${uid}_ana`), {
          estado: 'pausado',
          estadoCambiadoEn: serverTimestamp(),
        }),
    ],
  ] as const

describe.each(MODOS_PROPUESTA)('propuesta, modo «$nombre»', (modo) => {
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
      const f = ctx.firestore()
      await setDoc(doc(f, 'users', PRO), { tipoCuenta: 'profesional' })
      await setDoc(doc(f, 'users', OYENTE), { tipoCuenta: 'oyente' })
      // Cuenta de antes de tipoCuenta: users/{uid} sin el campo (= oyente).
      await setDoc(doc(f, 'users', ANTIGUO), { email: 'antiguo@correo.com' })
      await setDoc(doc(f, 'users', PRO_A_MANO), {
        email: 'l@correo.com',
        tipoCuenta: 'profesional',
      })
      for (const uid of [PRO, OYENTE, ANTIGUO, SIN_CUENTA]) {
        await setDoc(doc(f, 'vinculos', `${uid}_ana`), {
          profesionalUid: uid,
          oyenteUid: 'ana',
          estado: 'activo',
        })
      }
    })
  })

  describe('users/{uid}: tipoCuenta', () => {
    it('se crea como oyente o como profesional, con la fecha de los términos', async () => {
      await assertSucceeds(setDoc(usuario('a'), oyenteNuevo('a')))
      await assertSucceeds(
        setDoc(usuario('b'), { ...oyenteNuevo('b'), ...hacerseProfesional() }),
      )
      // Sin tipo (= oyente), también.
      const sinTipo: Record<string, unknown> = { ...oyenteNuevo('c') }
      delete sinTipo.tipoCuenta
      await assertSucceeds(setDoc(usuario('c'), sinTipo))
    })

    it('no se crea con otro tipo', async () => {
      for (const tipoCuenta of ['admin', '', true]) {
        await assertFails(setDoc(usuario('a'), { ...oyenteNuevo('a'), tipoCuenta }))
      }
    })

    it('pasa de oyente a profesional (también una cuenta sin tipo)', async () => {
      await assertSucceeds(
        setDoc(usuario(OYENTE), hacerseProfesional(), { merge: true }),
      )
      await assertSucceeds(
        setDoc(usuario(ANTIGUO), hacerseProfesional(), { merge: true }),
      )
    })

    it('nunca de profesional a oyente, ni quitando el campo, ni a otro tipo', async () => {
      await assertFails(updateDoc(usuario(PRO), { tipoCuenta: 'oyente' }))
      await assertFails(updateDoc(usuario(PRO), { tipoCuenta: deleteField() }))
      await assertFails(setDoc(usuario(PRO), { displayNamePref: 'Lucía' }))
      await assertFails(
        setDoc(
          usuario(OYENTE),
          { ...hacerseProfesional(), tipoCuenta: 'admin' },
          { merge: true },
        ),
      )
    })

    it('el resto de ajustes se siguen guardando sin tocar el tipo', async () => {
      await assertSucceeds(
        setDoc(usuario(PRO), { displayNamePref: 'Lucía' }, { merge: true }),
      )
      await assertSucceeds(
        setDoc(usuario(OYENTE), { reproducirAlAbrir: true }, { merge: true }),
      )
      await assertSucceeds(
        setDoc(usuario(ANTIGUO), { avatarGender: 'female' }, { merge: true }),
      )
      // También un profesional marcado a mano, sin datos de registro.
      await assertSucceeds(
        setDoc(usuario(PRO_A_MANO), { displayNamePref: 'Lucía' }, { merge: true }),
      )
    })

    it('nadie lee ni cambia la cuenta de otra persona', async () => {
      await assertFails(getDoc(usuario(PRO, OYENTE)))
      await assertFails(
        setDoc(usuario(OYENTE, PRO), hacerseProfesional(), { merge: true }),
      )
      await assertFails(setDoc(usuario('nueva', PRO), oyenteNuevo('nueva')))
      await assertFails(
        setDoc(
          doc(env.unauthenticatedContext().firestore(), 'users', 'x'),
          oyenteNuevo('x'),
        ),
      )
    })

    it('cada uno lee la suya', async () => {
      await assertSucceeds(getDoc(usuario(PRO)))
      await assertSucceeds(getDoc(usuario(OYENTE)))
    })

    it('no se borra desde la app (no se puede volver a crear como oyente)', async () => {
      await assertFails(deleteDoc(usuario(PRO)))
      await assertFails(deleteDoc(usuario(OYENTE)))
    })
  })

  describe('users/{uid}: datos del registro', () => {
    it('sin la fecha de los términos, o con otra que no es la del servidor, no se crea', async () => {
      const sinFecha: Record<string, unknown> = { ...oyenteNuevo('a') }
      delete sinFecha.aceptoTerminosEn
      await assertFails(setDoc(usuario('a'), sinFecha))
      await assertFails(
        setDoc(usuario('a'), {
          ...oyenteNuevo('a'),
          aceptoTerminosEn: Timestamp.fromMillis(0),
        }),
      )
      await assertFails(
        setDoc(usuario('a'), { ...oyenteNuevo('a'), aceptoTerminosEn: 'ayer' }),
      )
      // Ni un ajuste suelto crea la cuenta (sin aceptar términos).
      await assertFails(
        setDoc(usuario('a'), { displayNamePref: 'Ana' }, { merge: true }),
      )
    })

    it('un oyente nuevo no lleva datos de profesional', async () => {
      await assertFails(
        setDoc(usuario('a'), { ...oyenteNuevo('a'), profesional: datosPro() }),
      )
      await assertFails(
        setDoc(usuario('a'), { ...oyenteNuevo('a'), novedades: novedades() }),
      )
    })

    it('un profesional nuevo, sin sus datos o sin el sí/no a los correos, no se crea', async () => {
      const sinDatos: Record<string, unknown> = {
        ...oyenteNuevo('b'),
        ...hacerseProfesional(),
      }
      delete sinDatos.profesional
      const sinNovedades: Record<string, unknown> = {
        ...oyenteNuevo('b'),
        ...hacerseProfesional(),
      }
      delete sinNovedades.novedades
      await assertFails(setDoc(usuario('b'), sinDatos))
      await assertFails(setDoc(usuario('b'), sinNovedades))
      await assertFails(
        setDoc(usuario('b'), { ...oyenteNuevo('b'), tipoCuenta: 'profesional' }),
      )
    })

    it('los datos del profesional se validan', async () => {
      // Cada intento, en una cuenta distinta (si no, sería un cambio).
      let n = 0
      const con = (p: Record<string, unknown>) =>
        setDoc(usuario(`p${++n}`), {
          ...oyenteNuevo(`p${n}`),
          ...hacerseProfesional(),
          profesional: { ...datosPro(), ...p },
        })
      await assertSucceeds(con({}))
      await assertSucceeds(con({ dedicacion: 'otro', dedicacionOtra: 'Reiki' }))
      await assertSucceeds(con({ clientes: null }))
      await assertSucceeds(con({ nombre: 'x'.repeat(80) }))
      await assertFails(con({ nombre: 'L' }))
      await assertFails(con({ nombre: 'x'.repeat(81) }))
      await assertFails(con({ nombre: 42 }))
      await assertFails(con({ dedicacion: 'tarot' }))
      await assertFails(con({ dedicacion: 'otro', dedicacionOtra: null }))
      await assertFails(con({ dedicacion: 'otro', dedicacionOtra: 'R' }))
      await assertFails(con({ dedicacion: 'otro', dedicacionOtra: 'x'.repeat(61) }))
      await assertFails(con({ dedicacionOtra: 'Reiki' })) // sin «Otro»
      await assertFails(con({ pais: 'España' }))
      await assertFails(con({ pais: 'es' }))
      await assertFails(con({ clientes: '1000' }))
      await assertFails(con({ extra: true }))
    })

    it('el sí/no a los correos lleva la fecha del servidor', async () => {
      let i = 0
      const con = (n: unknown) =>
        setDoc(usuario(`n${++i}`), {
          ...oyenteNuevo(`n${i}`),
          ...hacerseProfesional(),
          novedades: n,
        })
      await assertSucceeds(con({ acepta: false, en: serverTimestamp() }))
      await assertFails(con({ acepta: 'sí', en: serverTimestamp() }))
      await assertFails(con({ acepta: true, en: Timestamp.fromMillis(0) }))
      await assertFails(con({ acepta: true }))
      await assertFails(con(true))
    })

    it('al pasar de oyente a profesional también hacen falta sus datos y la fecha de ahora', async () => {
      await assertFails(updateDoc(usuario(OYENTE), { tipoCuenta: 'profesional' }))
      await assertFails(
        setDoc(
          usuario(OYENTE),
          { ...hacerseProfesional(), aceptoTerminosEn: Timestamp.fromMillis(0) },
          { merge: true },
        ),
      )
      await assertFails(
        setDoc(
          usuario(OYENTE),
          { ...hacerseProfesional(), profesional: { ...datosPro(), pais: '' } },
          { merge: true },
        ),
      )
    })

    it('después, los términos aceptados y los datos del profesional no se cambian ni se quitan', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', 'reg'), {
          uid: 'reg',
          tipoCuenta: 'profesional',
          aceptoTerminosEn: Timestamp.fromMillis(1000),
          profesional: datosPro(),
          novedades: { acepta: true, en: Timestamp.fromMillis(1000) },
        })
      })
      await assertFails(
        updateDoc(usuario('reg'), { aceptoTerminosEn: serverTimestamp() }),
      )
      await assertFails(updateDoc(usuario('reg'), { aceptoTerminosEn: deleteField() }))
      await assertFails(
        updateDoc(usuario('reg'), { 'profesional.nombre': 'Otro nombre' }),
      )
      await assertFails(updateDoc(usuario('reg'), { profesional: deleteField() }))
      // Lo demás, sí.
      await assertSucceeds(
        setDoc(usuario('reg'), { reproducirAlAbrir: true }, { merge: true }),
      )
    })
  })

  describe('users/{uid}: el permiso de correos (novedades) se cambia cuando quiera', () => {
    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', 'reg'), {
          uid: 'reg',
          tipoCuenta: 'profesional',
          aceptoTerminosEn: Timestamp.fromMillis(1000),
          profesional: datosPro(),
          novedades: { acepta: true, en: Timestamp.fromMillis(1000) },
        })
      })
    })

    it('se retira y se vuelve a dar, con la fecha de ahora', async () => {
      await assertSucceeds(updateDoc(usuario('reg'), { novedades: novedades(false) }))
      await assertSucceeds(updateDoc(usuario('reg'), { novedades: novedades(true) }))
      await assertSucceeds(
        setDoc(usuario('reg'), { novedades: novedades(false) }, { merge: true }),
      )
    })

    it('junto con otros ajustes, también', async () => {
      await assertSucceeds(
        setDoc(
          usuario('reg'),
          { novedades: novedades(false), reproducirAlAbrir: true },
          { merge: true },
        ),
      )
    })

    it('siempre válido y con la fecha del servidor; no se quita', async () => {
      await assertFails(
        updateDoc(usuario('reg'), {
          novedades: { acepta: false, en: Timestamp.fromMillis(2000) },
        }),
      )
      await assertFails(updateDoc(usuario('reg'), { novedades: { acepta: false } }))
      await assertFails(
        updateDoc(usuario('reg'), { novedades: { acepta: 'no', en: serverTimestamp() } }),
      )
      await assertFails(
        updateDoc(usuario('reg'), {
          novedades: { ...novedades(false), extra: 1 },
        }),
      )
      await assertFails(updateDoc(usuario('reg'), { 'novedades.acepta': false }))
      await assertFails(updateDoc(usuario('reg'), { novedades: deleteField() }))
    })

    it('al cambiarlo no se pueden tocar los términos ni los datos del profesional', async () => {
      await assertFails(
        updateDoc(usuario('reg'), {
          novedades: novedades(false),
          aceptoTerminosEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(usuario('reg'), {
          novedades: novedades(false),
          'profesional.nombre': 'Otro nombre',
        }),
      )
    })

    it('nadie cambia el de otra persona', async () => {
      await assertFails(
        updateDoc(usuario('reg', OYENTE), { novedades: novedades(false) }),
      )
    })
  })

  describe('las escrituras de profesional exigen cuenta profesional', () => {
    it('un profesional puede hacerlas todas', async () => {
      for (const [, accion] of accionesDeProfesional(PRO)) {
        await assertSucceeds(accion())
      }
    })

    it('un oyente no puede hacer ninguna', async () => {
      for (const [, accion] of accionesDeProfesional(OYENTE)) {
        await assertFails(accion())
      }
    })

    it('una cuenta sin tipoCuenta (anterior) tampoco: hay que marcarla', async () => {
      for (const [, accion] of accionesDeProfesional(ANTIGUO)) {
        await assertFails(accion())
      }
    })

    it('sin users/{uid}, tampoco', async () => {
      for (const [, accion] of accionesDeProfesional(SIN_CUENTA)) {
        await assertFails(accion())
      }
    })

    it('al pasar de oyente a profesional, ya puede', async () => {
      await assertFails(accionesDeProfesional(OYENTE)[0][1]())
      await setDoc(usuario(OYENTE), hacerseProfesional(), { merge: true })
      for (const [, accion] of accionesDeProfesional(OYENTE)) {
        await assertSucceeds(accion())
      }
    })

    it('borrar lo suyo no exige cuenta profesional (como antes)', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(
          doc(ctx.firestore(), 'audiosProfesional', 'suyo'),
          audioGeneral(ANTIGUO, 'suyo'),
        )
      })
      await assertSucceeds(
        deleteDoc(doc(db(ANTIGUO), 'audiosProfesional', 'suyo')),
      )
    })
  })

  describe('«Añadir desde Biblioteca», en tandas de 10', () => {
    it('10 audios de golpe caben en el límite de lecturas', async () => {
      const ids = Array.from({ length: 10 }, (_, i) => `b${i}`)
      await env.withSecurityRulesDisabled(async (ctx) => {
        for (const id of ids) {
          await setDoc(
            doc(ctx.firestore(), 'audiosProfesional', id),
            audioBiblioteca(PRO, id),
          )
        }
      })
      const f = db(PRO)
      const lote = writeBatch(f)
      ids.forEach((id, i) => {
        lote.set(doc(f, 'audiosProfesional', `${id}__general`), {
          ...audioGeneral(PRO, `${id}__general`),
          archivo: `bibliotecaPro/${PRO}/${id}/archivo`,
          deMisAudios: id,
          orden: i,
        })
        lote.update(doc(f, 'audiosProfesional', id), {
          enAudios: true,
          publicoEnAudios: true,
          actualizadoEn: serverTimestamp(),
        })
      })
      await assertSucceeds(lote.commit())
    })
  })
})
