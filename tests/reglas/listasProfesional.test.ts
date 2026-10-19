// Tests de las reglas de las listas del profesional (Firestore y Storage).
// Necesitan los emuladores (y Java). Se lanzan con:  npm run test:reglas
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO_PRO = 'profesional-b'
const OYENTE = 'oyente-de-a'
const OYENTE_AJENO = 'oyente-de-b'
const PUBLICADA = `${PRO}__propia__1`
const BORRADOR = `${PRO}__propia__2`
const DE_PLANTILLA = `${PRO}__plantilla__dormir`
const IMAGEN = 'imagen1'
const rutaImagen = (listaId: string, imagenId = IMAGEN, uid = PRO) =>
  `listasPro/${uid}/${listaId}/${imagenId}`
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
])

let env: RulesTestEnvironment

function propia(extra: Record<string, unknown> = {}) {
  return {
    profesionalUid: PRO,
    tipo: 'lista',
    titulo: 'Para empezar la semana',
    descripcion: '',
    estado: 'publicado',
    plantillaId: null,
    imagen: null,
    audios: ['audio-1', 'audio-2'],
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    ...extra,
  }
}

function dePlantilla(
  plantillaId = 'dormir',
  extra: Record<string, unknown> = {},
) {
  return propia({ titulo: '', plantillaId, ...extra })
}

