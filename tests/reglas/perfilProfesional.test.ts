// Tests de las reglas de Firestore del perfil del profesional y los vínculos.
// Necesitan el emulador de Firestore (y Java instalado). Se lanzan con:
//   npm run test:reglas
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

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

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-neuroaudio',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
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

  it('un oyente de otro profesional NO lo lee', async () => {
    const db = env.authenticatedContext(OYENTE_AJENO).firestore()
    await assertFails(getDoc(doc(db, 'perfilesProfesionales', PRO)))
  })

  it('una persona sin sesión NO lo lee', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'perfilesProfesionales', PRO)))
  })

  it('un oyente con el vínculo en pausa NO lo lee', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_${OYENTE}`), {
        profesionalUid: PRO,
        oyenteUid: OYENTE,
        estado: 'pausado',
      })
    })
    const db = env.authenticatedContext(OYENTE).firestore()
    await assertFails(getDoc(doc(db, 'perfilesProfesionales', PRO)))
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
      getDoc(doc(env.authenticatedContext(OYENTE).firestore(), 'vinculos', id)),
    )
    await assertFails(
      getDoc(
        doc(env.authenticatedContext(OYENTE_AJENO).firestore(), 'vinculos', id),
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
