// Tests de las reglas de «añadir a Audios un audio de Biblioteca»: un audio
// general {B}__general con deMisAudios: B que usa el archivo de B (sin
// copiarlo). Necesitan los emuladores (y Java):
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
  writeBatch,
} from 'firebase/firestore'
import { getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO_PRO = 'profesional-b'
const OYENTE = 'oyente-1' // vínculo activo, sin ningún envío
const EN_PAUSA = 'oyente-en-pausa'
const SIN_VINCULO = 'sin-vinculo'
const B = 'audio-biblioteca'
const G = `${B}__general`
const C = 'audio-biblioteca-otro' // de OTRO_PRO
const NORMAL = 'audio-general-normal'
const archivo = (id: string, uid = PRO) => `bibliotecaPro/${uid}/${id}/archivo`
const portada = (id: string, img = 'img1') =>
  `bibliotecaPro/${PRO}/${id}/portadas/${img}`
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0])
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
])

let env: RulesTestEnvironment

function audio(id: string, extra: Record<string, unknown> = {}) {
  return {
    profesionalUid: PRO,
    titulo: 'Respirar antes de dormir',
    descripcion: '',
    estado: 'publicado',
    tipo: 'biblioteca',
    destinatarioUid: null,
    archivo: archivo(id),
    duracionSegundos: 600,
    tamanoBytes: 1000,
    contieneSalud: false,
    orden: 0,
    portada: 'propia',
    portadaImagen: 'img1',
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    ...extra,
  }
}

