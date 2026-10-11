import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import CloseRounded from '@mui/icons-material/CloseRounded'
import type { PerfilProfesional } from '../../perfilProfesional/modelo'
import TarjetaProfesional from '../../perfilProfesional/vista/TarjetaProfesional'
import VistaPerfilOyente from '../../perfilProfesional/vista/VistaPerfilOyente'

type DialogoVistaPreviaProps = {
  abierto: boolean
  onCerrar: () => void
  uid: string
  perfil: PerfilProfesional
  /** El perfil mostrado incluye cambios aún sin guardar. */
  conCambiosSinGuardar: boolean
}

const etiquetaSx = {
  m: 0,
  mb: 1.25,
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#6A6B6F',
} as const

/**
 * «Así te ve un oyente»: usa exactamente los componentes y estilos de la app
 * de usuario (la tarjeta del Inicio y el perfil completo, con la bienvenida
 * de la primera vez). El diálogo se pinta fuera del árbol del panel, así que
 * hereda el aspecto oscuro de la app de usuario y no el del panel.
 */
function DialogoVistaPrevia({
  abierto,
  onCerrar,
  uid,
  perfil,
  conCambiosSinGuardar,
}: DialogoVistaPreviaProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={abierto}
      onClose={onCerrar}
      fullScreen={pantallaCompleta}
      maxWidth={false}
      aria-labelledby="vista-previa-titulo"
      slotProps={{
        paper: {
          sx: {
            width: { sm: 440 },
            maxHeight: { sm: 'calc(100% - 48px)' },
            bgcolor: '#000208',
            color: '#F0F1F3',
            borderRadius: { sm: '28px' },
            border: { sm: '1px solid rgba(255,255,255,0.1)' },
            backgroundImage: 'none',
            fontFamily:
              "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2.5,
          py: 1.5,
          bgcolor: 'rgba(0, 2, 8, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            id="vista-previa-titulo"
            component="h2"
            sx={{ fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}
          >
            Así te ve un oyente
          </Typography>
          {conCambiosSinGuardar && (
            <Typography
              sx={{ fontSize: 12, color: '#9A9B9F', fontFamily: 'inherit' }}
            >
              Incluye los cambios que aún no has guardado.
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="Cerrar vista previa"
          onClick={onCerrar}
          sx={{ color: '#F0F1F3' }}
        >
          <CloseRounded />
        </IconButton>
      </Box>

      <Box sx={{ px: 2.5, py: 3 }}>
        <Box component="p" sx={etiquetaSx}>
          En su inicio
        </Box>
        <TarjetaProfesional profesionalUid={uid} perfil={perfil} />

        <Box component="p" sx={{ ...etiquetaSx, mt: 4 }}>
          Al abrir tu perfil
        </Box>
        <VistaPerfilOyente
          profesionalUid={uid}
          perfil={perfil}
          mostrarBienvenida
        />
      </Box>
    </Dialog>
  )
}

export default DialogoVistaPrevia
