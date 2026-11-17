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
import { useAuth } from '../../auth/context/AuthContext'
import { useNombreProfesional } from '../dashboard/useNombreProfesional'
import LogoNeuroAudio from '../../../components/landing/LogoNeuroAudio'
import { DASHBOARD_PROFESIONAL, SECCIONES_PROFESIONAL } from '../data/secciones'
import { animacionEntrada, animacionFundido } from '../theme/movimiento'
import BarraUtilidades from './BarraUtilidades'
import EnlacePanelOyente from './EnlacePanelOyente'
import { ANCHO_BARRA_UTILIDADES } from './utilidades'

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
  color: 'pro.navTexto',
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
    '&:hover': { bgcolor: 'pro.hover' },
    '&.active:hover': { bgcolor: 'pro.activoHover' },
  },
}

/** Logotipo de NeuroAudio (el de la web), arriba del menú; lleva al Dashboard. */
function Marca() {
  return (
    <Box
      component={Link}
      to="/profesional"
      aria-label="NeuroAudio, Dashboard del panel profesional"
      sx={{
        display: 'inline-flex',
        color: 'text.primary',
        textDecoration: 'none',
        '--logo-n': '28px',
        '--logo-texto': '20px',
      }}
    >
      <LogoNeuroAudio />
    </Box>
  )
}

/**
 * «Panel profesional», arriba del contenido (fuera del menú): una marca azul
 * pequeña y el nombre, con la letra del panel.
 */
function TituloPanel() {
  return (
    <Box
      component="p"
      sx={{
        m: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: '0.01em',
        color: 'text.primary',
      }}
    >
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          boxShadow: (t) => `0 0 0 4px ${t.palette.primary.main}1f`,
        }}
      />
      Panel profesional
    </Box>
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
        <EnlacePanelOyente sx={navItemSx} />
      </List>
    </Box>
  )
}

/**
 * Avatar de la cuenta con sesión (foto de Google o inicial). La inicial y
 * el nombre salen del mismo sitio que el saludo del Dashboard
 * (useNombreProfesional), para que no se contradigan.
 */
function AvatarCuenta() {
  const { user } = useAuth()
  const { nombre } = useNombreProfesional()
  if (!user) return null
  const visible = nombre ?? user.displayName ?? user.email ?? ''

  return (
    <Tooltip title={visible}>
      <Avatar
        src={user.photoURL ?? undefined}
        alt={visible}
        slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
        sx={{
          width: 34,
          height: 34,
          fontSize: 15,
          bgcolor: 'primary.main',
        }}
      >
        {(visible || '?').charAt(0).toUpperCase()}
      </Avatar>
    </Tooltip>
  )
}

/**
 * Armazón del dashboard de profesional, estilo consola de Firebase en claro.
 * - Escritorio (md+): sin barra superior a todo el ancho. La cabecera
 *   ("NeuroAudio Profesional" + su línea) vive solo encima del menú lateral
 *   fijo. A la derecha, una columna de utilidades (avatar, Ayuda, Soporte,
 *   modo oscuro) estilo consola de Firebase.
 * - Móvil: AppBar con botón de menú que abre el mismo menú como drawer
 *   temporal (8 destinos no caben en una navegación inferior de Material);
 *   las utilidades van en fila a la derecha de la AppBar.
 * Menú: Dashboard arriba, una línea divisoria y las 7 secciones.
 * La salida a la app del oyente («Panel del oyente», /app) está al pie del menú.
 * (Sin control de acceso todavía: cualquier usuario con sesión puede entrar.)
 */
function ProfesionalLayout() {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  // Hueco fuera de la AppBar donde se pinta el panel de Ayuda/Soporte en móvil.
  const [huecoPanel, setHuecoPanel] = useState<HTMLDivElement | null>(null)
  const { pathname } = useLocation()
  // Ajustes y «Listas y programas» cambian de pestaña cambiando de
  // dirección: la página (título y pestañas) se queda y solo entra su
  // contenido, como en «Audios». (El editor de una lista es otra pantalla.)
  const sinBarra = pathname.replace(/\/+$/, '')
  const claveTransicion = pathname.startsWith('/profesional/ajustes')
    ? '/profesional/ajustes'
    : sinBarra === '/profesional/listas/programas'
      ? '/profesional/listas'
      : sinBarra
  const seccionActual = SECCIONES_PROFESIONAL.find((seccion) =>
    pathname.startsWith(`/profesional/${seccion.path}`),
  )
  const tituloMovil = seccionActual?.label ?? DASHBOARD_PROFESIONAL.label
  const cerrarMenuMovil = () => setMenuMovilAbierto(false)
  // Con movimiento reducido, el drawer móvil aparece sin deslizarse.
  const reducirMovimiento = useMediaQuery('(prefers-reduced-motion: reduce)')
  // Utilidades: columna a la derecha en md+; por debajo, fila en la AppBar.
  const esEscritorio = useMediaQuery((t: Theme) => t.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        // Escritorio: la página no se desplaza; lo hace el contenido (main),
        // así su barra de desplazamiento queda dentro, junto a la barra de
        // utilidades, y no pegada al borde de la ventana.
        height: { md: '100dvh' },
        overflow: { md: 'hidden' },
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
          {!esEscritorio && (
            <BarraUtilidades
              vertical={false}
              avatar={<AvatarCuenta />}
              contenedorPanel={huecoPanel}
            />
          )}
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
          // Sitio para la barra de utilidades fija de la derecha.
          mr: { md: `${ANCHO_BARRA_UTILIDADES}px` },
          overflowY: { md: 'auto' },
          // Hueco de la barra de desplazamiento siempre reservado: al pasar
          // de una página corta a una larga no se mueve todo de lado.
          scrollbarGutter: { md: 'stable' },
        }}
      >
        {/* Móvil: hueco bajo la AppBar fija. */}
        <Toolbar sx={{ display: { md: 'none' } }} />
        {/* Escritorio: «Panel profesional» arriba a la izquierda, sin barra
            alrededor (el avatar está en la barra de utilidades). */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            minHeight: 64,
          }}
        >
          <TituloPanel />
        </Box>
        {/* Transición entre secciones: cada página entra con fade + leve subida.
            La key fuerza a reiniciar la animación en cada cambio de ruta. */}
        <Box
          key={claveTransicion}
          sx={[
            { pt: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' },
            animacionEntrada({ duracion: 260, distancia: 6 }),
          ]}
        >
          <Outlet />
        </Box>
      </Box>

      {esEscritorio && (
        <BarraUtilidades vertical avatar={<AvatarCuenta />} />
      )}
      <div ref={setHuecoPanel} />
    </Box>
  )
}

export default ProfesionalLayout
