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
