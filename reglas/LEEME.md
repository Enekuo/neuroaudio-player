# Reglas: «modo todos» y «modo solo vinculados» (PRUEBA TEMPORAL)

Qué profesionales ve cada usuario depende de **dos cosas que van siempre a la vez**:

| | Código (`src/features/perfilProfesional/modoProfesionales.ts`) | Reglas desplegadas |
|---|---|---|
| **Modo todos** (ahora, para probar el diseño) | `MOSTRAR_TODOS_LOS_PROFESIONALES = true` | `firestore.todos.rules` + `storage.todos.rules` |
| **Modo solo vinculados** (lanzamiento) | `MOSTRAR_TODOS_LOS_PROFESIONALES = false` | `firestore.solo-vinculados.rules` + `storage.solo-vinculados.rules` |

Los `firestore.rules` y `storage.rules` de la raíz son **la copia del modo activo**: son los que
usa `firebase deploy` y los que se pegan en la consola. Un test (`npm test`) falla si no
coinciden con el valor de la constante.

Las dos versiones solo se diferencian en **quién lee el perfil del profesional y sus fotos**.
Los audios (`audiosProfesional`, `audiosPro`), los vínculos y todo lo demás son idénticos
(también lo comprueba un test): los audios son siempre solo para oyentes con vínculo activo.

## Pasar a «solo vinculados» (antes de que entre el primer usuario)

1. Primero, **el código**: pon `MOSTRAR_TODOS_LOS_PROFESIONALES = false`, copia
   `reglas/firestore.solo-vinculados.rules` → `firestore.rules` y
   `reglas/storage.solo-vinculados.rules` → `storage.rules`. Pasa `npm test` y despliega la app.
   (Con el interruptor apagado la app ya no lista perfiles ajenos, así que funciona con
   cualquiera de las dos reglas.)
2. Después, **las reglas**: publica las dos «solo vinculados» (consola o
   `firebase deploy --only firestore:rules,storage`).

Si se hiciera al revés, durante unos minutos la app intentaría listar a todos con unas reglas
que ya no lo permiten y la fila mostraría el aviso de error con «Reintentar».

## Volver a «todos» (cuando haya muchos profesionales)

1. Primero, **las reglas**: publica `firestore.todos.rules` y `storage.todos.rules`.
2. Después, **el código**: `MOSTRAR_TODOS_LOS_PROFESIONALES = true`, copia las dos «todos» a
   la raíz, `npm test` y despliega la app.

Regla fácil: **las reglas abiertas van antes que el código que las usa, y se cierran después
de quitar el código que las usa.**

Cuando la decisión sea definitiva, borra esta carpeta, la constante y todo lo marcado con
`PRUEBA TEMPORAL`.
