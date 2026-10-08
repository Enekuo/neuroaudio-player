import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import { DASHBOARD_PROFESIONAL, SECCIONES_PROFESIONAL } from '../data/secciones'

const DRAWER_WIDTH = 256

// Elemento del menú al estilo de la consola de Firebase: píldora redondeada
// con aire a los lados, icono de 20px en gris, texto gris oscuro de 14px. El
// activo (clase .active que pone NavLink) lleva fondo azul suave y texto e
// icono en azul.
const navItemSx: SxProps<Theme> = {
  minHeight: 40,
  mx: 1.5,
  mb: 0.25,
  pl: 2,
  pr: 1.5,
  borderRadius: 999,
  color: '#3c4043',
  '& .MuiListItemIcon-root': { minWidth: 36, color: 'text.secondary' },
  '& .MuiSvgIcon-root': { fontSize: 20 },
  '& .MuiListItemText-root': { my: 0 },
  '& .MuiListItemText-primary': { fontSize: 14, fontWeight: 500, letterSpacing: '0.01em' },
  '&:hover': { bgcolor: 'rgba(60, 64, 67, 0.08)' },
  '&.active': {
    bgcolor: 'primary.light',
    color: 'primary.dark',
    '& .MuiListItemIcon-root': { color: 'primary.dark' },
  },
  '&.active:hover': { bgcolor: '#d2e3fc' },
}

/** Nombre del producto al estilo "Google Analytics": marca + producto en gris. */
function Marca() {
  return (
    <Typography component="span" sx={{ fontSize: 20, lineHeight: 1, whiteSpace: 'nowrap', color: 'text.secondary' }}>
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
          <ListItemButton component={NavLink} to={DASHBOARD_PROFESIONAL.to} end onClick={onNavigate} sx={navItemSx}>
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

/**
 * Armazón del dashboard de profesional, estilo consola de Firebase en claro.
 * - Escritorio (md+): AppBar blanca a todo el ancho y menú lateral fijo debajo.
 * - Móvil: AppBar con botón de menú que abre el mismo menú como drawer
 *   temporal (8 destinos no caben en una navegación inferior de Material).
 * Menú: Dashboard arriba, una línea divisoria y las 7 secciones.
 * La salida a la app de usuario (/app) está siempre visible en la AppBar y
 * también al pie del menú.
 * (Sin control de acceso todavía: cualquier usuario con sesión puede entrar.)
 */
function ProfesionalLayout() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()
  const seccionActual = SECCIONES_PROFESIONAL.find((seccion) => pathname.startsWith(`/profesional/${seccion.path}`))
  const tituloMovil = seccionActual?.label ?? DASHBOARD_PROFESIONAL.label
  const cerrarMenuMovil = () => setMenuMovilAbierto(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* En escritorio la AppBar va por encima del menú fijo; en móvil se queda
          por debajo para que el drawer temporal la cubra (como en Gmail). */}
      <AppBar
        position="fixed"
        sx={(theme) => ({
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          [theme.breakpoints.up('md')]: { zIndex: theme.zIndex.drawer + 1 },
        })}
      >
        <Toolbar sx={{ gap: 1, px: { xs: 1, sm: 2 } }}>
          <IconButton
            aria-label="Abrir menú"
            onClick={() => setMenuMovilAbierto(true)}
            sx={{ display: { md: 'none' }, color: 'text.secondary' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Escritorio: marca. Móvil: nombre de la sección actual (la marca va en el drawer). */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', pl: 1 }}>
            <Marca />
          </Box>
          <Typography component="span" noWrap sx={{ display: { md: 'none' }, fontSize: 18, fontWeight: 500 }}>
            {tituloMovil}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            component={Link}
            to="/app"
            variant="outlined"
            startIcon={<ArrowBackOutlined />}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderColor: 'divider', color: 'text.primary', borderRadius: 999, px: 2 }}
          >
            Volver a la app
          </Button>
          <Tooltip title="Volver a la app">
            <IconButton component={Link} to="/app" aria-label="Volver a la app" sx={{ display: { sm: 'none' }, color: 'text.secondary' }}>
              <ArrowBackOutlined />
            </IconButton>
          </Tooltip>

          {user && (
            <Tooltip title={user.displayName ?? user.email ?? ''}>
              <Avatar
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? ''}
                slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                sx={{ width: 32, height: 32, ml: 1, fontSize: 15, bgcolor: 'primary.main' }}
              >
                {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <Box component="aside" aria-label="Menú del panel profesional" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Móvil: drawer temporal. disablePortal lo deja dentro del árbol del
            panel para que herede el tema y el reset aislados de MUI. */}
        <Drawer
          variant="temporary"
          open={menuMovilAbierto}
          onClose={cerrarMenuMovil}
          ModalProps={{ keepMounted: true, disablePortal: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, maxWidth: '85vw', boxSizing: 'border-box', display: 'flex' },
          }}
        >
          <Toolbar sx={{ px: 3 }}>
            <Marca />
          </Toolbar>
          <Divider />
          <Navegacion onNavigate={cerrarMenuMovil} />
        </Drawer>

        {/* Escritorio: menú fijo bajo la AppBar. */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 0, bgcolor: 'background.paper', display: 'flex' },
          }}
        >
          <Toolbar />
          <Navegacion />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Toolbar />
        <Box sx={{ pt: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default ProfesionalLayout
