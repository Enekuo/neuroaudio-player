import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import { CabeceraAjustes } from './comunes'

// Los mismos documentos que lista el ajuste del oyente (aún sin texto ni
// enlace).
const DOCUMENTOS_LEGALES = [
  'Términos y condiciones',
  'Política de privacidad',
  'Política de cookies',
]

/**
 * Ajustes → Privacidad: lo mismo que en el oyente (la introducción y los tres
 * documentos legales, todavía sin enlace), con el diseño del panel.
 */
function PrivacidadAjustes() {
  return (
    <Box component="section" aria-labelledby="ajustes-privacidad">
      <CabeceraAjustes
        id="ajustes-privacidad"
        titulo="Privacidad"
        intro="Aquí podrás consultar los documentos legales de NeuroAudio. De momento son solo referencia: próximamente estarán disponibles para leer directamente desde la app."
      />

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box
          component="ul"
          aria-label="Documentos legales"
          sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25 }}
        >
          {DOCUMENTOS_LEGALES.map((documento) => (
            <Box
              component="li"
              key={documento}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}
            >
              <DescriptionOutlined
                fontSize="small"
                sx={{ color: 'text.secondary' }}
              />
              <Typography>{documento}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

export default PrivacidadAjustes
