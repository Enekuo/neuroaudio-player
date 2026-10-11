// Tests de las reglas de las fotos del perfil (Storage) y del límite de
// subidas (Firestore). Necesitan los emuladores (y Java). Se lanzan con:
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
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const PRO = 'profesional-a'
const OYENTE = 'oyente-de-a'
const OYENTE_AJENO = 'oyente-de-b'
const FOTO = 'foto1'
const RUTA = `perfiles/${PRO}/fotos/${FOTO}/normal`
const IMAGEN = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
])
const WEBP = { contentType: 'image/webp' }

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-neuroaudio',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.clearStorage()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'vinculos', `${PRO}_${OYENTE}`), {
      profesionalUid: PRO,
      oyenteUid: OYENTE,
      estado: 'activo',
    })
    await setDoc(doc(db, 'limitesSubida', PRO), {
      ventanaInicio: Timestamp.now(),
      cuenta: 1,
      reservada: FOTO,
      reservadaEn: Timestamp.now(),
    })
    await uploadBytes(ref(ctx.storage(), RUTA), IMAGEN, WEBP)
  })
})

describe('lectura de fotos', () => {
  it('la lee el propio profesional y su oyente vinculado', async () => {
    await assertSucceeds(
      getBytes(ref(env.authenticatedContext(PRO).storage(), RUTA)),
    )
    await assertSucceeds(
      getBytes(ref(env.authenticatedContext(OYENTE).storage(), RUTA)),
    )
  })

  it('NO la lee un oyente de otro profesional ni alguien sin sesión', async () => {
    await assertFails(
      getBytes(ref(env.authenticatedContext(OYENTE_AJENO).storage(), RUTA)),
    )
    await assertFails(
      getBytes(ref(env.unauthenticatedContext().storage(), RUTA)),
    )
  })
})

describe('subida de fotos', () => {
  it('el profesional sube la foto que tiene reservada', async () => {
    const storage = env.authenticatedContext(PRO).storage()
    await assertSucceeds(
      uploadBytes(
        ref(storage, `perfiles/${PRO}/fotos/${FOTO}/cuadrada`),
        IMAGEN,
        WEBP,
      ),
    )
  })

  it('NO sube una foto que no ha reservado (se saltaría el límite)', async () => {
    const storage = env.authenticatedContext(PRO).storage()
    await assertFails(
      uploadBytes(
        ref(storage, `perfiles/${PRO}/fotos/otra/normal`),
        IMAGEN,
        WEBP,
      ),
    )
  })

  it('NO sube fotos a la carpeta de otro', async () => {
    const storage = env.authenticatedContext(OYENTE).storage()
    await assertFails(
      uploadBytes(
        ref(storage, `perfiles/${PRO}/fotos/${FOTO}/normal`),
        IMAGEN,
        WEBP,
      ),
    )
  })

  it('NO sube algo que no es imagen ni versiones con otro nombre', async () => {
    const storage = env.authenticatedContext(PRO).storage()
    await assertFails(
      uploadBytes(
        ref(storage, `perfiles/${PRO}/fotos/${FOTO}/normal`),
        IMAGEN,
        {
          contentType: 'text/html',
        },
      ),
    )
    await assertFails(
      uploadBytes(
        ref(storage, `perfiles/${PRO}/fotos/${FOTO}/original`),
        IMAGEN,
        WEBP,
      ),
    )
  })
})

describe('límite de subidas por minuto', () => {
  it('suma una reserva dentro del minuto', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'limitesSubida', PRO), {
        cuenta: 2,
        reservada: 'foto2',
        reservadaEn: serverTimestamp(),
      }),
    )
  })

  it('NO pasa de 10 fotos en el mismo minuto', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'limitesSubida', PRO), {
        cuenta: 10,
      })
    })
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(
      updateDoc(doc(db, 'limitesSubida', PRO), {
        cuenta: 11,
        reservada: 'foto11',
        reservadaEn: serverTimestamp(),
      }),
    )
  })

  it('NO deja reiniciar la cuenta antes de que pase el minuto', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    await assertFails(
      setDoc(doc(db, 'limitesSubida', PRO), {
        ventanaInicio: serverTimestamp(),
        cuenta: 1,
        reservada: 'foto2',
        reservadaEn: serverTimestamp(),
      }),
    )
  })
})
