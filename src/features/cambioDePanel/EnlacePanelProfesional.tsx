import { Link } from 'react-router-dom'
import {
  AYUDA_PANEL_PROFESIONAL,
  IconoCambiarPanel,
  RUTA_PANEL_PROFESIONAL,
  TEXTO_PANEL_PROFESIONAL,
} from './cambioDePanel'
import '../../styles/cambio-panel.css'

type Props = {
  /** Si el usuario es profesional: si no, no se pinta nada. */
  esProfesional: boolean
  /** 'lateral': fila en la barra lateral (ordenador); 'movil': icono en la cabecera. */
  variante: 'lateral' | 'movil'
}

/**
 * «Panel del profesional» en la app del oyente (solo para profesionales).
 * Sin lecturas: quien lo usa le pasa `esProfesional` (useEsProfesional).
 */
function EnlacePanelProfesional({ esProfesional, variante }: Props) {
  if (!esProfesional) {
    return null
  }

  if (variante === 'movil') {
    return (
      <Link
        to={RUTA_PANEL_PROFESIONAL}
        className="cambio-panel-movil"
        aria-label={AYUDA_PANEL_PROFESIONAL}
        title={AYUDA_PANEL_PROFESIONAL}
      >
        <IconoCambiarPanel />
      </Link>
    )
  }

  return (
    <Link
      to={RUTA_PANEL_PROFESIONAL}
      className="cambio-panel-lateral"
      aria-describedby="cambio-panel-lateral-ayuda"
    >
      <IconoCambiarPanel className="cambio-panel-lateral__icono" />
      <span>{TEXTO_PANEL_PROFESIONAL}</span>
      <span
        id="cambio-panel-lateral-ayuda"
        className="cambio-panel-lateral__ayuda"
        role="tooltip"
        // Fuera del nombre del enlace («Panel del profesional»): se anuncia
        // como su descripción (aria-describedby).
        aria-hidden="true"
      >
        {AYUDA_PANEL_PROFESIONAL}
      </span>
    </Link>
  )
}

export default EnlacePanelProfesional
