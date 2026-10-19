// Tests de las reglas de Firestore del perfil del profesional y los vínculos.
// Necesitan el emulador de Firestore (y Java instalado). Se lanzan con:
//   npm run test:reglas
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO_PRO = 'profesional-b'
const OYENTE = 'oyente-de-a'
const OYENTE_AJENO = 'oyente-de-b'

let env: RulesTestEnvironment

function perfil(extra: Record<string, unknown> = {}) {
  return {
    nombre: 'Lucía Ferrer',
    frase: 'Te acompaño a dormir mejor.',
    dedicacion: 'Psicóloga',
    enlaces: { web: 'https://miconsulta.es/' },
    bienvenida: 'Hola, bienvenida.',
    respuesta: '1-2-dias',
    fotos: [],
    fotoPrincipalId: null,
    secciones: [],
    actualizadoEn: serverTimestamp(),
    ...extra,
  }
}

describe.each(MODOS)('modo «$nombre»', (modo) => {
  // Lo que cambia entre modos: en «todos», el perfil lo lee cualquiera con sesión.
  const esperado = (intento: Promise<unknown>) =>
    modo.todos ? assertSucceeds(intento) : assertFails(intento)

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
    // Datos de partida, sin pasar por las reglas.
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(
        doc(db, 'perfilesProfesionales', PRO),
        perfil({ actualizadoEn: new Date() }),
      )
      await setDoc(doc(db, 'vinculos', `${PRO}_${OYENTE}`), {
        profesionalUid: PRO,
        oyenteUid: OYENTE,
        estado: 'activo',
      })
      await setDoc(doc(db, 'vinculos', `${OTRO_PRO}_${OYENTE_AJENO}`), {
        profesionalUid: OTRO_PRO,
        oyenteUid: OYENTE_AJENO,
        estado: 'activo',
      })
    })
  })

  describe('lectura del perfil', () => {
    it('el propio profesional lo lee', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(getDoc(doc(db, 'perfilesProfesionales', PRO)))
    })

    it('un oyente vinculado lo lee', async () => {
      const db = env.authenticatedContext(OYENTE).firestore()
      await assertSucceeds(getDoc(doc(db, 'perfilesProfesionales', PRO)))
    })

    // PRUEBA TEMPORAL: en modo «todos» lo lee cualquier usuario con sesión.
    it(`un usuario sin vínculo ${modo.todos ? 'SÍ' : 'NO'} lo lee`, async () => {
      const db = env.authenticatedContext(OYENTE_AJENO).firestore()
      await esperado(getDoc(doc(db, 'perfilesProfesionales', PRO)))
    })

    it('una persona sin sesión NO lo lee', async () => {
      const db = env.unauthenticatedContext().firestore()
      await assertFails(getDoc(doc(db, 'perfilesProfesionales', PRO)))
    })

    it(`un oyente con el vínculo en pausa ${modo.todos ? 'SÍ' : 'NO'} lo lee`, async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_${OYENTE}`), {
          profesionalUid: PRO,
          oyenteUid: OYENTE,
          estado: 'pausado',
        })
      })
      const db = env.authenticatedContext(OYENTE).firestore()
      await esperado(getDoc(doc(db, 'perfilesProfesionales', PRO)))
    })

    // La consulta de «todos los profesionales» de la fila de Inicio.
    const todosLosPerfiles = (ctx: RulesTestContext) =>
      query(
        collection(ctx.firestore(), 'perfilesProfesionales'),
        where('nombre', '>', ''),
        orderBy('nombre'),
        limit(50),
      )

    it(`un usuario sin vínculo ${modo.todos ? 'SÍ' : 'NO'} lista los perfiles`, async () => {
      await esperado(
        getDocs(todosLosPerfiles(env.authenticatedContext(OYENTE_AJENO))),
      )
    })

    it('sin sesión no se listan los perfiles', async () => {
      await assertFails(getDocs(todosLosPerfiles(env.unauthenticatedContext())))
    })
  })

  describe('escritura del perfil', () => {
    it('el profesional guarda su propio perfil', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        setDoc(doc(db, 'perfilesProfesionales', PRO), perfil()),
      )
    })

    it('nadie edita el perfil de otro', async () => {
      const db = env.authenticatedContext(OTRO_PRO).firestore()
      await assertFails(setDoc(doc(db, 'perfilesProfesionales', PRO), perfil()))
      const dbOyente = env.authenticatedContext(OYENTE).firestore()
      await assertFails(
        setDoc(doc(dbOyente, 'perfilesProfesionales', PRO), perfil()),
      )
    })

    it('rechaza una frase de más de 160 caracteres', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        setDoc(
          doc(db, 'perfilesProfesionales', PRO),
          perfil({ frase: 'a'.repeat(161) }),
        ),
      )
    })

    it('rechaza enlaces que no son https', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        setDoc(
          doc(db, 'perfilesProfesionales', PRO),
          perfil({ enlaces: { web: 'javascript:alert(1)' } }),
        ),
      )
    })

    it('rechaza campos que no son del perfil (p. ej. una insignia)', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        setDoc(
          doc(db, 'perfilesProfesionales', PRO),
          perfil({ verificado: true }),
        ),
      )
    })

    it('rechaza más de 9 fotos', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      const fotos = Array.from({ length: 10 }, (_, i) => ({
        id: `f${i}`,
        alt: '',
      }))
      await assertFails(
        setDoc(doc(db, 'perfilesProfesionales', PRO), perfil({ fotos })),
      )
    })
  })

  describe('vínculos', () => {
    it('cada parte lee su vínculo; un tercero no', async () => {
      const id = `${PRO}_${OYENTE}`
      await assertSucceeds(
        getDoc(doc(env.authenticatedContext(PRO).firestore(), 'vinculos', id)),
      )
      await assertSucceeds(
        getDoc(
          doc(env.authenticatedContext(OYENTE).firestore(), 'vinculos', id),
        ),
      )
      await assertFails(
        getDoc(
          doc(
            env.authenticatedContext(OYENTE_AJENO).firestore(),
            'vinculos',
            id,
          ),
        ),
      )
    })

    it('nadie crea vínculos desde la app (por ahora)', async () => {
      const db = env.authenticatedContext(OYENTE_AJENO).firestore()
      await assertFails(
        setDoc(doc(db, 'vinculos', `${PRO}_${OYENTE_AJENO}`), {
          profesionalUid: PRO,
          oyenteUid: OYENTE_AJENO,
          estado: 'activo',
        }),
      )
    })
  })

  describe('«Tus profesionales»: consulta de vínculos del oyente', () => {
    const misVinculos = (uid: string) =>
      query(
        collection(env.authenticatedContext(uid).firestore(), 'vinculos'),
        where('oyenteUid', '==', uid),
        where('estado', '==', 'activo'),
      )

    it('el oyente lista sus vínculos activos (la consulta de la app)', async () => {
      await assertSucceeds(getDocs(misVinculos(OYENTE)))
    })

    it('nadie lista los vínculos de otro oyente', async () => {
      const db = env.authenticatedContext(OYENTE_AJENO).firestore()
      await assertFails(
        getDocs(
          query(
            collection(db, 'vinculos'),
            where('oyenteUid', '==', OYENTE),
            where('estado', '==', 'activo'),
          ),
        ),
      )
      // Ni siquiera sin filtrar.
      await assertFails(getDocs(collection(db, 'vinculos')))
    })

    it(`un oyente sin vínculo ${modo.todos ? 'SÍ' : 'NO'} ve el nombre y la foto del profesional`, async () => {
      const db = env.authenticatedContext(OYENTE_AJENO).firestore()
      await esperado(getDoc(doc(db, 'perfilesProfesionales', PRO)))
    })
  })
})
