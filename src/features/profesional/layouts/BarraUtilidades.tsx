import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CloseFullscreenRounded from '@mui/icons-material/CloseFullscreenRounded'
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined'
import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined'
import {
  ANCHO_BARRA_UTILIDADES,
  ANCHO_PANEL_UTILIDAD,
  alternarPanel,
  type PanelUtilidad,
} from './utilidades'
import PanelAyuda from '../ayuda/PanelAyuda'
import PanelSoporte from '../soporte/PanelSoporte'
import { useModoColor } from '../theme/modoColor'

// Botón de icono de la barra (estilo consola de Firebase): círculo de 40 px
// con icono de 20 px en gris casi negro; gris suave al pasar el ratón; azul
// claro con icono azul si su panel está abierto; anillo azul con teclado.
const botonSx: SxProps<Theme> = {
  width: 40,
  height: 40,
  color: 'pro.icono',
  '& .MuiSvgIcon-root': { fontSize: 20 },
  '&.activo, &.activo:hover': {
    bgcolor: 'primary.light',
    color: 'primary.main',
  },
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: 'pro.hover' },
    '&.activo:hover': { bgcolor: 'pro.activoHover' },
  },
  // ProfesionalApp quita el contorno de foco a los botones de MUI; aquí se
  // devuelve (más específico) solo cuando el foco llega con el teclado.
  '&&&.Mui-focusVisible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
}

// Cerrar del panel de Ayuda/Soporte: como estaba (el panel no cambia).
const cerrarSx: SxProps<Theme> = {
  width: 40,
  height: 40,
  color: 'text.secondary',
  '@media (hover: hover) and (pointer: fine)': {
    '&:hover': { bgcolor: 'pro.hover' },
  },
}

type Props = {
  /** Escritorio: columna fija a la derecha · móvil: fila en la barra superior. */
  vertical: boolean
  /** El avatar de la cuenta (el mismo de siempre). */
  avatar: ReactNode
  /**
   * Dónde se pinta el panel. En móvil los botones viven dentro de la AppBar
   * y el panel, si se quedara ahí, taparía la propia barra: va fuera.
   */
  contenedorPanel?: HTMLElement | null
}

/**
 * Utilidades del panel profesional (estilo consola de Firebase): avatar,
 * Ayuda y Soporte arriba, y el cambio claro/oscuro abajo. Ayuda y
 * Soporte abren un panel a la derecha (a la izquierda de la barra en
 * escritorio; todo el ancho en móvil). De momento, solo con «Próximamente».
 */
