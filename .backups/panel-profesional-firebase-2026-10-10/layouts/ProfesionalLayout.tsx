import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import { DASHBOARD_PROFESIONAL, SECCIONES_PROFESIONAL } from '../data/secciones'
import { animacionEntrada, animacionFundido } from '../theme/movimiento'

const DRAWER_WIDTH = 256

// Elemento del menú al estilo de la consola de Firebase: píldora redondeada
// con aire a los lados, icono de 20px en gris, texto gris oscuro de 14px. El
// activo (clase .active que pone NavLink) lleva fondo azul suave y texto e
// icono en azul.
// Movimiento: al cambiar de sección el resaltado se funde de la opción vieja a
// la nueva (fondo, texto e icono a la vez, 200ms); el hover solo existe con
// ratón (en táctil se quedaría "pegado"); al pulsar responde el ripple.
const transicionColor = 'background-color 200ms ease, color 200ms ease'

const navItemSx: SxProps<Theme> = {
  minHeight: 40,
  mx: 1.5,
  mb: 0.25,
  pl: 2,
  pr: 1.5,
  borderRadius: 999,
  color: '#3c4043',
  transition: transicionColor,
  '& .MuiListItemIcon-root': {
    minWidth: 36,
    color: 'text.secondary',
    transition: 'color 200ms ease',
  },
  '& .MuiSvgIcon-root': { fontSize: 20 },
  '& .MuiListItemText-root': { my: 0 },
  '& .MuiListItemText-primary': {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '0.01em',
  },
  '&:hover': { bgcolor: 'transparent' },
  '&.active, &.active:hover': {
    bgcolor: 'primary.light',
    color: 'primary.dark',
    '& .MuiListItemIcon-root': { color: 'primary.dark' },
  },
  // Va después del activo para que el hover con ratón (más específico en
  // .active:hover) gane sobre él.
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: 'rgba(60, 64, 67, 0.08)' },
    '&.active:hover': { bgcolor: '#d2e3fc' },
  },
}

/** Nombre del producto al estilo "Google Analytics": marca + producto en gris. */
function Marca() {
  return (
    <Typography
      component="span"
      sx={{
        fontSize: 20,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: 'text.secondary',
      }}
    >
      <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
        NeuroAudio
      </Box>{' '}
      Profesional
    </Typography>
  )
}

type NavegacionProps = {
  /** En móvil cierra el drawer al elegir una sección. */
  onNavigate?: () => void
}

