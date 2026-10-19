// Tests de las reglas de los audios del profesional (Firestore y Storage).
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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO_PRO = 'profesional-b'
const OYENTE = 'oyente-de-a'
const OYENTE_AJENO = 'oyente-de-b'
const PUBLICADO = 'audio-publicado'
const BORRADOR = 'audio-borrador'
const ruta = (id: string, uid = PRO) => `audiosPro/${uid}/${id}/archivo`
const MP3 = new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0])

let env: RulesTestEnvironment

function audio(id: string, extra: Record<string, unknown> = {}) {
  return {
    profesionalUid: PRO,
    titulo: 'Respiración para dormir',
    descripcion: '',
    estado: 'publicado',
    tipo: 'general',
    destinatarioUid: null,
    archivo: ruta(id),
    duracionSegundos: 600,
    tamanoBytes: 1000,
    contieneSalud: false,
    orden: 0,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    ...extra,
  }
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
        doc(db, 'audiosProfesional', PUBLICADO),
        audio(PUBLICADO, { creadoEn: ahora, actualizadoEn: ahora }),
      )
      await setDoc(
        doc(db, 'audiosProfesional', BORRADOR),
        audio(BORRADOR, {
          estado: 'borrador',
          creadoEn: ahora,
          actualizadoEn: ahora,
        }),
      )
      await setDoc(doc(db, 'limitesSubidaAudio', PRO), {
        ventanaInicio: ahora,
        cuenta: 1,
        reservada: 'nuevo',
        reservadaEn: ahora,
      })
      const st = ctx.storage()
      await uploadBytes(ref(st, ruta(PUBLICADO)), MP3, {
        contentType: 'audio/mpeg',
      })
      await uploadBytes(ref(st, ruta(BORRADOR)), MP3, {
        contentType: 'audio/mpeg',
      })
    })
  })

  const pausarVinculo = () =>
    env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_${OYENTE}`), {
        estado: 'pausado',
      })
    })

  describe('Firestore: lectura', () => {
    it('el dueño lee sus audios, también los borradores', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(getDoc(doc(db, 'audiosProfesional', BORRADOR)))
      await assertSucceeds(
        getDocs(
          query(
            collection(db, 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'general'),
          ),
        ),
      )
    })

    it('un oyente con vínculo activo lee los publicados (y la consulta de la app funciona)', async () => {
      const db = env.authenticatedContext(OYENTE).firestore()
      await assertSucceeds(getDoc(doc(db, 'audiosProfesional', PUBLICADO)))
      await assertSucceeds(
        getDocs(
          query(
            collection(db, 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'general'),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
    })

    it('ningún oyente lee un borrador', async () => {
      await assertFails(
        getDoc(
          doc(
            env.authenticatedContext(OYENTE).firestore(),
            'audiosProfesional',
            BORRADOR,
          ),
        ),
      )
    })

    it('con el vínculo en pausa, el oyente ya no lee nada', async () => {
      await pausarVinculo()
      await assertFails(
        getDoc(
          doc(
            env.authenticatedContext(OYENTE).firestore(),
            'audiosProfesional',
            PUBLICADO,
          ),
        ),
      )
    })

    it('ni un oyente ajeno, ni otro profesional, ni alguien sin sesión', async () => {
      await assertFails(
        getDoc(
          doc(
            env.authenticatedContext(OYENTE_AJENO).firestore(),
            'audiosProfesional',
            PUBLICADO,
          ),
        ),
      )
      await assertFails(
        getDoc(
          doc(
            env.authenticatedContext(OTRO_PRO).firestore(),
            'audiosProfesional',
            PUBLICADO,
          ),
        ),
      )
      await assertFails(
        getDoc(
          doc(
            env.unauthenticatedContext().firestore(),
            'audiosProfesional',
            PUBLICADO,
          ),
        ),
      )
    })

    // En los dos modos: ver el perfil no da acceso a los audios.
    it('un usuario sin vínculo no lista los audios publicados (la consulta de la app)', async () => {
      const db = env.authenticatedContext(OYENTE_AJENO).firestore()
      await assertFails(
        getDocs(
          query(
            collection(db, 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'general'),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
    })

    it('un audio personal solo lo lee su destinatario con vínculo activo', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        const ahora = Timestamp.now()
        await setDoc(
          doc(ctx.firestore(), 'audiosProfesional', 'personal'),
          audio('personal', {
            tipo: 'personal',
            destinatarioUid: OYENTE,
            creadoEn: ahora,
            actualizadoEn: ahora,
          }),
        )
      })
      await assertSucceeds(
        getDoc(
          doc(
            env.authenticatedContext(OYENTE).firestore(),
            'audiosProfesional',
            'personal',
          ),
        ),
      )
      await assertFails(
        getDoc(
          doc(
            env.authenticatedContext('otro-oyente-de-a').firestore(),
            'audiosProfesional',
            'personal',
          ),
        ),
      )
    })
  })

  describe('Firestore: escritura', () => {
    it('el profesional crea, edita y borra sus audios', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        setDoc(
          doc(db, 'audiosProfesional', 'nuevo'),
          audio('nuevo', { estado: 'borrador' }),
        ),
      )
      await assertSucceeds(
        updateDoc(doc(db, 'audiosProfesional', 'nuevo'), {
          titulo: 'Otro título',
          estado: 'publicado',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertSucceeds(deleteDoc(doc(db, 'audiosProfesional', 'nuevo')))
    })

    it('otro profesional no puede editar ni borrar los audios del primero', async () => {
      const db = env.authenticatedContext(OTRO_PRO).firestore()
      await assertFails(
        updateDoc(doc(db, 'audiosProfesional', PUBLICADO), {
          titulo: 'Mío',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(deleteDoc(doc(db, 'audiosProfesional', PUBLICADO)))
      await assertFails(
        setDoc(doc(db, 'audiosProfesional', 'falso'), {
          ...audio('falso'),
          profesionalUid: PRO,
        }),
      )
    })

    it('valida campos y límites', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'x1'),
          audio('x1', { titulo: 'a'.repeat(121) }),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'x2'),
          audio('x2', { descripcion: 'a'.repeat(2001) }),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'x3'),
          audio('x3', { estado: 'retirado' }),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'x4'),
          audio('x4', { archivo: ruta('otro') }),
        ),
      )
      await assertFails(
        setDoc(doc(db, 'audiosProfesional', 'x5'), audio('x5', { precio: 10 })),
      )
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'x6'),
          audio('x6', { tipo: 'general', destinatarioUid: OYENTE }),
        ),
      )
    })

    it('un audio personal solo para alguien con vínculo activo', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        setDoc(
          doc(db, 'audiosProfesional', 'p1'),
          audio('p1', { tipo: 'personal', destinatarioUid: OYENTE }),
        ),
      )
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'p2'),
          audio('p2', { tipo: 'personal', destinatarioUid: OYENTE_AJENO }),
        ),
      )
    })

    it('no se puede cambiar el tipo ni el archivo de un audio existente', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        updateDoc(doc(db, 'audiosProfesional', PUBLICADO), {
          tipo: 'personal',
          destinatarioUid: OYENTE,
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(doc(db, 'audiosProfesional', PUBLICADO), {
          archivo: ruta('otro'),
          actualizadoEn: serverTimestamp(),
        }),
      )
    })
  })

  describe('Storage', () => {
    it('el dueño descarga sus archivos; el oyente con vínculo, solo los publicados', async () => {
      await assertSucceeds(
        getBytes(ref(env.authenticatedContext(PRO).storage(), ruta(BORRADOR))),
      )
      await assertSucceeds(
        getBytes(
          ref(env.authenticatedContext(OYENTE).storage(), ruta(PUBLICADO)),
        ),
      )
      await assertFails(
        getBytes(
          ref(env.authenticatedContext(OYENTE).storage(), ruta(BORRADOR)),
        ),
      )
    })

    it('con el vínculo en pausa, el oyente no descarga nada', async () => {
      await pausarVinculo()
      await assertFails(
        getBytes(
          ref(env.authenticatedContext(OYENTE).storage(), ruta(PUBLICADO)),
        ),
      )
    })

    it('ni oyentes ajenos, ni otro profesional, ni sin sesión', async () => {
      await assertFails(
        getBytes(
          ref(
            env.authenticatedContext(OYENTE_AJENO).storage(),
            ruta(PUBLICADO),
          ),
        ),
      )
      await assertFails(
        getBytes(
          ref(env.authenticatedContext(OTRO_PRO).storage(), ruta(PUBLICADO)),
        ),
      )
      await assertFails(
        getBytes(ref(env.unauthenticatedContext().storage(), ruta(PUBLICADO))),
      )
    })

    it('solo sube el dueño, solo audio, solo el archivo reservado', async () => {
      const st = env.authenticatedContext(PRO).storage()
      await assertSucceeds(
        uploadBytes(ref(st, ruta('nuevo')), MP3, { contentType: 'audio/mpeg' }),
      )
      await assertFails(
        uploadBytes(ref(st, ruta('sin-reservar')), MP3, {
          contentType: 'audio/mpeg',
        }),
      )
      await assertFails(
        uploadBytes(ref(st, ruta('nuevo')), MP3, { contentType: 'text/html' }),
      )
      await assertFails(
        uploadBytes(
          ref(env.authenticatedContext(OTRO_PRO).storage(), ruta('nuevo')),
          MP3,
          { contentType: 'audio/mpeg' },
        ),
      )
    })

    it('las rutas de audios/{uid} de la app siguen igual (solo su dueño)', async () => {
      await assertSucceeds(
        uploadBytes(
          ref(
            env.authenticatedContext(OYENTE).storage(),
            `audios/${OYENTE}/mio.mp3`,
          ),
          MP3,
          { contentType: 'audio/mpeg' },
        ),
      )
      await assertFails(
        getBytes(
          ref(
            env.authenticatedContext(PRO).storage(),
            `audios/${OYENTE}/mio.mp3`,
          ),
        ),
      )
    })
  })

  // «Para una persona»: un audio personal es solo de su destinatario. Otro
  // oyente con vínculo activo con el MISMO profesional no lo ve nunca.
  describe('Audios personales', () => {
    const OTRO_OYENTE_DE_A = 'otro-oyente-de-a'
    const PERSONAL = 'audio-personal'
    const BORRADOR_PERSONAL = 'audio-personal-borrador'

    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore()
        const ahora = Timestamp.now()
        await setDoc(doc(db, 'vinculos', `${PRO}_${OTRO_OYENTE_DE_A}`), {
          profesionalUid: PRO,
          oyenteUid: OTRO_OYENTE_DE_A,
          estado: 'activo',
          oyenteNombre: 'Ana Gil',
        })
        for (const [id, estado] of [
          [PERSONAL, 'publicado'],
          [BORRADOR_PERSONAL, 'borrador'],
        ] as const) {
          await setDoc(
            doc(db, 'audiosProfesional', id),
            audio(id, {
              tipo: 'personal',
              destinatarioUid: OYENTE,
              estado,
              creadoEn: ahora,
              actualizadoEn: ahora,
            }),
          )
          await uploadBytes(ref(ctx.storage(), ruta(id)), MP3, {
            contentType: 'audio/mpeg',
          })
        }
      })
    })

    const leer = (uid: string, id = PERSONAL) =>
      getDoc(
        doc(env.authenticatedContext(uid).firestore(), 'audiosProfesional', id),
      )
    const bajar = (uid: string, id = PERSONAL) =>
      getBytes(ref(env.authenticatedContext(uid).storage(), ruta(id)))
    const paraMi = (uid: string) =>
      getDocs(
        query(
          collection(
            env.authenticatedContext(uid).firestore(),
            'audiosProfesional',
          ),
          where('profesionalUid', '==', PRO),
          where('tipo', '==', 'personal'),
          where('destinatarioUid', '==', uid),
          where('estado', '==', 'publicado'),
        ),
      )

    it('su destinatario lo lee, lo descarga y le sale en «Para ti»', async () => {
      await assertSucceeds(leer(OYENTE))
      await assertSucceeds(bajar(OYENTE))
      const snap = await assertSucceeds(paraMi(OYENTE))
      expect(snap.docs.map((d) => d.id)).toEqual([PERSONAL])
    })

    it('otro oyente con vínculo activo con el mismo profesional NO lo ve ni lo descarga', async () => {
      await assertFails(leer(OTRO_OYENTE_DE_A))
      await assertFails(bajar(OTRO_OYENTE_DE_A))
      // Su propio «Para ti» no le trae el audio de otro.
      const snap = await assertSucceeds(paraMi(OTRO_OYENTE_DE_A))
      expect(snap.docs).toHaveLength(0)
      // Ni pidiéndolo con el uid del destinatario.
      await assertFails(
        getDocs(
          query(
            collection(
              env.authenticatedContext(OTRO_OYENTE_DE_A).firestore(),
              'audiosProfesional',
            ),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'personal'),
            where('destinatarioUid', '==', OYENTE),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
    })

    it('un borrador personal no lo ve ni su destinatario', async () => {
      await assertFails(leer(OYENTE, BORRADOR_PERSONAL))
      await assertFails(bajar(OYENTE, BORRADOR_PERSONAL))
    })

    it('con el vínculo del destinatario en pausa, deja de verlo', async () => {
      await pausarVinculo()
      await assertFails(leer(OYENTE))
      await assertFails(bajar(OYENTE))
      await assertFails(paraMi(OYENTE))
    })

    it('el profesional ve sus audios personales y lista sus oyentes (con su nombre)', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertSucceeds(
        getDocs(
          query(
            collection(db, 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'personal'),
          ),
        ),
      )
      const oyentes = await assertSucceeds(
        getDocs(
          query(collection(db, 'vinculos'), where('profesionalUid', '==', PRO)),
        ),
      )
      expect(
        oyentes.docs.map((d) => d.data().oyenteNombre ?? null).sort(),
      ).toEqual(['Ana Gil', null])
    })

    it('otro profesional ni ve, ni edita, ni borra los audios personales del primero', async () => {
      await assertFails(leer(OTRO_PRO))
      await assertFails(bajar(OTRO_PRO))
      const db = env.authenticatedContext(OTRO_PRO).firestore()
      await assertFails(
        getDocs(
          query(
            collection(db, 'audiosProfesional'),
            where('profesionalUid', '==', PRO),
            where('tipo', '==', 'personal'),
          ),
        ),
      )
      await assertFails(
        updateDoc(doc(db, 'audiosProfesional', PERSONAL), {
          titulo: 'Mío',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(deleteDoc(doc(db, 'audiosProfesional', PERSONAL)))
      // Ni lista los oyentes del primero.
      await assertFails(
        getDocs(
          query(collection(db, 'vinculos'), where('profesionalUid', '==', PRO)),
        ),
      )
    })

    it('no se puede cambiar la persona de un audio ya creado', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        updateDoc(doc(db, 'audiosProfesional', PERSONAL), {
          destinatarioUid: OTRO_OYENTE_DE_A,
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertSucceeds(
        updateDoc(doc(db, 'audiosProfesional', PERSONAL), {
          titulo: 'Para tu semana',
          estado: 'borrador',
          actualizadoEn: serverTimestamp(),
        }),
      )
    })

    it('no se puede dirigir un audio a alguien sin vínculo activo (ni a un vínculo en pausa)', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'p-sin-vinculo'),
          audio('p-sin-vinculo', {
            tipo: 'personal',
            destinatarioUid: 'alguien-sin-vinculo',
          }),
        ),
      )
      await pausarVinculo()
      await assertFails(
        setDoc(
          doc(db, 'audiosProfesional', 'p-en-pausa'),
          audio('p-en-pausa', { tipo: 'personal', destinatarioUid: OYENTE }),
        ),
      )
    })
  })

  // Portada elegible: la imagen propia de un audio la ve quien puede
  // escucharlo (en uno personal, solo su destinatario).
  describe('Portada del audio', () => {
    const OTRO_OYENTE_DE_A = 'otro-oyente-de-a'
    const GENERAL = 'audio-con-portada'
    const PERSONAL = 'personal-con-portada'
    const BORRADOR_P = 'borrador-con-portada'
    const portada = (id: string, imagenId = `img-${id}`) =>
      `audiosPro/${PRO}/${id}/portadas/${imagenId}`
    const PNG = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ])

    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore()
        const ahora = Timestamp.now()
        await setDoc(doc(db, 'vinculos', `${PRO}_${OTRO_OYENTE_DE_A}`), {
          profesionalUid: PRO,
          oyenteUid: OTRO_OYENTE_DE_A,
          estado: 'activo',
        })
        const crear = (id: string, extra: Record<string, unknown>) =>
          setDoc(
            doc(db, 'audiosProfesional', id),
            audio(id, {
              portada: 'propia',
              portadaImagen: `img-${id}`,
              creadoEn: ahora,
              actualizadoEn: ahora,
              ...extra,
            }),
          )
        await crear(GENERAL, {})
        await crear(PERSONAL, { tipo: 'personal', destinatarioUid: OYENTE })
        await crear(BORRADOR_P, { estado: 'borrador' })
        await setDoc(doc(db, 'limitesSubida', PRO), {
          ventanaInicio: ahora,
          cuenta: 1,
          reservada: 'img-nueva',
          reservadaEn: ahora,
        })
        const st = ctx.storage()
        for (const id of [GENERAL, PERSONAL, BORRADOR_P]) {
          await uploadBytes(ref(st, portada(id)), PNG, {
            contentType: 'image/webp',
          })
        }
        await uploadBytes(ref(st, portada(GENERAL, 'img-antigua')), PNG, {
          contentType: 'image/webp',
        })
      })
    })

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

    it('la de un audio general la ven el dueño y sus oyentes con vínculo activo', async () => {
      await assertSucceeds(bajar(PRO, portada(GENERAL)))
      await assertSucceeds(bajar(OYENTE, portada(GENERAL)))
      await assertSucceeds(bajar(OTRO_OYENTE_DE_A, portada(GENERAL)))
    })

    it('la de un audio personal solo la ve su destinatario (y el dueño)', async () => {
      await assertSucceeds(bajar(PRO, portada(PERSONAL)))
      await assertSucceeds(bajar(OYENTE, portada(PERSONAL)))
      await assertFails(bajar(OTRO_OYENTE_DE_A, portada(PERSONAL)))
    })

    it('ni sin vínculo, ni otro profesional, ni sin sesión; ni con el vínculo en pausa', async () => {
      await assertFails(bajar(OYENTE_AJENO, portada(GENERAL)))
      await assertFails(bajar(OTRO_PRO, portada(GENERAL)))
      await assertFails(bajar(null, portada(GENERAL)))
      await pausarVinculo()
      await assertFails(bajar(OYENTE, portada(GENERAL)))
      await assertFails(bajar(OYENTE, portada(PERSONAL)))
    })

    it('ni la de un audio en borrador, ni una imagen que ya no es su portada', async () => {
      await assertSucceeds(bajar(PRO, portada(BORRADOR_P)))
      await assertFails(bajar(OYENTE, portada(BORRADOR_P)))
      await assertFails(bajar(OYENTE, portada(GENERAL, 'img-antigua')))
    })

    it('solo la sube el dueño, solo imagen y solo la reservada; solo la borra el dueño', async () => {
      const st = env.authenticatedContext(PRO).storage()
      const subir = (ruta: string, tipo = 'image/webp') =>
        uploadBytes(ref(st, ruta), PNG, { contentType: tipo })
      await assertSucceeds(subir(portada(GENERAL, 'img-nueva')))
      await assertFails(subir(portada(GENERAL, 'sin-reservar')))
      await assertFails(subir(portada(GENERAL, 'img-nueva'), 'text/html'))
      await assertFails(
        uploadBytes(
          ref(
            env.authenticatedContext(OTRO_PRO).storage(),
            portada(GENERAL, 'img-nueva'),
          ),
          PNG,
          { contentType: 'image/webp' },
        ),
      )
      await assertFails(
        deleteObject(
          ref(env.authenticatedContext(OTRO_PRO).storage(), portada(GENERAL)),
        ),
      )
      await assertSucceeds(deleteObject(ref(st, portada(GENERAL))))
    })

    it('Firestore: valida la portada y sigue admitiendo audios sin ella', async () => {
      const db = env.authenticatedContext(PRO).firestore()
      const crear = (id: string, extra: Record<string, unknown>) =>
        setDoc(doc(db, 'audiosProfesional', id), audio(id, extra))
      await assertSucceeds(
        crear('nuevo', { portada: 'profesional', portadaImagen: null }),
      )
      await assertSucceeds(
        updateDoc(doc(db, 'audiosProfesional', 'nuevo'), {
          portada: 'propia',
          portadaImagen: 'img-x',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertSucceeds(
        updateDoc(doc(db, 'audiosProfesional', PUBLICADO), {
          titulo: 'Sin portada todavía',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(crear('mal-1', { portada: 'otra' }))
      await assertFails(
        crear('mal-2', { portada: 'propia', portadaImagen: null }),
      )
      await assertFails(crear('mal-3', { portada: 'propia' }))
      await assertFails(
        crear('mal-4', { portada: 'propia', portadaImagen: 'x'.repeat(65) }),
      )
    })
  })
})
