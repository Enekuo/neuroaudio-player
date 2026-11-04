// Tests de las reglas de los programas del profesional (programasProfesional,
// accesosPrograma, progresoPrograma), de la lista audiosBiblioteca del
// vínculo y de las marcas de los audios de Biblioteca, en Firestore y
// Storage. Necesitan los emuladores (y Java):
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
  arrayUnion,
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
const ANA = 'ana' // vínculo activo; tiene el programa privado
const LUIS = 'luis' // vínculo activo; sin el programa privado
const EN_PAUSA = 'oyente-en-pausa' // tiene el programa privado, vínculo en pausa
const SIN_VINCULO = 'sin-vinculo'
const B1 = 'audio-privado' // en el programa privado
const B2 = 'audio-publico' // en el programa para todos
const PRIVADO = 'programa-privado'
const PUBLICO = 'programa-publico'
const BORRADOR = 'programa-borrador'
const archivo = (id: string) => `bibliotecaPro/${PRO}/${id}/archivo`
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
    titulo: 'Paso',
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
    etiquetas: ['sueño'],
    ...extra,
  }
}

/** Un programa válido; con estado 'publicado', con publicadoEn. */
function programa(extra: Record<string, unknown> = {}) {
  return {
    profesionalUid: PRO,
    titulo: 'Dormir mejor en 7 días',
    descripcion: '',
    estado: 'borrador',
    apertura: 'orden',
    ritmo: 'diario',
    ritmoDias: null,
    para: 'personas',
    pasos: [B1],
    publicadoEn: null,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    ...extra,
  }
}

