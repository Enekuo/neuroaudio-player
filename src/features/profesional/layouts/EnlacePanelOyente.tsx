import { Link } from 'react-router-dom'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import type { SxProps, Theme } from '@mui/material/styles'
import SwapHoriz from '@mui/icons-material/SwapHoriz'
import {
  AYUDA_PANEL_OYENTE,
  RUTA_PANEL_OYENTE,
  TEXTO_PANEL_OYENTE,
} from '../../cambioDePanel/cambioDePanel'

/**
 * «Panel del oyente», abajo del menú izquierdo del panel profesional (el
 * mismo menú en ordenador y en pantallas estrechas). Es un enlace normal,
 * así que el aviso de «cambios sin guardar» lo para igual que antes.
 * Icono: SwapHoriz, el mismo que «Panel del profesional» en la app del oyente.
 */
function EnlacePanelOyente({ sx }: { sx?: SxProps<Theme> }) {
  return (
    // describeChild: el nombre del enlace sigue siendo «Panel del oyente» (el
    // texto visible); el tooltip se anuncia como su descripción.
    <Tooltip title={AYUDA_PANEL_OYENTE} placement="right" describeChild>
      <ListItemButton component={Link} to={RUTA_PANEL_OYENTE} sx={sx}>
        <ListItemIcon>
          <SwapHoriz />
        </ListItemIcon>
        <ListItemText primary={TEXTO_PANEL_OYENTE} />
      </ListItemButton>
    </Tooltip>
  )
}

export default EnlacePanelOyente
