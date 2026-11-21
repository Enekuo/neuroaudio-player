import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
// PRUEBA TEMPORAL: las reglas tienen dos versiones (ver reglas/LEEME.md) y
// los tests de reglas se pasan contra las dos.
// Para probar unas reglas de Firestore propuestas antes de adoptarlas:
//   REGLAS_FIRESTORE=reglas/propuestas npm run test:reglas
const FIRESTORE = process.env.REGLAS_FIRESTORE ?? 'reglas'

export const MODOS = [
  {
    nombre: 'todos',
    todos: true,
    firestore: `${FIRESTORE}/firestore.todos.rules`,
    storage: 'reglas/storage.todos.rules',
  },
  {
    nombre: 'solo vinculados',
    todos: false,
    firestore: `${FIRESTORE}/firestore.solo-vinculados.rules`,
    storage: 'reglas/storage.solo-vinculados.rules',
  },
] as const

// Las mismas reglas, en su versión PROPUESTA (reglas/propuestas), en los dos
// modos: para los tests de lo que aún no se ha adoptado.
export const MODOS_PROPUESTA = [
  { nombre: 'todos', firestore: 'reglas/propuestas/firestore.todos.rules' },
  {
    nombre: 'solo vinculados',
    firestore: 'reglas/propuestas/firestore.solo-vinculados.rules',
  },
] as const

/** Los profesionales de todos los tests de reglas. */
export const PROFESIONALES_DE_PRUEBA = ['profesional-a', 'profesional-b']

/**
 * Da de alta como profesionales (users/{uid}.tipoCuenta) a los profesionales
 * de los tests, sin pasar por las reglas. Con las reglas actuales no cambia
 * nada; con la propuesta de tipos de cuenta, es lo que les deja escribir.
 */
export async function sembrarCuentasProfesionales(env: RulesTestEnvironment) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const uid of PROFESIONALES_DE_PRUEBA) {
      await setDoc(doc(ctx.firestore(), 'users', uid), {
        tipoCuenta: 'profesional',
      })
    }
  })
}
