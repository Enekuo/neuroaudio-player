import Chip from '@mui/material/Chip'
import { textoPara, type ParaPrograma } from '../../programasProfesional/modelo'

// Verde de la misma familia que el azul del tema (consolas de Google).
const VERDE = { fondo: '#e6f4ea', texto: '#137333' }

/** «Para todos» (verde claro) o «Para N personas» (azul claro). */
function ChipPara({
  para,
  personas,
}: {
  para: ParaPrograma
  personas: number
}) {
  return (
    <Chip
      size="small"
      label={textoPara(para, personas)}
      sx={
        para === 'todos'
          ? { bgcolor: VERDE.fondo, color: VERDE.texto }
          : { bgcolor: 'primary.light', color: 'primary.dark' }
      }
    />
  )
}

export default ChipPara
