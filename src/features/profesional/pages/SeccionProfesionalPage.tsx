import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { SeccionProfesional } from '../data/secciones'

type SeccionProfesionalPageProps = {
  seccion: SeccionProfesional
}

// Página de una sección del dashboard de profesional. Por ahora solo título
// y un aviso "Próximamente"; la funcionalidad llegará más adelante.
function SeccionProfesionalPage({ seccion }: SeccionProfesionalPageProps) {
  return (
    <Box component="section" key={seccion.path} aria-labelledby={`pro-page-${seccion.path}`}>
      <Typography id={`pro-page-${seccion.path}`} variant="h5" component="h1" sx={{ fontWeight: 400, mb: 3 }}>
        {seccion.label}
      </Typography>

      <Paper variant="outlined" sx={{ px: { xs: 3, sm: 6 }, py: { xs: 5, sm: 8 }, textAlign: 'center' }}>
        <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
          {seccion.icon}
        </Avatar>
        <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
          Próximamente
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}>
          {seccion.description}
        </Typography>
      </Paper>
    </Box>
  )
}

export default SeccionProfesionalPage