function Navegacion({ onNavigate }: NavegacionProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Box component="nav" aria-label="Secciones del panel profesional">
        <List disablePadding sx={{ pt: 1.5 }}>
          {/* end: solo activo en /profesional exacto, no en sus subpáginas. */}
          <ListItemButton
            component={NavLink}
            to={DASHBOARD_PROFESIONAL.to}
            end
            onClick={onNavigate}
            sx={navItemSx}
          >
            <ListItemIcon>{DASHBOARD_PROFESIONAL.icon}</ListItemIcon>
            <ListItemText primary={DASHBOARD_PROFESIONAL.label} />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 1.5 }} />

        <List disablePadding>
          {SECCIONES_PROFESIONAL.map((seccion) => (
            <ListItemButton
              key={seccion.path}
              component={NavLink}
              to={`/profesional/${seccion.path}`}
              onClick={onNavigate}
              sx={navItemSx}
            >
              <ListItemIcon>{seccion.icon}</ListItemIcon>
              <ListItemText primary={seccion.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Divider />

      <List sx={{ py: 1.5 }}>
        <ListItemButton component={Link} to="/app" sx={navItemSx}>
          <ListItemIcon>
            <ArrowBackOutlined />
          </ListItemIcon>
          <ListItemText primary="Volver a la app" />
        </ListItemButton>
      </List>
    </Box>
  )
}

/** Avatar de la cuenta con sesión (foto de Google o inicial). */
function AvatarCuenta() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <Tooltip title={user.displayName ?? user.email ?? ''}>
      <Avatar
        src={user.photoURL ?? undefined}
        alt={user.displayName ?? ''}
        slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
        sx={{
          width: 32,
          height: 32,
          fontSize: 15,
          bgcolor: 'primary.main',
        }}
      >
        {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
      </Avatar>
    </Tooltip>
  )
}

/**
 * Armazón del dashboard de profesional, estilo consola de Firebase en claro.
 * - Escritorio (md+): sin barra superior a todo el ancho. La cabecera
 *   ("NeuroAudio Profesional" + su línea) vive solo encima del menú lateral
 *   fijo, y el avatar de la cuenta flota arriba a la derecha del contenido.
 * - Móvil: AppBar con botón de menú que abre el mismo menú como drawer
 *   temporal (8 destinos no caben en una navegación inferior de Material).
 * Menú: Dashboard arriba, una línea divisoria y las 7 secciones.
 * La salida a la app de usuario (/app) está al pie del menú.
 * (Sin control de acceso todavía: cualquier usuario con sesión puede entrar.)
 */
function ProfesionalLayout() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const { pathname } = useLocation()
  const seccionActual = SECCIONES_PROFESIONAL.find((seccion) =>
    pathname.startsWith(`/profesional/${seccion.path}`),
  )
  const tituloMovil = seccionActual?.label ?? DASHBOARD_PROFESIONAL.label
  const cerrarMenuMovil = () => setMenuMovilAbierto(false)
  // Con movimiento reducido, el drawer móvil aparece sin deslizarse.
  const reducirMovimiento = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {/* Solo en móvil: botón de menú, sección actual y avatar. En escritorio
          no hay barra superior. */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: 'none' },
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
          <IconButton
            aria-label="Abrir menú"
            onClick={() => setMenuMovilAbierto(true)}
            sx={{ color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            key={tituloMovil}
            component="span"
            noWrap
            sx={[{ fontSize: 18, fontWeight: 500 }, animacionFundido()]}
          >
            {tituloMovil}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />
          <AvatarCuenta />
        </Toolbar>
      </AppBar>

      <Box
        component="aside"
        aria-label="Menú del panel profesional"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Móvil: drawer temporal. disablePortal lo deja dentro del árbol del
            panel para que herede el tema y el reset aislados de MUI. */}
        <Drawer
          variant="temporary"
          open={menuMovilAbierto}
          onClose={cerrarMenuMovil}
          transitionDuration={reducirMovimiento ? 0 : undefined}
          ModalProps={{ keepMounted: true, disablePortal: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              maxWidth: '85vw',
              boxSizing: 'border-box',
              display: 'flex',
            },
          }}
        >
          <Toolbar sx={{ px: 3 }}>
            <Marca />
          </Toolbar>
          <Divider />
          <Navegacion onNavigate={cerrarMenuMovil} />
        </Drawer>

        {/* Escritorio: menú fijo con su propia cabecera (marca + línea), que
            termina donde termina el menú. */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 0,
              bgcolor: 'background.paper',
              display: 'flex',
            },
          }}
        >
          <Toolbar sx={{ px: 3 }}>
            <Marca />
          </Toolbar>
          <Divider />
          <Navegacion />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 3, md: 4 },
        }}
      >
        {/* Móvil: hueco bajo la AppBar fija. */}
        <Toolbar sx={{ display: { md: 'none' } }} />
        {/* Escritorio: el avatar, arriba a la derecha, sin barra alrededor. */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: 64,
            mr: -2,
          }}
        >
          <AvatarCuenta />
        </Box>
        {/* Transición entre secciones: cada página entra con fade + leve subida.
            La key fuerza a reiniciar la animación en cada cambio de ruta. */}
        <Box
          key={pathname}
          sx={[
            { pt: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' },
            animacionEntrada({ duracion: 260, distancia: 6 }),
          ]}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default ProfesionalLayout
