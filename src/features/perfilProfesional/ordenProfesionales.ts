import type { PerfilProfesional } from './modelo'

export type ProfesionalDelOyente = {
  uid: string
  perfil: PerfilProfesional
  /** Fecha del vínculo (campo opcional `creadoEn`), si la tiene. */
  creadoEn: Date | null
}

const porNombre = new Intl.Collator('es', { sensitivity: 'base' })

/**
 * Orden de «Tus profesionales»: primero los vínculos con fecha, del más
 * reciente al más antiguo; después los que no tienen fecha, por nombre.
 * Los que no tienen nombre se quitan (no se pinta un hueco roto).
 */
export function ordenarProfesionales(lista: ProfesionalDelOyente[]) {
  return lista
    .filter((p) => p.perfil.nombre.trim())
    .sort((a, b) => {
      if (a.creadoEn && b.creadoEn)
        return b.creadoEn.getTime() - a.creadoEn.getTime()
      if (a.creadoEn) return -1
      if (b.creadoEn) return 1
      return porNombre.compare(a.perfil.nombre.trim(), b.perfil.nombre.trim())
    })
}

/**
 * Fila de profesionales: primero los vinculados, con su orden
 * (ordenarProfesionales); después el resto, por nombre. El resto es el
 * propio perfil del usuario, si es profesional (un profesional se ve a sí
 * mismo), y, en modo «todos» (PRUEBA TEMPORAL), todos los demás perfiles.
 * Sin repetidos (si un perfil llega dos veces, cuenta la primera: la de los
 * vinculados, y si no, la que va antes en `resto`) y sin nombre vacío.
 */
export function combinarProfesionales(
  vinculados: ProfesionalDelOyente[],
  todos: { uid: string; perfil: PerfilProfesional }[],
): ProfesionalDelOyente[] {
  const primeros = ordenarProfesionales(vinculados)
  const vistos = new Set(vinculados.map((p) => p.uid))
  const resto = todos
    .filter((p) => !vistos.has(p.uid) && p.perfil.nombre.trim())
    .filter((p, i, lista) => lista.findIndex((q) => q.uid === p.uid) === i)
    .map((p) => ({ ...p, creadoEn: null }))
    .sort((a, b) =>
      porNombre.compare(a.perfil.nombre.trim(), b.perfil.nombre.trim()),
    )
  return [...primeros, ...resto]
}
