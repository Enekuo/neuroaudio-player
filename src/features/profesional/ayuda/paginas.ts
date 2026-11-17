import type { ReactNode } from 'react'
import { DASHBOARD_PROFESIONAL, SECCIONES_PROFESIONAL } from '../data/secciones'

/** Página del panel tal como sale en el menú izquierdo. */
export type PaginaAyuda = { clave: string; nombre: string; icono: ReactNode }

/**
 * Las páginas del desplegable de Ayuda: las mismas del menú izquierdo, en el
 * mismo orden, con los mismos nombres e iconos (salen de la misma lista, así
 * que no pueden desincronizarse).
 */
export const PAGINAS_AYUDA: PaginaAyuda[] = [
  {
    clave: 'dashboard',
    nombre: DASHBOARD_PROFESIONAL.label,
    icono: DASHBOARD_PROFESIONAL.icon,
  },
  ...SECCIONES_PROFESIONAL.map((s) => ({
    clave: s.path,
    nombre: s.label,
    icono: s.icon,
  })),
]

/**
 * Página del menú a la que pertenece una ruta. Las subpáginas cuentan como
 * su página (el editor de un programa → «listas»; la ficha de un oyente →
 * «oyentes»). Cualquier otra cosa → «dashboard».
 */
export function paginaDeRuta(pathname: string): string {
  const resto = pathname.replace(/\/+$/, '').replace(/^\/profesional\/?/, '')
  const primero = resto.split('/')[0]
  return SECCIONES_PROFESIONAL.some((s) => s.path === primero)
    ? primero
    : 'dashboard'
}

/**
 * Página elegida a mano en el desplegable, y en qué visita a una ruta se
 * eligió (la `key` de la ubicación de React Router: cambia en cada
 * navegación). Elegir NO navega: solo cambia qué ayuda se lee.
 */
export type EleccionAyuda = { clave: string; enVisita: string } | null

export function elegirPaginaAyuda(
  clave: string,
  visitaActual: string,
): EleccionAyuda {
  return { clave, enVisita: visitaActual }
}

/**
 * Qué ayuda se muestra: la elegida a mano mientras el profesional siga en la
 * misma pantalla; en cuanto navega a otra, la de la página nueva.
 */
export function paginaAyudaMostrada(
  pathname: string,
  visitaActual: string,
  eleccion: EleccionAyuda,
): string {
  return eleccion && eleccion.enVisita === visitaActual
    ? eleccion.clave
    : paginaDeRuta(pathname)
}
