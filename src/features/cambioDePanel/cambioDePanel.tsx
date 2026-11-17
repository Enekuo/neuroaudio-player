/**
 * Paso entre el panel profesional y la app del oyente: rutas, textos e
 * icono, los mismos a los dos lados. El icono es «SwapHoriz» de Material (dos
 * flechas en sentidos contrarios: cambiar de lado), con su trazo exacto, para
 * que se vea igual en el panel (MUI) y en la app del oyente (SVG propio).
 */

export const RUTA_PANEL_OYENTE = '/app'
export const RUTA_PANEL_PROFESIONAL = '/profesional'

export const TEXTO_PANEL_OYENTE = 'Panel del oyente'
export const AYUDA_PANEL_OYENTE = 'Ir al panel del oyente'
export const TEXTO_PANEL_PROFESIONAL = 'Panel del profesional'
export const AYUDA_PANEL_PROFESIONAL = 'Ir al panel del profesional'

/** Trazo de SwapHoriz (@mui/icons-material), en una caja de 24 × 24. */
export const TRAZO_CAMBIAR_PANEL =
  'M6.99 11 3 15l3.99 4v-3H14v-2H6.99zM21 9l-3.99-4v3H10v2h7.01v3z'

/** El icono, como SVG suelto (app del oyente). */
export function IconoCambiarPanel({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZO_CAMBIAR_PANEL} />
    </svg>
  )
}
