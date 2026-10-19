// Tests de las reglas de la página «Oyentes»: pausar y reanudar el vínculo
// (solo el profesional, solo el estado) y la nota privada (solo la lee y la
// escribe el profesional). Necesitan los emuladores (y Java):
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
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO_PRO = 'profesional-b'
const OYENTE = 'oyente-1' // vínculo activo
const EN_PAUSA = 'oyente-en-pausa'
const DE_BAJA = 'oyente-de-baja' // un estado futuro que no se puede revertir
const SIN_VINCULO = 'sin-vinculo'
const GENERAL = 'audio-general'

let env: RulesTestEnvironment

const vinculo = (oyente: string) => `vinculos/${PRO}_${oyente}`
const nota = (oyente: string, pro = PRO) =>
  `notasPrivadas/${pro}/oyentes/${oyente}`
const datosNota = (extra: Record<string, unknown> = {}) => ({
  texto: 'Prefiere audios cortos por la mañana.',
  actualizadoEn: serverTimestamp(),
  ...extra,
})

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
      const db = ctx.firestore()
      const ahora = Timestamp.now()
      for (const [oyente, estado] of [
        [OYENTE, 'activo'],
        [EN_PAUSA, 'pausado'],
        [DE_BAJA, 'baja'],
      ]) {
        await setDoc(doc(db, vinculo(oyente)), {
          profesionalUid: PRO,
          oyenteUid: oyente,
          estado,
          creadoEn: ahora,
          oyenteNombre: 'Ana Gil',
          oyenteEmail: 'ana@gmail.com',
        })
      }
      await setDoc(doc(db, `vinculos/${OTRO_PRO}_${SIN_VINCULO}`), {
        profesionalUid: OTRO_PRO,
        oyenteUid: SIN_VINCULO,
        estado: 'activo',
        creadoEn: ahora,
      })
      await setDoc(doc(db, 'audiosProfesional', GENERAL), {
        profesionalUid: PRO,
        titulo: 'Respirar',
        descripcion: '',
        estado: 'publicado',
        tipo: 'general',
        destinatarioUid: null,
        archivo: `audiosPro/${PRO}/${GENERAL}/archivo`,
        duracionSegundos: 600,
        tamanoBytes: 1000,
        contieneSalud: false,
        orden: 0,
        creadoEn: ahora,
        actualizadoEn: ahora,
      })
      await setDoc(doc(db, nota(OYENTE)), {
        texto: 'Nota existente',
        actualizadoEn: ahora,
      })
    })
  })

  const como = (uid: string) => env.authenticatedContext(uid).firestore()
  const pausa = (estado: string, extra: Record<string, unknown> = {}) => ({
    estado,
    estadoCambiadoEn: serverTimestamp(),
    ...extra,
  })

  describe('pausar y reanudar el vínculo', () => {
    it('el profesional pausa a un oyente activo', async () => {
      await assertSucceeds(
        updateDoc(doc(como(PRO), vinculo(OYENTE)), pausa('pausado')),
      )
    })

    it('el profesional reanuda a un oyente en pausa', async () => {
      await assertSucceeds(
        updateDoc(doc(como(PRO), vinculo(EN_PAUSA)), pausa('activo')),
      )
    })

    it('al pausarlo, el oyente deja de ver los audios al momento', async () => {
      const audio = doc(como(OYENTE), 'audiosProfesional', GENERAL)
      await assertSucceeds(getDoc(audio))
      await updateDoc(doc(como(PRO), vinculo(OYENTE)), pausa('pausado'))
      await assertFails(getDoc(audio))
      await updateDoc(doc(como(PRO), vinculo(OYENTE)), pausa('activo'))
      await assertSucceeds(getDoc(audio))
    })

    it('sin la hora del servidor, no', async () => {
      await assertFails(
        updateDoc(doc(como(PRO), vinculo(OYENTE)), { estado: 'pausado' }),
      )
      await assertFails(
        updateDoc(
          doc(como(PRO), vinculo(OYENTE)),
          pausa('pausado', {
            estadoCambiadoEn: Timestamp.fromDate(new Date(2020, 0, 1)),
          }),
        ),
      )
    })

    it('no puede tocar otros campos (nombre, correo, fecha, oyente)', async () => {
      for (const campo of [
        { oyenteNombre: 'Otro' },
        { oyenteEmail: 'otro@gmail.com' },
        { creadoEn: serverTimestamp() },
        { oyenteUid: 'otra-persona' },
        { profesionalUid: OTRO_PRO },
      ]) {
        await assertFails(
          updateDoc(doc(como(PRO), vinculo(OYENTE)), pausa('pausado', campo)),
        )
        await assertFails(updateDoc(doc(como(PRO), vinculo(OYENTE)), campo))
      }
    })

    it('solo entre activo y pausado, y tiene que cambiar', async () => {
      await assertFails(
        updateDoc(doc(como(PRO), vinculo(OYENTE)), pausa('baja')),
      )
      await assertFails(
        updateDoc(doc(como(PRO), vinculo(OYENTE)), pausa('activo')),
      )
      // Un estado distinto (p. ej. una baja futura del oyente) no se revierte.
      await assertFails(
        updateDoc(doc(como(PRO), vinculo(DE_BAJA)), pausa('activo')),
      )
    })

    it('el oyente no puede pausarse ni reanudarse', async () => {
      await assertFails(
        updateDoc(doc(como(OYENTE), vinculo(OYENTE)), pausa('pausado')),
      )
      await assertFails(
        updateDoc(doc(como(EN_PAUSA), vinculo(EN_PAUSA)), pausa('activo')),
      )
    })

    it('otro profesional no puede', async () => {
      await assertFails(
        updateDoc(doc(como(OTRO_PRO), vinculo(OYENTE)), pausa('pausado')),
      )
    })

    it('nadie crea ni borra vínculos desde la app', async () => {
      await assertFails(
        setDoc(doc(como(PRO), vinculo('nuevo')), {
          profesionalUid: PRO,
          oyenteUid: 'nuevo',
          estado: 'activo',
          creadoEn: serverTimestamp(),
        }),
      )
      await assertFails(deleteDoc(doc(como(PRO), vinculo(OYENTE))))
      await assertFails(deleteDoc(doc(como(OYENTE), vinculo(OYENTE))))
    })

    it('el correo del vínculo: lo leen el profesional y el propio oyente, nadie más', async () => {
      await assertSucceeds(getDoc(doc(como(PRO), vinculo(OYENTE))))
      await assertSucceeds(getDoc(doc(como(OYENTE), vinculo(OYENTE))))
      await assertFails(getDoc(doc(como(OTRO_PRO), vinculo(OYENTE))))
      await assertFails(getDoc(doc(como(EN_PAUSA), vinculo(OYENTE))))
    })
  })

  describe('nota privada', () => {
    it('el profesional la crea, la lee, la cambia y la borra', async () => {
      const db = como(PRO)
      await assertSucceeds(setDoc(doc(db, nota(EN_PAUSA)), datosNota()))
      await assertSucceeds(getDoc(doc(db, nota(EN_PAUSA))))
      await assertSucceeds(
        setDoc(doc(db, nota(OYENTE)), datosNota({ texto: 'Cambiada' })),
      )
      await assertSucceeds(deleteDoc(doc(db, nota(OYENTE))))
    })

    it('leer una que aún no existe no da error al profesional', async () => {
      await assertSucceeds(getDoc(doc(como(PRO), nota(EN_PAUSA))))
    })

    it('el oyente NO puede leer su nota privada (ni saber si existe)', async () => {
      await assertFails(getDoc(doc(como(OYENTE), nota(OYENTE))))
      await assertFails(getDoc(doc(como(EN_PAUSA), nota(EN_PAUSA))))
      await assertFails(
        getDocs(collection(como(OYENTE), `notasPrivadas/${PRO}/oyentes`)),
      )
    })

    it('el oyente no puede escribirla ni borrarla', async () => {
      await assertFails(setDoc(doc(como(OYENTE), nota(OYENTE)), datosNota()))
      await assertFails(deleteDoc(doc(como(OYENTE), nota(OYENTE))))
    })

    it('otro profesional no la ve ni la toca', async () => {
      await assertFails(getDoc(doc(como(OTRO_PRO), nota(OYENTE))))
      await assertFails(
        getDocs(collection(como(OTRO_PRO), `notasPrivadas/${PRO}/oyentes`)),
      )
      await assertFails(setDoc(doc(como(OTRO_PRO), nota(OYENTE)), datosNota()))
      await assertFails(deleteDoc(doc(como(OTRO_PRO), nota(OYENTE))))
      // Ni sobre un oyente de PRO en su propia carpeta (no tiene vínculo).
      await assertFails(
        setDoc(doc(como(OTRO_PRO), nota(OYENTE, OTRO_PRO)), datosNota()),
      )
    })

    it('el profesional lista sus notas', async () => {
      await assertSucceeds(
        getDocs(collection(como(PRO), `notasPrivadas/${PRO}/oyentes`)),
      )
    })

    it('solo sobre alguien con vínculo', async () => {
      await assertFails(setDoc(doc(como(PRO), nota(SIN_VINCULO)), datosNota()))
    })

    it('texto de hasta 2000 caracteres, solo texto y hora del servidor', async () => {
      const db = como(PRO)
      await assertSucceeds(
        setDoc(doc(db, nota(OYENTE)), datosNota({ texto: 'a'.repeat(2000) })),
      )
      await assertFails(
        setDoc(doc(db, nota(OYENTE)), datosNota({ texto: 'a'.repeat(2001) })),
      )
      await assertFails(setDoc(doc(db, nota(OYENTE)), datosNota({ texto: 7 })))
      await assertFails(
        setDoc(
          doc(db, nota(OYENTE)),
          datosNota({ oyenteEmail: 'x@gmail.com' }),
        ),
      )
      await assertFails(
        setDoc(doc(db, nota(OYENTE)), {
          texto: 'Sin fecha',
        }),
      )
      await assertFails(
        setDoc(
          doc(db, nota(OYENTE)),
          datosNota({
            actualizadoEn: Timestamp.fromDate(new Date(2020, 0, 1)),
          }),
        ),
      )
    })
  })
})
