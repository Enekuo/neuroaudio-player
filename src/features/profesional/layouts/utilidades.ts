/**
 * Paneles de la barra de utilidades del panel profesional (derecha en
 * escritorio, fila arriba en móvil). Solo uno abierto a la vez.
 */
export type PanelUtilidad = 'ayuda' | 'soporte'

/**
 * Qué panel queda abierto al pulsar un botón: abrir uno cierra el otro y
 * pulsar el del panel abierto lo cierra.
 */
export function alternarPanel(
  abierto: PanelUtilidad | null,
  pulsado: PanelUtilidad,
): PanelUtilidad | null {
  return abierto === pulsado ? null : pulsado
}

/** Ancho de la barra de iconos de la derecha (escritorio). */
export const ANCHO_BARRA_UTILIDADES = 60
/** Ancho del panel de Ayuda/Soporte en escritorio (en móvil, todo el ancho). */
export const ANCHO_PANEL_UTILIDAD = 380
