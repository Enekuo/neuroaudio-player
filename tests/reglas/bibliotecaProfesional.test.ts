// Tests de las reglas de «Mis audios» (biblioteca del profesional y envíos),
// en Firestore y Storage. Necesitan los emuladores (y Java):
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
} from 'firebase/firestore'
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO_PRO = 'profesional-b'
const OYENTE = 'oyente-1'
const OYENTE_2 = 'oyente-2'
const OYENTE_3 = 'oyente-3' // vínculo activo, pero sin envío
const EN_PAUSA = 'oyente-en-pausa'
const SIN_VINCULO = 'sin-vinculo'
const AUDIO = 'audio-biblioteca'
const GENERAL = 'audio-general'
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
    etiquetas: ['sueño', 'ansiedad'],
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    ...extra,
  }
}

const envio = (audioId: string, oyenteUid: string, extra = {}) => ({
  profesionalUid: PRO,
  audioId,
  oyenteUid,
  creadoEn: serverTimestamp(),
  ...extra,
})

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
        [OYENTE_2, 'activo'],
        [OYENTE_3, 'activo'],
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
      await setDoc(
        doc(db, 'audiosProfesional', AUDIO),
        audio(AUDIO, { creadoEn: ahora, actualizadoEn: ahora }),
      )
      await setDoc(doc(db, 'audiosProfesional', GENERAL), {
        ...audio(GENERAL, { creadoEn: ahora, actualizadoEn: ahora }),
        tipo: 'general',
        archivo: `audiosPro/${PRO}/${GENERAL}/archivo`,
        etiquetas: [],
      })
      // Ya enviado a OYENTE (OYENTE_2 lo recibe en los tests).
      await setDoc(
        doc(db, 'enviosAudio', `${AUDIO}__${OYENTE}`),
        envio(AUDIO, OYENTE, { creadoEn: ahora }),
      )
      await setDoc(doc(db, 'limitesSubidaAudio', PRO), {
        ventanaInicio: ahora,
        cuenta: 1,
        reservada: 'nuevo',
        reservadaEn: ahora,
      })
      await setDoc(doc(db, 'limitesSubida', PRO), {
        ventanaInicio: ahora,
        cuenta: 1,
        reservada: 'img-nueva',
        reservadaEn: ahora,
      })
      const st = ctx.storage()
      await uploadBytes(ref(st, archivo(AUDIO)), MP3, {
        contentType: 'audio/mpeg',
      })
      await uploadBytes(ref(st, portada(AUDIO)), WEBP, {
        contentType: 'image/webp',
      })
    })
  })

  const fs = (uid: string) => env.authenticatedContext(uid).firestore()
  const leer = (uid: string) => getDoc(doc(fs(uid), 'audiosProfesional', AUDIO))
  const bajar = (uid: string | null, ruta = archivo(AUDIO)) =>
    getBytes(
      ref(
        (uid
          ? env.authenticatedContext(uid)
          : env.unauthenticatedContext()
        ).storage(),
        ruta,
      ),
    )
  const enviar = (uid: string, audioId: string, oyente: string, extra = {}) =>
    setDoc(
      doc(fs(uid), 'enviosAudio', `${audioId}__${oyente}`),
      envio(audioId, oyente, extra),
    )
  const misEnvios = (uid: string, oyente = uid) =>
    getDocs(
      query(
        collection(fs(uid), 'enviosAudio'),
        where('profesionalUid', '==', PRO),
        where('oyenteUid', '==', oyente),
      ),
    )
  const pausar = (oyente: string) =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_${oyente}`), {
        estado: 'pausado',
      })
    })

  describe('la biblioteca solo la ve su dueño', () => {
    it('el dueño lee y lista su biblioteca y descarga el archivo y la portada', async () => {
      await assertSucceeds(leer(PRO))
      await assertSucceeds(
        getDocs(
          query(
            collection(fs(PRO), 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'biblioteca'),
          ),
        ),
      )
      await assertSucceeds(bajar(PRO))
      await assertSucceeds(bajar(PRO, portada(AUDIO)))
    })

    it('un oyente con vínculo pero sin envío no lo ve ni lo descarga', async () => {
      await assertFails(leer(OYENTE_3))
      await assertFails(bajar(OYENTE_3))
      await assertFails(bajar(OYENTE_3, portada(AUDIO)))
      await assertFails(
        getDocs(
          query(
            collection(fs(OYENTE_3), 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'biblioteca'),
          ),
        ),
      )
    })

    it('otro profesional ni lo ve, ni lo descarga, ni lo edita, ni lo borra', async () => {
      await assertFails(leer(OTRO_PRO))
      await assertFails(bajar(OTRO_PRO))
      await assertFails(
        updateDoc(doc(fs(OTRO_PRO), 'audiosProfesional', AUDIO), {
          titulo: 'Mío',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        deleteDoc(doc(fs(OTRO_PRO), 'audiosProfesional', AUDIO)),
      )
      await assertFails(
        deleteObject(
          ref(env.authenticatedContext(OTRO_PRO).storage(), archivo(AUDIO)),
        ),
      )
      await assertFails(bajar(null))
    })
  })

  describe('enviar', () => {
    it('lo envía a dos personas a la vez: las dos lo leen, lo descargan y lo ven en «Para ti»', async () => {
      await assertSucceeds(enviar(PRO, AUDIO, OYENTE_2))
      for (const oyente of [OYENTE, OYENTE_2]) {
        await assertSucceeds(leer(oyente))
        await assertSucceeds(bajar(oyente))
        await assertSucceeds(bajar(oyente, portada(AUDIO)))
        const snap = await assertSucceeds(misEnvios(oyente))
        expect(snap.docs.map((d) => d.data().audioId)).toEqual([AUDIO])
      }
      // El tercero sigue sin verlo, ni consultando los envíos de otro.
      await assertFails(leer(OYENTE_3))
      await assertFails(bajar(OYENTE_3))
      const suyos = await assertSucceeds(misEnvios(OYENTE_3))
      expect(suyos.docs).toHaveLength(0)
      await assertFails(misEnvios(OYENTE_3, OYENTE))
    })

    it('no a alguien sin vínculo activo (ni en pausa, ni de otro profesional)', async () => {
      await assertFails(enviar(PRO, AUDIO, EN_PAUSA))
      await assertFails(enviar(PRO, AUDIO, SIN_VINCULO))
      await assertFails(enviar(PRO, AUDIO, 'nadie'))
    })

    it('solo sus propios audios de la biblioteca (ni generales, ni de otro)', async () => {
      await assertFails(enviar(PRO, GENERAL, OYENTE_2))
      await assertFails(
        setDoc(doc(fs(OTRO_PRO), 'enviosAudio', `${AUDIO}__${OYENTE_2}`), {
          ...envio(AUDIO, OYENTE_2),
          profesionalUid: OTRO_PRO,
        }),
      )
      await assertFails(enviar(OYENTE_2, AUDIO, OYENTE_2))
    })

    it('id, campos y repeticiones: no se puede pisar ni inventar', async () => {
      await assertFails(enviar(PRO, AUDIO, OYENTE)) // ya enviado
      await assertFails(
        setDoc(doc(fs(PRO), 'enviosAudio', 'otro-id'), envio(AUDIO, OYENTE_2)),
      )
      await assertFails(enviar(PRO, AUDIO, OYENTE_2, { nota: 'hola' }))
      await assertFails(
        updateDoc(doc(fs(PRO), 'enviosAudio', `${AUDIO}__${OYENTE}`), {
          creadoEn: serverTimestamp(),
        }),
      )
    })
  })

  describe('retirar y pausar cortan el acceso', () => {
    it('al retirárselo, deja de verlo y de descargarlo', async () => {
      await assertSucceeds(
        deleteDoc(doc(fs(PRO), 'enviosAudio', `${AUDIO}__${OYENTE}`)),
      )
      await assertFails(leer(OYENTE))
      await assertFails(bajar(OYENTE))
      await assertFails(bajar(OYENTE, portada(AUDIO)))
    })

    it('con el vínculo en pausa, tampoco', async () => {
      await pausar(OYENTE)
      await assertFails(leer(OYENTE))
      await assertFails(bajar(OYENTE))
    })

    it('solo el profesional retira: ni el oyente ni otro profesional', async () => {
      await assertFails(
        deleteDoc(doc(fs(OYENTE), 'enviosAudio', `${AUDIO}__${OYENTE}`)),
      )
      await assertFails(
        deleteDoc(doc(fs(OTRO_PRO), 'enviosAudio', `${AUDIO}__${OYENTE}`)),
      )
      await assertFails(
        getDocs(
          query(
            collection(fs(OTRO_PRO), 'enviosAudio'),
            where('profesionalUid', '==', PRO),
          ),
        ),
      )
      await assertSucceeds(
        getDocs(
          query(
            collection(fs(PRO), 'enviosAudio'),
            where('profesionalUid', '==', PRO),
          ),
        ),
      )
    })
  })

  describe('validación de los audios de la biblioteca', () => {
    const crear = (id: string, extra: Record<string, unknown>) =>
      setDoc(doc(fs(PRO), 'audiosProfesional', id), audio(id, extra))

    it('archivo en su carpeta, etiquetas válidas y sin destinatario', async () => {
      await assertSucceeds(
        crear('b-ok', { portada: 'defecto', portadaImagen: null }),
      )
      await assertSucceeds(
        crear('b-sin-etiquetas', {
          etiquetas: [],
          portada: 'defecto',
          portadaImagen: null,
        }),
      )
      await assertFails(
        crear('b-ruta', { archivo: `audiosPro/${PRO}/b-ruta/archivo` }),
      )
      await assertFails(crear('b-dest', { destinatarioUid: OYENTE }))
      await assertFails(
        crear('b-6', { etiquetas: ['a', 'b', 'c', 'd', 'e', 'f'] }),
      )
      await assertFails(crear('b-larga', { etiquetas: ['a'.repeat(31)] }))
      await assertFails(crear('b-vacia', { etiquetas: [''] }))
      await assertFails(crear('b-num', { etiquetas: [7] }))
      // Un general no puede usar la carpeta de la biblioteca.
      await assertFails(
        setDoc(doc(fs(PRO), 'audiosProfesional', 'g-ruta'), {
          ...audio('g-ruta'),
          tipo: 'general',
        }),
      )
    })

    it('no se puede cambiar el tipo de un audio de la biblioteca', async () => {
      await assertFails(
        updateDoc(doc(fs(PRO), 'audiosProfesional', AUDIO), {
          tipo: 'general',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertSucceeds(
        updateDoc(doc(fs(PRO), 'audiosProfesional', AUDIO), {
          titulo: 'Nuevo título',
          etiquetas: ['sueño'],
          actualizadoEn: serverTimestamp(),
        }),
      )
    })

    it('Storage: solo el dueño sube (reservado) y borra', async () => {
      const st = env.authenticatedContext(PRO).storage()
      await assertSucceeds(
        uploadBytes(ref(st, archivo('nuevo')), MP3, {
          contentType: 'audio/mpeg',
        }),
      )
      await assertFails(
        uploadBytes(ref(st, archivo('sin-reservar')), MP3, {
          contentType: 'audio/mpeg',
        }),
      )
      await assertSucceeds(
        uploadBytes(ref(st, portada(AUDIO, 'img-nueva')), WEBP, {
          contentType: 'image/webp',
        }),
      )
      await assertFails(
        uploadBytes(
          ref(
            env.authenticatedContext(OTRO_PRO).storage(),
            archivo('nuevo', PRO),
          ),
          MP3,
          { contentType: 'audio/mpeg' },
        ),
      )
      await assertFails(
        uploadBytes(
          ref(env.authenticatedContext(OYENTE).storage(), archivo('nuevo')),
          MP3,
          {
            contentType: 'audio/mpeg',
          },
        ),
      )
      await assertSucceeds(deleteObject(ref(st, portada(AUDIO))))
    })
  })
})