/** El general que se crea al añadir B a Audios (sin etiquetas). */
const general = (extra: Record<string, unknown> = {}) =>
  audio(B, { tipo: 'general', deMisAudios: B, ...extra })

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
      for (const [oyente, estado] of [
        [OYENTE, 'activo'],
        [EN_PAUSA, 'pausado'],
      ]) {
        await setDoc(doc(db, 'vinculos', `${PRO}_${oyente}`), {
          profesionalUid: PRO,
          oyenteUid: oyente,
          estado,
        })
      }
      await setDoc(doc(db, 'vinculos', `${OTRO_PRO}_${SIN_VINCULO}`), {
        profesionalUid: OTRO_PRO,
        oyenteUid: SIN_VINCULO,
        estado: 'activo',
      })
      const fechas = { creadoEn: ahora, actualizadoEn: ahora }
      await setDoc(doc(db, 'audiosProfesional', B), {
        ...audio(B, fechas),
        etiquetas: ['sueño'],
      })
      await setDoc(
        doc(db, 'audiosProfesional', C),
        audio(C, {
          ...fechas,
          profesionalUid: OTRO_PRO,
          archivo: archivo(C, OTRO_PRO),
        }),
      )
      await setDoc(
        doc(db, 'audiosProfesional', NORMAL),
        audio(NORMAL, {
          ...fechas,
          tipo: 'general',
          archivo: `audiosPro/${PRO}/${NORMAL}/archivo`,
        }),
      )
      const st = ctx.storage()
      await uploadBytes(ref(st, archivo(B)), MP3, { contentType: 'audio/mpeg' })
      for (const img of ['img1', 'img2']) {
        await uploadBytes(ref(st, portada(B, img)), WEBP, {
          contentType: 'image/webp',
        })
      }
    })
  })

  const fs = (uid: string) => env.authenticatedContext(uid).firestore()
  const bajar = (uid: string | null, ruta = archivo(B)) =>
    getBytes(
      ref(
        (uid
          ? env.authenticatedContext(uid)
          : env.unauthenticatedContext()
        ).storage(),
        ruta,
      ),
    )
  /** Pone el general ya creado (sin reglas), con lo que se le pase. */
  const yaEnAudios = (extra: Record<string, unknown> = {}) =>
    env.withSecurityRulesDisabled(async (ctx) => {
      const ahora = Timestamp.now()
      await setDoc(
        doc(ctx.firestore(), 'audiosProfesional', G),
        general({ creadoEn: ahora, actualizadoEn: ahora, ...extra }),
      )
      // Publicado en Audios: la marca que mira Storage (publicoEnAudios).
      await updateDoc(doc(ctx.firestore(), 'audiosProfesional', B), {
        enAudios: true,
        publicoEnAudios: (extra.estado ?? 'publicado') === 'publicado',
      })
    })
  const crearComo = (uid: string, id: string, datos: Record<string, unknown>) =>
    setDoc(doc(fs(uid), 'audiosProfesional', id), datos)

  describe('añadir a Audios', () => {
    it('el profesional lo añade, publicado, y marca «En Audios» en una sola escritura', async () => {
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.set(doc(db, 'audiosProfesional', G), general())
      lote.update(doc(db, 'audiosProfesional', B), {
        enAudios: true,
        publicoEnAudios: true,
        actualizadoEn: serverTimestamp(),
      })
      await assertSucceeds(lote.commit())
    })

    it('id, origen y tamaño tienen que cuadrar', async () => {
      // Otro id que no es {B}__general.
      await assertFails(crearComo(PRO, 'otro-id', general()))
      // El origen no es de la Biblioteca (un general normal).
      await assertFails(
        crearComo(
          PRO,
          `${NORMAL}__general`,
          general({ deMisAudios: NORMAL, archivo: archivo(NORMAL) }),
        ),
      )
      // El origen no existe.
      await assertFails(
        crearComo(
          PRO,
          'no-existe__general',
          general({ deMisAudios: 'no-existe', archivo: archivo('no-existe') }),
        ),
      )
      // Pesa distinto que el original.
      await assertFails(crearComo(PRO, G, general({ tamanoBytes: 2000 })))
      // Su archivo no es el del original.
      await assertFails(
        crearComo(
          PRO,
          G,
          general({ archivo: `audiosPro/${PRO}/${G}/archivo` }),
        ),
      )
      // Un general sin deMisAudios no puede usar un archivo de la Biblioteca.
      await assertFails(
        crearComo(
          PRO,
          'suelto',
          audio('suelto', { tipo: 'general', archivo: archivo(B) }),
        ),
      )
      // deMisAudios solo en los generales.
      await assertFails(
        crearComo(
          PRO,
          G,
          general({ tipo: 'personal', destinatarioUid: OYENTE }),
        ),
      )
      await assertFails(
        crearComo(PRO, 'nuevo-bib', audio('nuevo-bib', { deMisAudios: B })),
      )
    })

    it('otro profesional no puede apuntar a tu archivo', async () => {
      // Con tu archivo y tu audio de origen.
      await assertFails(
        crearComo(OTRO_PRO, G, general({ profesionalUid: OTRO_PRO })),
      )
      // Desde su propio audio, pero apuntando a tu archivo.
      await assertFails(
        crearComo(
          OTRO_PRO,
          `${C}__general`,
          general({
            profesionalUid: OTRO_PRO,
            deMisAudios: C,
            archivo: archivo(B),
          }),
        ),
      )
      // Apuntando a tu audio con una ruta en su carpeta.
      await assertFails(
        crearComo(
          OTRO_PRO,
          G,
          general({ profesionalUid: OTRO_PRO, archivo: archivo(B, OTRO_PRO) }),
        ),
      )
    })
  })

  describe('escucharlo como audio general', () => {
    it('un oyente con vínculo (sin envío) lo ve en Audios y descarga el archivo y su portada', async () => {
      await yaEnAudios()
      await assertSucceeds(getDoc(doc(fs(OYENTE), 'audiosProfesional', G)))
      await assertSucceeds(
        getDocs(
          query(
            collection(fs(OYENTE), 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'general'),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
      await assertSucceeds(bajar(OYENTE))
      await assertSucceeds(bajar(OYENTE, portada(B)))
    })

    it('pero no el audio de la Biblioteca (ni sus etiquetas) ni otra imagen', async () => {
      await yaEnAudios()
      await assertFails(getDoc(doc(fs(OYENTE), 'audiosProfesional', B)))
      await assertFails(bajar(OYENTE, portada(B, 'img2')))
    })

    it('sin vínculo, en pausa o sin sesión, no lo descarga', async () => {
      await yaEnAudios()
      await assertFails(bajar(SIN_VINCULO))
      await assertFails(bajar(EN_PAUSA))
      await assertFails(bajar(null))
      await assertFails(bajar(SIN_VINCULO, portada(B)))
    })

    it('en borrador, no lo descarga nadie más que su dueño', async () => {
      await yaEnAudios({ estado: 'borrador' })
      await assertFails(bajar(OYENTE))
      await assertFails(bajar(OYENTE, portada(B)))
      await assertSucceeds(bajar(PRO))
    })

    it('si no está en Audios, sin envío no lo descarga', async () => {
      await assertFails(bajar(OYENTE))
      await assertFails(bajar(OYENTE, portada(B)))
    })
  })

  describe('editar y quitar', () => {
    it('título, descripción, imagen y salud se guardan en los dos a la vez', async () => {
      await yaEnAudios()
      const db = fs(PRO)
      const lote = writeBatch(db)
      const cambios = {
        titulo: 'Nuevo título',
        descripcion: 'Nueva descripción',
        contieneSalud: true,
        portada: 'defecto',
        portadaImagen: null,
        actualizadoEn: serverTimestamp(),
      }
      lote.update(doc(db, 'audiosProfesional', B), cambios)
      lote.update(doc(db, 'audiosProfesional', G), cambios)
      await assertSucceeds(lote.commit())
    })

    it('despublicarlo en Audios quita la marca del original en la misma escritura', async () => {
      await yaEnAudios()
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.update(doc(db, 'audiosProfesional', G), {
        estado: 'borrador',
        actualizadoEn: serverTimestamp(),
      })
      lote.update(doc(db, 'audiosProfesional', B), {
        publicoEnAudios: false,
        actualizadoEn: serverTimestamp(),
      })
      await assertSucceeds(lote.commit())
      await assertFails(bajar(OYENTE))
    })

    it('deMisAudios no se puede cambiar ni quitar', async () => {
      await yaEnAudios()
      const ref = doc(fs(PRO), 'audiosProfesional', G)
      await assertFails(
        updateDoc(ref, {
          deMisAudios: NORMAL,
          actualizadoEn: serverTimestamp(),
        }),
      )
      const sinOrigen = general({ creadoEn: Timestamp.now() })
      delete (sinOrigen as Record<string, unknown>).deMisAudios
      await assertFails(setDoc(ref, sinOrigen))
    })

    it('«En Audios» solo en los de la Biblioteca y verdadero o falso', async () => {
      await assertFails(
        updateDoc(doc(fs(PRO), 'audiosProfesional', B), {
          enAudios: 'sí',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(doc(fs(PRO), 'audiosProfesional', NORMAL), {
          enAudios: true,
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(doc(fs(OTRO_PRO), 'audiosProfesional', B), {
          enAudios: false,
          actualizadoEn: serverTimestamp(),
        }),
      )
    })

    it('quitarlo de Audios: borra el general y desmarca el original; el archivo sigue', async () => {
      await yaEnAudios()
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.delete(doc(db, 'audiosProfesional', G))
      lote.update(doc(db, 'audiosProfesional', B), {
        enAudios: false,
        publicoEnAudios: false,
        actualizadoEn: serverTimestamp(),
      })
      await assertSucceeds(lote.commit())
      await assertSucceeds(bajar(PRO))
      // Ya no está en Audios: el oyente sin envío deja de descargarlo.
      await assertFails(bajar(OYENTE))
    })

    it('borrarlo de la Biblioteca lo quita de los dos a la vez; otro profesional no', async () => {
      await yaEnAudios()
      await assertFails(deleteDoc(doc(fs(OTRO_PRO), 'audiosProfesional', G)))
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.delete(doc(db, 'audiosProfesional', B))
      lote.delete(doc(db, 'audiosProfesional', G))
      await assertSucceeds(lote.commit())
    })
  })
})