describe.each(MODOS)('modo «$nombre»', (modo) => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: 'demo-neuroaudio',
      firestore: { rules: readFileSync(modo.firestore, 'utf8') },
      storage: { rules: readFileSync(modo.storage, 'utf8') },
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
      const ahora = Timestamp.now()
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
      await setDoc(
        doc(db, 'listasProfesional', PUBLICADA),
        propia({ imagen: IMAGEN, creadoEn: ahora, actualizadoEn: ahora }),
      )
      await setDoc(
        doc(db, 'listasProfesional', BORRADOR),
        propia({ estado: 'borrador', creadoEn: ahora, actualizadoEn: ahora }),
      )
      await setDoc(doc(db, 'limitesSubida', PRO), {
        ventanaInicio: ahora,
        cuenta: 1,
        reservada: 'nueva',
        reservadaEn: ahora,
      })
      await uploadBytes(ref(ctx.storage(), rutaImagen(PUBLICADA)), WEBP, {
        contentType: 'image/webp',
      })
      await uploadBytes(ref(ctx.storage(), rutaImagen(BORRADOR)), WEBP, {
        contentType: 'image/webp',
      })
    })
  })

  const pausarVinculo = () =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_${OYENTE}`), {
        estado: 'pausado',
      })
    })

  const leer = (uid: string | null, listaId: string) =>
    getDoc(
      doc(
        (uid
          ? env.authenticatedContext(uid)
          : env.unauthenticatedContext()
        ).firestore(),
        'listasProfesional',
        listaId,
      ),
    )

  describe('Firestore: lectura', () => {
    it('el dueño lee sus listas, también los borradores, y la consulta de su panel funciona', async () => {
      await assertSucceeds(leer(PRO, BORRADOR))
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        getDocs(
          query(
            collection(db, 'listasProfesional'),
            where('profesionalUid', '==', PRO),
          ),
        ),
      )
    })

    it('el dueño puede comprobar si una lista suya aún no existe; la de otro, no', async () => {
      await assertSucceeds(leer(PRO, DE_PLANTILLA))
      await assertFails(leer(OTRO_PRO, DE_PLANTILLA))
    })

    it('un oyente con vínculo activo lee las publicadas (y la consulta de la app funciona)', async () => {
      await assertSucceeds(leer(OYENTE, PUBLICADA))
      const db = env.authenticatedContext(OYENTE).firestore()
      await assertSucceeds(
        getDocs(
          query(
            collection(db, 'listasProfesional'),
            where('profesionalUid', '==', PRO),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
    })

    it('ningún oyente lee un borrador, ni lo lista', async () => {
      await assertFails(leer(OYENTE, BORRADOR))
      const db = env.authenticatedContext(OYENTE).firestore()
      await assertFails(
        getDocs(
          query(
            collection(db, 'listasProfesional'),
            where('profesionalUid', '==', PRO),
          ),
        ),
      )
    })

    it('con el vínculo en pausa, el oyente ya no lee nada', async () => {
      await pausarVinculo()
      await assertFails(leer(OYENTE, PUBLICADA))
    })

    it('ni un usuario sin vínculo, ni otro profesional, ni alguien sin sesión (en los dos modos)', async () => {
      await assertFails(leer(OYENTE_AJENO, PUBLICADA))
      await assertFails(leer(OTRO_PRO, PUBLICADA))
      await assertFails(leer(OTRO_PRO, BORRADOR))
      await assertFails(leer(null, PUBLICADA))
      const db = env.authenticatedContext(OYENTE_AJENO).firestore()
      await assertFails(
        getDocs(
          query(
            collection(db, 'listasProfesional'),
            where('profesionalUid', '==', PRO),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
    })
  })

  describe('Firestore: listas de plantilla', () => {
    it('el profesional crea la de una plantilla con su id fijo', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        setDoc(doc(db, 'listasProfesional', DE_PLANTILLA), dePlantilla()),
      )
    })

    it('no puede repetir plantilla: otra vez el mismo id pisaría la lista, y no se deja', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        setDoc(doc(db, 'listasProfesional', DE_PLANTILLA), dePlantilla()),
      )
      await assertFails(
        setDoc(doc(db, 'listasProfesional', DE_PLANTILLA), dePlantilla()),
      )
      // Ni con otro id.
      await assertFails(
        setDoc(
          doc(db, 'listasProfesional', `${PRO}__plantilla__dormir2`),
          dePlantilla(),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'listasProfesional', `${PRO}__propia__5`),
          dePlantilla(),
        ),
      )
    })

    it('sin nombre ni imagen propios, y solo con las 8 plantillas', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        setDoc(
          doc(db, 'listasProfesional', DE_PLANTILLA),
          dePlantilla('dormir', { titulo: 'Otro nombre' }),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'listasProfesional', DE_PLANTILLA),
          dePlantilla('dormir', { imagen: 'mia' }),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'listasProfesional', `${PRO}__plantilla__inventada`),
          dePlantilla('inventada'),
        ),
      )
    })
  })

  describe('Firestore: listas propias', () => {
    it('crea hasta la número 30; la 31 o un id libre, no', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        setDoc(doc(db, 'listasProfesional', `${PRO}__propia__30`), propia()),
      )
      await assertFails(
        setDoc(doc(db, 'listasProfesional', `${PRO}__propia__31`), propia()),
      )
      await assertFails(
        setDoc(doc(db, 'listasProfesional', `${PRO}__propia__0`), propia()),
      )
      await assertFails(
        setDoc(doc(db, 'listasProfesional', 'cualquier-id'), propia()),
      )
    })

    it('valida campos y límites', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      const id = `${PRO}__propia__3`
      const intentar = (extra: Record<string, unknown>) =>
        setDoc(doc(db, 'listasProfesional', id), propia(extra))
      await assertFails(intentar({ titulo: '' }))
      await assertFails(intentar({ titulo: 'a'.repeat(81) }))
      await assertFails(intentar({ descripcion: 'a'.repeat(2001) }))
      await assertFails(
        intentar({ audios: Array.from({ length: 101 }, (_, i) => `a${i}`) }),
      )
      await assertFails(intentar({ estado: 'oculto' }))
      await assertFails(intentar({ tipo: 'programa' }))
      await assertFails(intentar({ verificado: true }))
      await assertFails(intentar({ imagen: 'x'.repeat(65) }))
      await assertSucceeds(
        intentar({ audios: Array.from({ length: 100 }, (_, i) => `a${i}`) }),
      )
    })

    it('nadie crea listas a nombre de otro', async () => {
      const db = env.authenticatedContext(OTRO_PRO).firestore()
      await assertFails(
        setDoc(doc(db, 'listasProfesional', `${PRO}__propia__4`), propia()),
      )
      await assertFails(
        setDoc(
          doc(db, 'listasProfesional', `${OTRO_PRO}__propia__4`),
          propia(),
        ),
      )
    })
  })

  describe('Firestore: edición y borrado', () => {
    it('el dueño edita (audios, orden, estado, imagen) y borra', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        updateDoc(doc(db, 'listasProfesional', PUBLICADA), {
          audios: ['audio-2', 'audio-1', 'audio-3'],
          estado: 'borrador',
          imagen: 'otra',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertSucceeds(deleteDoc(doc(db, 'listasProfesional', BORRADOR)))
    })

    it('no se puede cambiar el tipo, la plantilla ni la fecha de creación', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      const lista = doc(db, 'listasProfesional', PUBLICADA)
      await assertFails(
        updateDoc(lista, {
          tipo: 'programa',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(lista, {
          plantillaId: 'dormir',
          titulo: '',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(lista, {
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        }),
      )
    })

    it('otro profesional ni edita ni borra las listas del primero; un oyente tampoco', async () => {
      for (const uid of [OTRO_PRO, OYENTE]) {
        const db = env.authenticatedContext(uid).firestore()
        await assertFails(
          updateDoc(doc(db, 'listasProfesional', PUBLICADA), {
            titulo: 'Mía',
            actualizadoEn: serverTimestamp(),
          }),
        )
        await assertFails(deleteDoc(doc(db, 'listasProfesional', PUBLICADA)))
      }
    })
  })

  describe('Storage: imagen propia', () => {
    const bajar = (uid: string | null, ruta: string) =>
      getBytes(
        ref(
          (uid
            ? env.authenticatedContext(uid)
            : env.unauthenticatedContext()
          ).storage(),
          ruta,
        ),
      )

    it('el dueño la descarga; el oyente con vínculo, solo la de una lista publicada', async () => {
      await assertSucceeds(bajar(PRO, rutaImagen(BORRADOR)))
      await assertSucceeds(bajar(OYENTE, rutaImagen(PUBLICADA)))
      await assertFails(bajar(OYENTE, rutaImagen(BORRADOR)))
    })

    it('solo la imagen actual de la lista (una antigua, no)', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await uploadBytes(
          ref(ctx.storage(), rutaImagen(PUBLICADA, 'antigua')),
          WEBP,
          { contentType: 'image/webp' },
        )
      })
      await assertFails(bajar(OYENTE, rutaImagen(PUBLICADA, 'antigua')))
    })

    it('con el vínculo en pausa, ni sin vínculo, ni otro profesional, ni sin sesión', async () => {
      await assertFails(bajar(OYENTE_AJENO, rutaImagen(PUBLICADA)))
      await assertFails(bajar(OTRO_PRO, rutaImagen(PUBLICADA)))
      await assertFails(bajar(null, rutaImagen(PUBLICADA)))
      await pausarVinculo()
      await assertFails(bajar(OYENTE, rutaImagen(PUBLICADA)))
    })

    it('solo la sube el dueño, en una lista propia, solo imagen y solo la reservada', async () => {
      const st = env.authenticatedContext(PRO).storage()
      const subir = (ruta: string, tipo = 'image/webp') =>
        uploadBytes(ref(st, ruta), WEBP, { contentType: tipo })
      await assertSucceeds(subir(rutaImagen(PUBLICADA, 'nueva')))
      await assertFails(subir(rutaImagen(PUBLICADA, 'sin-reservar')))
      await assertFails(subir(rutaImagen(PUBLICADA, 'nueva'), 'text/html'))
      await assertFails(subir(rutaImagen(DE_PLANTILLA, 'nueva')))
      await assertFails(
        uploadBytes(
          ref(
            env.authenticatedContext(OTRO_PRO).storage(),
            rutaImagen(PUBLICADA, 'nueva'),
          ),
          WEBP,
          { contentType: 'image/webp' },
        ),
      )
    })

    it('solo la borra el dueño', async () => {
      await assertFails(
        deleteObject(
          ref(
            env.authenticatedContext(OTRO_PRO).storage(),
            rutaImagen(PUBLICADA),
          ),
        ),
      )
      await assertSucceeds(
        deleteObject(
          ref(env.authenticatedContext(PRO).storage(), rutaImagen(PUBLICADA)),
        ),
      )
    })
  })
})