function BarraUtilidades({ vertical, avatar, contenedorPanel }: Props) {
  const [abierto, setAbierto] = useState<PanelUtilidad | null>(null)
  // Cada vez que se abre Ayuda, su desplegable vuelve a la página actual.
  const [aperturasAyuda, setAperturasAyuda] = useState(0)
  // Ayuda a pantalla completa (escritorio): ocupa todo menos la barra de
  // utilidades, que sigue a la vista. Cada vez que se abre, empieza en pequeño.
  const [ayudaAmplia, setAyudaAmplia] = useState(false)
  const { modo, alternarModo } = useModoColor()
  const oscuro = modo === 'dark'
  const botones = {
    ayuda: useRef<HTMLButtonElement>(null),
    soporte: useRef<HTMLButtonElement>(null),
  }
  const cerrarRef = useRef<HTMLButtonElement>(null)
  // Botón que abrió el panel: al cerrarlo, el foco vuelve a él.
  const origen = useRef<PanelUtilidad | null>(null)
  // Panel que se ve: el abierto o, mientras se cierra deslizándose, el
  // último que se abrió (así no cambia de contenido ni de ancho al salir).
  const mostrado = abierto ?? origen.current
  const amplia = vertical && mostrado === 'ayuda' && ayudaAmplia

  const cerrar = () => {
    const desde = origen.current
    setAbierto(null)
    if (desde) botones[desde].current?.focus()
  }

  const pulsar = (panel: PanelUtilidad) => {
    const siguiente = alternarPanel(abierto, panel)
    origen.current = siguiente ?? origen.current
    if (siguiente === null) cerrar()
    else {
      setAbierto(siguiente)
      if (siguiente === 'ayuda') {
        setAperturasAyuda((n) => n + 1)
        // Siempre se abre en pequeño, aunque se cerrara ampliada.
        setAyudaAmplia(false)
      }
    }
  }

  // Con el panel abierto: el foco va a «Cerrar» y Escape lo cierra.
  useEffect(() => {
    if (!abierto) return
    // preventScroll: el panel aún está entrando desde fuera de la pantalla;
    // sin él, el móvil desplazaba la vista de lado para enseñar el botón.
    const t = window.setTimeout(
      () => cerrarRef.current?.focus({ preventScroll: true }),
      0,
    )
    const alPulsarTecla = (e: KeyboardEvent) => {
      // Si Escape ya lo usó otro (p. ej. para cerrar el desplegable de
      // Ayuda), el panel sigue abierto.
      if (e.key === 'Escape' && !e.defaultPrevented) cerrar()
    }
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', alPulsarTecla)
    }
    // cerrar solo lee refs y el setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const lado = vertical ? 'left' : 'bottom'
  const boton = (panel: PanelUtilidad, titulo: string, icono: ReactNode) => (
    <Tooltip title={titulo} placement={lado}>
      <IconButton
        ref={botones[panel]}
        disableFocusRipple
        aria-label={titulo}
        aria-expanded={abierto === panel}
        aria-controls={`pro-utilidad-${panel}`}
        className={abierto === panel ? 'activo' : undefined}
        onClick={() => pulsar(panel)}
        sx={botonSx}
      >
        {icono}
      </IconButton>
    </Tooltip>
  )

  // Interruptor: la luna en claro, el sol en oscuro (el icono es el destino).
  const modoOscuro = (
    <Tooltip
      title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      placement={lado}
    >
      <IconButton
        aria-label="Modo oscuro"
        disableFocusRipple
        aria-pressed={oscuro}
        onClick={alternarModo}
        sx={botonSx}
      >
        {oscuro ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  )

  const titulo = mostrado === 'soporte' ? 'Soporte' : 'Ayuda'
  const conPortal = (panel: ReactNode) =>
    contenedorPanel ? createPortal(panel, contenedorPanel) : panel

  return (
    <>
      <Box
        component="nav"
        aria-label="Utilidades del panel"
        sx={
          vertical
            ? {
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: ANCHO_BARRA_UTILIDADES,
                zIndex: (t) => t.zIndex.drawer + 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // 40 px de botón + 17 px de hueco: 57 px de centro a centro.
                gap: '17px',
                pt: '13px',
                pb: '20px',
                // Blanca como el menú izquierdo (en oscuro, su gris), sin borde ni sombra.
                bgcolor: 'background.paper',
              }
            : { display: 'flex', alignItems: 'center', gap: 0.5 }
        }
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 40,
            height: 40,
          }}
        >
          {avatar}
        </Box>
        {boton('ayuda', 'Ayuda', <HelpOutlineOutlined />)}
        {boton('soporte', 'Soporte', <HeadsetMicOutlined />)}
        {vertical && <Box sx={{ flexGrow: 1 }} />}
        {modoOscuro}
      </Box>

      {/* Panel de Ayuda / Soporte: sin fondo que bloquee, para que la barra
          siga visible y usable (a la izquierda de ella en escritorio). */}
      {conPortal(
        <Drawer
          anchor="right"
          variant="persistent"
          open={abierto !== null}
          slotProps={{
            paper: {
              component: 'aside',
              id: abierto ? `pro-utilidad-${abierto}` : undefined,
              'aria-labelledby': 'pro-utilidad-titulo',
              sx: {
                width: !vertical
                  ? '100%'
                  : amplia
                    ? `calc(100vw - ${ANCHO_BARRA_UTILIDADES}px)`
                    : mostrado === 'soporte'
                      ? // Soporte, más ancho para escribir: llega hasta la
                        // mitad de la pantalla (nunca menos que Ayuda).
                        `max(${ANCHO_PANEL_UTILIDAD}px, calc(50vw - ${ANCHO_BARRA_UTILIDADES}px))`
                      : ANCHO_PANEL_UTILIDAD,
                // Al ampliar o reducir, el panel crece o encoge suavemente.
                transition: (t: Theme) =>
                  `${t.transitions.create('transform', { duration: t.transitions.duration.enteringScreen, easing: t.transitions.easing.easeOut })}, width 280ms ${t.transitions.easing.easeOut}`,
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                },
                right: vertical ? ANCHO_BARRA_UTILIDADES : 0,
                // Móvil: por debajo de la barra superior, que sigue a la vista.
                zIndex: (t: Theme) =>
                  vertical ? t.zIndex.drawer : t.zIndex.appBar - 1,
                boxSizing: 'border-box',
                borderLeft: vertical && !amplia ? 1 : 0,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                // Columna: la ayuda ocupa el resto y tiene scroll propio.
                display: 'flex',
                flexDirection: 'column',
              },
            } as object,
          }}
        >
          {/* Móvil: hueco bajo la barra superior fija. */}
          {!vertical && <Toolbar />}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              minHeight: 64,
              px: 3,
              pr: 1.5,
            }}
          >
            <Typography
              id="pro-utilidad-titulo"
              component="h2"
              sx={{ fontSize: 18, fontWeight: 500, flex: 1 }}
            >
              {titulo}
            </Typography>
            {/* Escritorio, en Ayuda: ampliar a pantalla completa o reducir. */}
            {vertical && mostrado === 'ayuda' && (
              <Tooltip title={amplia ? 'Reducir' : 'Pantalla completa'}>
                <IconButton
                  aria-label={
                    amplia
                      ? 'Reducir la ayuda'
                      : 'Ver la ayuda a pantalla completa'
                  }
                  aria-pressed={amplia}
                  onClick={() => setAyudaAmplia((a) => !a)}
                  sx={cerrarSx}
                >
                  {amplia ? (
                    <CloseFullscreenRounded sx={{ fontSize: 20 }} />
                  ) : (
                    <OpenInFullRounded sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              ref={cerrarRef}
              aria-label={`Cerrar ${titulo.toLowerCase()}`}
              onClick={cerrar}
              sx={cerrarSx}
            >
              <CloseRounded />
            </IconButton>
          </Box>
          <Divider />

          {mostrado === 'soporte' ? (
            <PanelSoporte />
          ) : (
            <PanelAyuda
              key={aperturasAyuda}
              amplio={amplia}
              onAbrirSoporte={() => pulsar('soporte')}
            />
          )}
        </Drawer>,
      )}
    </>
  )
}

export default BarraUtilidades
