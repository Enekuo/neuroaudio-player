// Tests de reglas del Dashboard del panel: las 6 consultas de conteo
// (getCountFromServer) pasan con las reglas actuales para el propio
// profesional, cuentan lo que deben y no para otra persona.
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
  doc,
  getCountFromServer,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { consultasDashboard } from '../../src/features/profesional/dashboard/modelo'
import { MODOS } from './modos'

const PRO = 'profesional-a'
const OTRO = 'profesional-b'
let env: RulesTestEnvironment

const contar = (db: Firestore, uid: string) =>
  Promise.all(
    consultasDashboard(uid).map(async (c) => {
      const q = query(
        collection(db, c.coleccion),
        ...c.filtros.map(([campo, op, valor]) => where(campo, op, valor)),
      )
      return [c.clave, (await getCountFromServer(q)).data().count] as const
    }),
  ).then(Object.fromEntries)

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
      const audio = (id: string, pro: string, tipo: string, estado: string) =>
        setDoc(doc(db, 'audiosProfesional', id), {
          profesionalUid: pro,
          tipo,
          estado,
          titulo: id,
          creadoEn: ahora,
        })
      await audio('g-pub', PRO, 'general', 'publicado')
      await audio('g-bor', PRO, 'general', 'borrador')
      await audio('p-pub', PRO, 'personal', 'publicado')
      await audio('b-pub', PRO, 'biblioteca', 'publicado')
      await audio('otro', OTRO, 'general', 'publicado')
      const vinculo = (oyente: string, pro: string, estado: string) =>
        setDoc(doc(db, 'vinculos', `${pro}_${oyente}`), {
          profesionalUid: pro,
          oyenteUid: oyente,
          estado,
          creadoEn: ahora,
        })
      await vinculo('ana', PRO, 'activo')
      await vinculo('luis', PRO, 'pausado')
      await vinculo('eva', OTRO, 'activo')
      const programa = (id: string, pro: string, estado: string) =>
        setDoc(doc(db, 'programasProfesional', id), {
          profesionalUid: pro,
          estado,
          titulo: id,
          pasos: [],
          para: 'todos',
          creadoEn: ahora,
        })
      await programa('pr-pub', PRO, 'publicado')
      await programa('pr-bor', PRO, 'borrador')
      await programa('pr-otro', OTRO, 'publicado')
    })
  })

  it('el profesional cuenta lo suyo, con los filtros de cada número', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    expect(await contar(db, PRO)).toEqual({
      audiosPublicados: 2, // general + personal publicados (no Biblioteca ni borrador)
      audiosTotales: 4,
      oyentesActivos: 1,
      vinculosTotales: 2,
      programasPublicados: 1,
      programasTotales: 2,
    })
  })

  it('cada conteo, uno a uno, pasa las reglas', async () => {
    const db = env.authenticatedContext(PRO).firestore()
    for (const c of consultasDashboard(PRO))
      await assertSucceeds(
        getCountFromServer(
          query(
            collection(db, c.coleccion),
            ...c.filtros.map(([campo, op, valor]) => where(campo, op, valor)),
          ),
        ),
      )
  })

  it('otra persona no puede contar lo de este profesional', async () => {
    for (const db of [
      env.authenticatedContext(OTRO).firestore(),
      env.unauthenticatedContext().firestore(),
    ])
      for (const c of consultasDashboard(PRO))
        await assertFails(
          getCountFromServer(
            query(
              collection(db, c.coleccion),
              ...c.filtros.map(([campo, op, valor]) => where(campo, op, valor)),
            ),
          ),
        )
  })
})
