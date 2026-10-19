// PRUEBA TEMPORAL: las reglas tienen dos versiones (ver reglas/LEEME.md) y
// los tests de reglas se pasan contra las dos.
export const MODOS = [
  {
    nombre: 'todos',
    todos: true,
    firestore: 'reglas/firestore.todos.rules',
    storage: 'reglas/storage.todos.rules',
  },
  {
    nombre: 'solo vinculados',
    todos: false,
    firestore: 'reglas/firestore.solo-vinculados.rules',
    storage: 'reglas/storage.solo-vinculados.rules',
  },
] as const
