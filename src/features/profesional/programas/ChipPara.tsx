import Chip from '@mui/material/Chip'
import { textoPara, type ParaPrograma } from '../../programasProfesional/modelo'

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
          ? // Verde de la misma familia que el azul (claro u oscuro, del tema).
          { bgcolor: 'pro.verdeFondo', color: 'pro.verdeTexto' }
          : { bgcolor: 'primary.light', color: 'primary.dark' }
      }
    />
  )
}

export default ChipPara
