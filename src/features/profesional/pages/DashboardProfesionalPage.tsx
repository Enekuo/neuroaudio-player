import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import LibraryMusicOutlined from '@mui/icons-material/LibraryMusicOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import HeadphonesOutlined from '@mui/icons-material/HeadphonesOutlined'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { animacionEntrada } from '../theme/movimiento'

type TarjetaResumen = {
  label: string
  description: string
  icon: ReactNode
}

// Tarjetas de resumen de la portada. De momento sin datos ("Próximamente").
const TARJETAS_RESUMEN: TarjetaResumen[] = [
  {
    label: 'Audios publicados',
    description: 'Los audios que compartes con tus clientes.',
    icon: <LibraryMusicOutlined />,
  },
  {
    label: 'Clientes',
    description: 'Las personas que tienen acceso a tus audios.',
    icon: <PeopleOutlined />,
  },
  {
    label: 'Escuchas esta semana',
    description: 'Cuántas veces se han escuchado tus audios.',
    icon: <HeadphonesOutlined />,
  },
  {
    label: 'Ingresos del mes',
    description: 'Lo que llevas cobrado este mes.',
    icon: <PaymentsOutlined />,
  },
]

/**
 * Portada del panel de profesional (/profesional), al estilo de la consola de
 * Firebase: saludo grande con mucho aire y tarjetas blancas de borde fino.
 */
function DashboardProfesionalPage() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  // Mismo criterio que el saludo del Inicio de usuario: nombre preferido o el primer nombre de la cuenta.
  const nombre =
    profile?.displayNamePref?.trim() || user?.displayName?.split(' ')[0] || null

  return (
    <Box component="section" aria-labelledby="pro-dashboard-saludo">
      <Box sx={{ pt: { xs: 2, md: 5 }, pb: { xs: 4, md: 6 } }}>
        <Typography
          id="pro-dashboard-saludo"
          component="h1"
          sx={{
            fontSize: { xs: 30, md: 40 },
            lineHeight: 1.2,
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          {nombre ? `Hola, ${nombre}` : 'Hola'}
        </Typography>
        <Typography
          sx={{
            mt: 1.5,
            fontSize: { xs: 15, md: 16 },
            color: 'text.secondary',
          }}
        >
          Te damos la bienvenida a tu panel profesional de NeuroAudio.
        </Typography>
      </Box>

      {/* El saludo entra con la página; "Resumen" y las tarjetas llegan justo
          después, en cascada (50ms entre tarjetas). */}
      <Typography
        component="h2"
        sx={[
          { fontSize: 16, fontWeight: 500, mb: 2 },
          animacionEntrada({ retardo: 60 }),
        ]}
      >
        Resumen
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {TARJETAS_RESUMEN.map((tarjeta, indice) => (
          <Paper
            key={tarjeta.label}
            variant="outlined"
            sx={[
              {
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 176,
              },
              animacionEntrada({ retardo: 90 + indice * 50, distancia: 10 }),
            ]}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                color: 'text.secondary',
              }}
            >
              <Box sx={{ display: 'flex', '& svg': { fontSize: 20 } }}>
                {tarjeta.icon}
              </Box>
              <Typography
                component="h3"
                sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}
              >
                {tarjeta.label}
              </Typography>
            </Box>

            <Typography
              aria-hidden="true"
              sx={{
                mt: 2.5,
                fontSize: 32,
                lineHeight: 1,
                fontWeight: 400,
                color: 'text.disabled',
              }}
            >
              —
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1.5, color: 'text.secondary' }}
            >
              {tarjeta.description}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />
            <Chip
              label="Próximamente"
              size="small"
              sx={{
                mt: 2,
                alignSelf: 'flex-start',
                bgcolor: 'action.hover',
                color: 'text.secondary',
                fontWeight: 500,
              }}
            />
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

export default DashboardProfesionalPage
