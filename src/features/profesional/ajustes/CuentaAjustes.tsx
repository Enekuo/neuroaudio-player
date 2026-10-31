import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded'
import { useAuth } from '../../auth/context/AuthContext'
import { signOutUser } from '../../auth/services/authService'
import { animacionEntrada } from '../theme/movimiento'
import { CabeceraAjustes, Dato } from './comunes'

/**
 * Ajustes → Cuenta: lo mismo que en el oyente (foto, nombre y correo de la
 * cuenta de Google, «Cerrar sesión» y, en la misma página, «Eliminar
 * cuenta»), con el diseño del panel. Misma lógica: cerrar sesión con
 * signOutUser; la eliminación todavía no existe (se confirma y se avisa; no
 * se borra nada).
 */
function CuentaAjustes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)
  const [errorSalir, setErrorSalir] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
  const [avisoNoDisponible, setAvisoNoDisponible] = useState(false)

  // Como en la app: nombre o correo para el avatar, y su inicial si no hay foto.
  const nombre = user?.displayName ?? user?.email ?? 'Mi cuenta'
  const inicial = (user?.displayName ?? user?.email ?? '?')
    .charAt(0)
    .toUpperCase()

  const cerrarSesion = async () => {
    setSaliendo(true)
    setErrorSalir(false)
    try {
      await signOutUser()
      navigate('/login', { replace: true })
    } catch {
      setErrorSalir(true)
      setSaliendo(false)
    }
  }

  const cancelarBorrado = () => {
    setConfirmandoBorrado(false)
    setAvisoNoDisponible(false)
  }

  return (
    <Box component="section" aria-labelledby="ajustes-cuenta">
      <CabeceraAjustes id="ajustes-cuenta" titulo="Cuenta" />

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Avatar
            src={user?.photoURL ?? undefined}
            alt={nombre}
            slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
            sx={{
              width: 56,
              height: 56,
              fontSize: 22,
              bgcolor: 'primary.light',
              color: 'primary.dark',
            }}
          >
            {inicial}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            Se toma de tu cuenta de Google.
          </Typography>
        </Box>

        <Box
          component="dl"
          sx={{
            m: 0,
            mb: 2.5,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          <Dato titulo="Nombre" valor={user?.displayName ?? '—'} />
          <Dato titulo="Correo electrónico" valor={user?.email ?? '—'} />
        </Box>

        <Button
          variant="outlined"
          startIcon={
            saliendo ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <LogoutRounded />
            )
          }
          onClick={() => void cerrarSesion()}
          disabled={saliendo || !user}
        >
          Cerrar sesión
        </Button>
        {errorSalir && (
          <Alert
            severity="error"
            sx={[{ mt: 2 }, animacionEntrada({ duracion: 200, distancia: 4 })]}
          >
            No se pudo cerrar la sesión. Inténtalo de nuevo.
          </Alert>
        )}
      </Paper>

      {/* Eliminar cuenta: dentro de Cuenta, como en el oyente. */}
      <Paper
        variant="outlined"
        component="section"
        aria-labelledby="ajustes-eliminar"
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderColor: 'error.light' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberRounded color="error" />
          <Typography
            id="ajustes-eliminar"
            variant="subtitle1"
            component="h3"
            sx={{ fontWeight: 500 }}
          >
            Eliminar cuenta
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Esta acción borrará tu cuenta, tus audios, tus listas y todos tus
          datos de forma permanente. No se puede deshacer.
        </Typography>

        {!confirmandoBorrado ? (
          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 2 }}
            onClick={() => setConfirmandoBorrado(true)}
          >
            Eliminar cuenta
          </Button>
        ) : (
          <Box
            sx={[{ mt: 2 }, animacionEntrada({ duracion: 220, distancia: 6 })]}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              ¿Seguro que quieres eliminar tu cuenta? Esta acción es permanente
              y no se puede deshacer.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Button onClick={cancelarBorrado}>Cancelar</Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setAvisoNoDisponible(true)}
              >
                Sí, eliminar mi cuenta
              </Button>
            </Box>
            {avisoNoDisponible && (
              <Alert
                severity="info"
                sx={[
                  { mt: 2 },
                  animacionEntrada({ duracion: 200, distancia: 4 }),
                ]}
              >
                La eliminación de cuenta todavía no está disponible. Se
                implementará próximamente, con borrado en cascada de todos tus
                datos.
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default CuentaAjustes