const progreso = (
  oyente: string,
  programaId: string,
  completados: string[],
) => ({
  oyenteUid: oyente,
  programaId,
  profesionalUid: PRO,
  completados,
  actualizadoEn: serverTimestamp(),
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
      const vinculos: [string, string, string[]][] = [
        [ANA, 'activo', [B1]],
        [LUIS, 'activo', []],
        [EN_PAUSA, 'pausado', [B1]],
      ]
      for (const [oyente, estado, audiosBiblioteca] of vinculos) {
        await setDoc(doc(db, 'vinculos', `${PRO}_${oyente}`), {
          profesionalUid: PRO,
          oyenteUid: oyente,
          estado,
          creadoEn: ahora,
          audiosBiblioteca,
        })
      }
      await setDoc(doc(db, 'vinculos', `${OTRO_PRO}_${SIN_VINCULO}`), {
        profesionalUid: OTRO_PRO,
        oyenteUid: SIN_VINCULO,
        estado: 'activo',
      })
      const fechas = { creadoEn: ahora, actualizadoEn: ahora }
      await setDoc(doc(db, 'audiosProfesional', B1), audio(B1, fechas))
      await setDoc(
        doc(db, 'audiosProfesional', B2),
        audio(B2, { ...fechas, enProgramaPublico: true }),
      )
      await setDoc(
        doc(db, 'programasProfesional', PRIVADO),
        programa({ ...fechas, estado: 'publicado', publicadoEn: ahora }),
      )
      await setDoc(
        doc(db, 'programasProfesional', PUBLICO),
        programa({
          ...fechas,
          estado: 'publicado',
          publicadoEn: ahora,
          para: 'todos',
          pasos: [B2],
        }),
      )
      await setDoc(doc(db, 'programasProfesional', BORRADOR), programa(fechas))
      for (const [p, oyente] of [
        [PRIVADO, ANA],
        [PRIVADO, EN_PAUSA],
        [BORRADOR, ANA],
      ]) {
        await setDoc(doc(db, 'accesosPrograma', `${p}__${oyente}`), {
          profesionalUid: PRO,
          programaId: p,
          oyenteUid: oyente,
          creadoEn: ahora,
        })
      }
      await setDoc(doc(db, 'limitesSubida', PRO), {
        ventanaInicio: ahora,
        cuenta: 1,
        reservada: 'x',
        reservadaEn: ahora,
      })
      const st = ctx.storage()
      for (const id of [B1, B2]) {
        await uploadBytes(ref(st, archivo(id)), MP3, {
          contentType: 'audio/mpeg',
        })
        for (const img of ['img1', 'img2']) {
          await uploadBytes(ref(st, portada(id, img)), WEBP, {
            contentType: 'image/webp',
          })
        }
      }
    })
  })

  const fs = (uid: string) => env.authenticatedContext(uid).firestore()
  const leer = (uid: string, coleccion: string, id: string) =>
    getDoc(doc(fs(uid), coleccion, id))
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
  const publicosDe = (uid: string) =>
    getDocs(
      query(
        collection(fs(uid), 'programasProfesional'),
        where('profesionalUid', '==', PRO),
        where('estado', '==', 'publicado'),
        where('para', '==', 'todos'),
      ),
    )
  const misAccesos = (uid: string) =>
    getDocs(
      query(
        collection(fs(uid), 'accesosPrograma'),
        where('profesionalUid', '==', PRO),
        where('oyenteUid', '==', uid),
      ),
    )
  const darAcceso = (uid: string, programaId: string, oyente: string) =>
    setDoc(doc(fs(uid), 'accesosPrograma', `${programaId}__${oyente}`), {
      profesionalUid: uid,
      programaId,
      oyenteUid: oyente,
      creadoEn: serverTimestamp(),
    })

  describe('programa privado', () => {
    it('quien lo tiene lo ve, ve sus audios y descarga el archivo y su portada', async () => {
      await assertSucceeds(leer(ANA, 'programasProfesional', PRIVADO))
      await assertSucceeds(misAccesos(ANA))
      await assertSucceeds(leer(ANA, 'audiosProfesional', B1))
      await assertSucceeds(bajar(ANA, archivo(B1)))
      await assertSucceeds(bajar(ANA, portada(B1)))
      // Solo la portada que usa ahora.
      await assertFails(bajar(ANA, portada(B1, 'img2')))
    })

    it('otro oyente del mismo profesional sin el programa no lo ve ni lo oye', async () => {
      await assertFails(leer(LUIS, 'programasProfesional', PRIVADO))
      await assertFails(leer(LUIS, 'audiosProfesional', B1))
      await assertFails(bajar(LUIS, archivo(B1)))
      await assertFails(bajar(LUIS, portada(B1)))
      await assertFails(leer(LUIS, 'accesosPrograma', `${PRIVADO}__${ANA}`))
    })

    it('con el vínculo en pausa, sin vínculo o sin sesión, no', async () => {
      await assertFails(leer(EN_PAUSA, 'programasProfesional', PRIVADO))
      await assertFails(leer(EN_PAUSA, 'audiosProfesional', B1))
      await assertFails(bajar(EN_PAUSA, archivo(B1)))
      await assertFails(leer(SIN_VINCULO, 'programasProfesional', PRIVADO))
      await assertFails(bajar(SIN_VINCULO, archivo(B1)))
      await assertFails(bajar(null, archivo(B1)))
    })

    it('al reanudar el vínculo lo vuelve a ver', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(
          doc(ctx.firestore(), 'vinculos', `${PRO}_${EN_PAUSA}`),
          {
            estado: 'activo',
          },
        )
      })
      await assertSucceeds(leer(EN_PAUSA, 'programasProfesional', PRIVADO))
      await assertSucceeds(bajar(EN_PAUSA, archivo(B1)))
    })

    it('en borrador no lo ve nadie más que su dueño', async () => {
      await assertFails(leer(ANA, 'programasProfesional', BORRADOR))
      await assertSucceeds(leer(PRO, 'programasProfesional', BORRADOR))
    })

    it('al quitarle el audio de su lista, deja de oírlo', async () => {
      await updateDoc(doc(fs(PRO), 'vinculos', `${PRO}_${ANA}`), {
        audiosBiblioteca: [],
      })
      await assertFails(bajar(ANA, archivo(B1)))
      await assertFails(leer(ANA, 'audiosProfesional', B1))
    })
  })

  describe('programa para todos', () => {
    it('lo ve y lo oye cualquier oyente con vínculo activo, también uno nuevo', async () => {
      await assertSucceeds(leer(LUIS, 'programasProfesional', PUBLICO))
      await assertSucceeds(publicosDe(LUIS))
      await assertSucceeds(leer(LUIS, 'audiosProfesional', B2))
      await assertSucceeds(bajar(LUIS, archivo(B2)))
      await assertSucceeds(bajar(LUIS, portada(B2)))
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_marta`), {
          profesionalUid: PRO,
          oyenteUid: 'marta',
          estado: 'activo',
          creadoEn: Timestamp.now(),
        })
      })
      await assertSucceeds(leer('marta', 'programasProfesional', PUBLICO))
      await assertSucceeds(bajar('marta', archivo(B2)))
    })

    it('sin vínculo o en pausa, no', async () => {
      await assertFails(leer(SIN_VINCULO, 'programasProfesional', PUBLICO))
      await assertFails(publicosDe(SIN_VINCULO))
      await assertFails(bajar(SIN_VINCULO, archivo(B2)))
      await assertFails(bajar(EN_PAUSA, archivo(B2)))
    })

    it('la consulta de programas para todos no deja ver los privados', async () => {
      await assertFails(
        getDocs(
          query(
            collection(fs(LUIS), 'programasProfesional'),
            where('profesionalUid', '==', PRO),
            where('estado', '==', 'publicado'),
          ),
        ),
      )
    })
  })

  describe('crear y editar programas', () => {
    it('crea uno en borrador y lo publica (publicadoEn = ahora, luego fijo)', async () => {
      const ref = doc(fs(PRO), 'programasProfesional', 'nuevo')
      await assertSucceeds(setDoc(ref, programa()))
      await assertSucceeds(
        updateDoc(ref, {
          estado: 'publicado',
          publicadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        }),
      )
      // Despublicar conserva su fecha; no se puede cambiar después.
      await assertSucceeds(
        updateDoc(ref, {
          estado: 'borrador',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(ref, {
          publicadoEn: Timestamp.fromDate(new Date(2020, 0, 1)),
          actualizadoEn: serverTimestamp(),
        }),
      )
    })

    it('datos válidos: nombre, apertura, ritmo, pasos', async () => {
      const crear = (extra: Record<string, unknown>) =>
        setDoc(doc(fs(PRO), 'programasProfesional', 'p'), programa(extra))
      await assertSucceeds(crear({ ritmo: 'dias', ritmoDias: 3 }))
      await assertFails(crear({ ritmo: 'dias', ritmoDias: null }))
      await assertFails(crear({ ritmo: 'diario', ritmoDias: 3 }))
      await assertFails(crear({ titulo: '' }))
      await assertFails(crear({ titulo: 'x'.repeat(81) }))
      await assertFails(crear({ apertura: 'aleatoria' }))
      await assertFails(crear({ para: 'algunos' }))
      await assertFails(crear({ pasos: [B1, B1] }))
      await assertFails(
        crear({ pasos: Array.from({ length: 51 }, (_, i) => `a${i}`) }),
      )
      // Publicado sin pasos, o publicado sin su fecha.
      await assertFails(
        crear({
          estado: 'publicado',
          publicadoEn: serverTimestamp(),
          pasos: [],
        }),
      )
      await assertFails(crear({ estado: 'publicado', publicadoEn: null }))
      await assertFails(crear({ html: '<b>no</b>' }))
    })

    it('«Para quién» no se cambia después; añadir y reordenar pasos, sí', async () => {
      const ref = doc(fs(PRO), 'programasProfesional', PRIVADO)
      await assertFails(
        updateDoc(ref, { para: 'todos', actualizadoEn: serverTimestamp() }),
      )
      await assertSucceeds(
        updateDoc(ref, { pasos: [B2, B1], actualizadoEn: serverTimestamp() }),
      )
    })

    it('quitar su último paso a uno publicado: solo pasándolo a borrador a la vez', async () => {
      const ref = doc(fs(PRO), 'programasProfesional', PUBLICO)
      await assertFails(
        updateDoc(ref, { pasos: [], actualizadoEn: serverTimestamp() }),
      )
      await assertSucceeds(
        updateDoc(ref, {
          pasos: [],
          estado: 'borrador',
          actualizadoEn: serverTimestamp(),
        }),
      )
    })

    it('otro profesional ni los crea a tu nombre, ni los edita, ni los borra', async () => {
      await assertFails(
        setDoc(doc(fs(OTRO_PRO), 'programasProfesional', 'p'), programa()),
      )
      await assertFails(
        updateDoc(doc(fs(OTRO_PRO), 'programasProfesional', PRIVADO), {
          titulo: 'Mío',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        deleteDoc(doc(fs(OTRO_PRO), 'programasProfesional', PRIVADO)),
      )
      await assertFails(leer(OTRO_PRO, 'programasProfesional', BORRADOR))
    })

    it('borrar un programa y sus accesos en una sola escritura', async () => {
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.delete(doc(db, 'programasProfesional', PRIVADO))
      lote.delete(doc(db, 'accesosPrograma', `${PRIVADO}__${ANA}`))
      lote.delete(doc(db, 'accesosPrograma', `${PRIVADO}__${EN_PAUSA}`))
      await assertSucceeds(lote.commit())
    })
  })

  describe('dar y quitar programas privados', () => {
    it('lo da a alguien con vínculo activo, y le añade sus audios en la misma escritura', async () => {
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.set(doc(db, 'accesosPrograma', `${PRIVADO}__${LUIS}`), {
        profesionalUid: PRO,
        programaId: PRIVADO,
        oyenteUid: LUIS,
        creadoEn: serverTimestamp(),
      })
      lote.update(doc(db, 'vinculos', `${PRO}_${LUIS}`), {
        audiosBiblioteca: [B1],
      })
      await assertSucceeds(lote.commit())
      await assertSucceeds(leer(LUIS, 'programasProfesional', PRIVADO))
      await assertSucceeds(bajar(LUIS, archivo(B1)))
    })

    it('enviar un audio y añadirlo a la lista de su vínculo en la misma escritura', async () => {
      const db = fs(PRO)
      const lote = writeBatch(db)
      lote.set(doc(db, 'enviosAudio', `${B2}__${LUIS}`), {
        profesionalUid: PRO,
        audioId: B2,
        oyenteUid: LUIS,
        creadoEn: serverTimestamp(),
      })
      lote.update(doc(db, 'vinculos', `${PRO}_${LUIS}`), {
        audiosBiblioteca: arrayUnion(B2),
      })
      await assertSucceeds(lote.commit())
      // Sin la marca de programa para todos, lo oye por su lista.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await updateDoc(doc(ctx.firestore(), 'audiosProfesional', B2), {
          enProgramaPublico: false,
        })
      })
      await assertSucceeds(bajar(LUIS, archivo(B2)))
      await assertFails(bajar(ANA, archivo(B2)))
    })

    it('no a alguien en pausa o sin vínculo, ni en un programa para todos o ajeno', async () => {
      // Un vínculo en pausa sin acceso previo.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'vinculos', `${PRO}_pedro`), {
          profesionalUid: PRO,
          oyenteUid: 'pedro',
          estado: 'pausado',
        })
      })
      await assertFails(darAcceso(PRO, PRIVADO, 'pedro'))
      await assertFails(darAcceso(PRO, PRIVADO, SIN_VINCULO))
      await assertFails(darAcceso(PRO, PUBLICO, LUIS))
      await assertFails(darAcceso(OTRO_PRO, PRIVADO, LUIS))
      await assertFails(darAcceso(PRO, 'no-existe', LUIS))
    })

    it('el acceso no se edita; lo quita solo su profesional', async () => {
      const ref = (uid: string) =>
        doc(fs(uid), 'accesosPrograma', `${PRIVADO}__${ANA}`)
      await assertFails(updateDoc(ref(PRO), { creadoEn: serverTimestamp() }))
      await assertFails(deleteDoc(ref(ANA)))
      await assertFails(deleteDoc(ref(OTRO_PRO)))
      await assertSucceeds(deleteDoc(ref(PRO)))
    })

    it('la lista de audios del vínculo: solo su profesional, solo ese campo y como mucho 200', async () => {
      const ref = (uid: string) => doc(fs(uid), 'vinculos', `${PRO}_${LUIS}`)
      await assertSucceeds(updateDoc(ref(PRO), { audiosBiblioteca: [B1, B2] }))
      await assertFails(updateDoc(ref(LUIS), { audiosBiblioteca: [B1] }))
      await assertFails(updateDoc(ref(OTRO_PRO), { audiosBiblioteca: [B1] }))
      await assertFails(
        updateDoc(ref(PRO), {
          audiosBiblioteca: Array.from({ length: 201 }, (_, i) => `a${i}`),
        }),
      )
      // Junto con otro campo, no.
      await assertFails(
        updateDoc(ref(PRO), { audiosBiblioteca: [], oyenteUid: 'otro' }),
      )
      // También en pausa se le pueden quitar.
      await assertSucceeds(
        updateDoc(doc(fs(PRO), 'vinculos', `${PRO}_${EN_PAUSA}`), {
          audiosBiblioteca: [],
        }),
      )
    })

    it('la marca «en un programa para todos», solo en Biblioteca y verdadero o falso', async () => {
      await assertSucceeds(
        updateDoc(doc(fs(PRO), 'audiosProfesional', B1), {
          enProgramaPublico: true,
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(doc(fs(PRO), 'audiosProfesional', B1), {
          enProgramaPublico: 'sí',
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertFails(
        updateDoc(doc(fs(OTRO_PRO), 'audiosProfesional', B1), {
          enProgramaPublico: true,
          actualizadoEn: serverTimestamp(),
        }),
      )
    })
  })

  describe('progreso del oyente', () => {
    const ref = (uid: string, oyente = uid) =>
      doc(fs(uid), 'progresoPrograma', `${PRIVADO}__${oyente}`)

    it('el oyente lo consulta aunque no exista, lo crea y lo completa sin repetir', async () => {
      await assertSucceeds(getDoc(ref(ANA)))
      await assertSucceeds(setDoc(ref(ANA), progreso(ANA, PRIVADO, [B1])))
      await assertSucceeds(
        updateDoc(ref(ANA), {
          completados: arrayUnion(B1),
          actualizadoEn: serverTimestamp(),
        }),
      )
      // Desmarcar.
      await assertSucceeds(
        updateDoc(ref(ANA), {
          completados: [],
          actualizadoEn: serverTimestamp(),
        }),
      )
      await assertSucceeds(getDoc(ref(ANA)))
    })

    it('nadie más lo lee ni lo escribe: ni otro oyente ni su profesional', async () => {
      await setDoc(ref(ANA), progreso(ANA, PRIVADO, [B1]))
      await assertFails(getDoc(ref(LUIS, ANA)))
      await assertFails(getDoc(ref(PRO, ANA)))
      await assertFails(setDoc(ref(LUIS, ANA), progreso(ANA, PRIVADO, [])))
      await assertFails(setDoc(ref(LUIS, ANA), progreso(LUIS, PRIVADO, [])))
      await assertFails(deleteDoc(ref(PRO, ANA)))
    })

    it('datos válidos: sin repetidos, como mucho 50, id que cuadra', async () => {
      await assertFails(setDoc(ref(ANA), progreso(ANA, PRIVADO, [B1, B1])))
      await assertFails(
        setDoc(
          ref(ANA),
          progreso(
            ANA,
            PRIVADO,
            Array.from({ length: 51 }, (_, i) => `a${i}`),
          ),
        ),
      )
      await assertFails(setDoc(ref(ANA), progreso(ANA, PUBLICO, [])))
    })
  })
})
