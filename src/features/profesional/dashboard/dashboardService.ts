import {
  collection,
  getCountFromServer,
  query,
  where,
} from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { consultasDashboard, type Conteos } from './modelo'

/**
 * Cuenta los datos del Dashboard con consultas de conteo: Firestore no
 * devuelve los documentos, solo el número (cada conteo cuesta 1 lectura por
 * cada 1000 documentos que coinciden, con un mínimo de 1).
 */
export async function contarDashboard(uid: string): Promise<Conteos> {
  const consultas = consultasDashboard(uid)
  const numeros = await Promise.all(
    consultas.map(async (c) => {
      const q = query(
        collection(db, c.coleccion),
        ...c.filtros.map(([campo, op, valor]) => where(campo, op, valor)),
      )
      const snap = await getCountFromServer(q)
      return [c.clave, snap.data().count] as const
    }),
  )
  return Object.fromEntries(numeros) as Conteos
}
