import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import SupportAgentOutlined from '@mui/icons-material/HeadsetMicOutlined'
import { AYUDA, type SeccionAyuda } from './contenido'
import { textoPasos, trozosDeTexto } from './formato'
import {
  PAGINAS_AYUDA,
  elegirPaginaAyuda,
  paginaAyudaMostrada,
  type EleccionAyuda,
  type PaginaAyuda,
} from './paginas'

/**
 * Texto plano con los términos «entre comillas» resaltados (nombres de
 * botones, pestañas y opciones). React escapa todo: nunca se interpreta HTML.
 */
function TextoAyuda({ texto }: { texto: string }) {
  return (
    <>
      {trozosDeTexto(texto).map((t, i) =>
        t.termino ? (
          <Box
            key={i}
            component="span"
            sx={{ color: 'text.primary', fontWeight: 500 }}
          >
            {t.texto}
          </Box>
        ) : (
          t.texto
        ),
      )}
    </>
  )
}

const parrafoSx = {
  typography: 'body2',
  lineHeight: 1.65,
  color: 'text.secondary',
  m: 0,
} as const

/** Pasos como un recorrido: números en círculo unidos por una línea. */
function Pasos({ pasos }: { pasos: string[] }) {
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {pasos.map((paso, i) => {
        const ultimo = i === pasos.length - 1
        return (
          <Box
            component="li"
            key={i}
            sx={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '26px minmax(0, 1fr)',
              columnGap: 1.5,
              pb: ultimo ? 0 : 1.75,
              // Línea que une este número con el siguiente.
              '&::after': ultimo
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    left: 12,
                    top: 30,
                    bottom: 4,
                    width: 2,
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.25),
                  },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: 12.5,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {i + 1}
            </Box>
            <Box sx={{ ...parrafoSx, pt: '3px' }}>
              <TextoAyuda texto={paso} />
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

/** Nota final: un aviso en color, para que no pase desapercibida. */
function Nota({ texto }: { texto: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.25,
        p: 1.5,
        pr: 2,
        borderRadius: 2,
        bgcolor: (t) =>
          alpha(
            t.palette.primary.main,
            t.palette.mode === 'dark' ? 0.12 : 0.07,
          ),
        border: 1,
        borderColor: (t) => alpha(t.palette.primary.main, 0.22),
      }}
    >
      <InfoOutlined
        aria-hidden="true"
        sx={{ fontSize: 20, color: 'primary.main', mt: '1px', flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'primary.main',
            mb: 0.5,
          }}
        >
          Ten en cuenta
        </Typography>
        <Box sx={parrafoSx}>
          <TextoAyuda texto={texto} />
        </Box>
      </Box>
    </Box>
  )
}

/** Una sección como tarjeta desplegable: título y, dentro, texto, pasos y nota. */
function TarjetaSeccion({
  seccion,
  id,
  abierta,
  onAlternar,
  onAbierta,
}: {
  seccion: SeccionAyuda
  id: string
  abierta: boolean
  onAlternar: () => void
  /** Cuando termina de abrirse (ya con su altura final). */
  onAbierta: () => void
}) {
  const nPasos = seccion.pasos?.length ?? 0
  return (
    <Accordion
      id={id}
      expanded={abierta}
      onChange={onAlternar}
      disableGutters
      elevation={0}
      square={false}
      slotProps={{ transition: { unmountOnExit: true, onEntered: onAbierta } }}
      sx={{
        border: 1,
        borderColor: abierta
          ? (t) => alpha(t.palette.primary.main, 0.35)
          : 'divider',
        borderRadius: '12px !important',
        bgcolor: 'background.paper',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        boxShadow: abierta
          ? (t) =>
              t.palette.mode === 'dark'
                ? 'none'
                : '0 1px 2px rgba(60,64,67,0.12), 0 2px 6px rgba(60,64,67,0.08)'
          : 'none',
        '&::before': { display: 'none' },
        scrollMarginTop: 12,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        sx={{
          px: 2,
          minHeight: 52,
          borderRadius: '12px',
          '& .MuiAccordionSummary-content': {
            my: 1.25,
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            color: abierta ? 'primary.main' : 'text.secondary',
          },
          '@media (hover: hover) and (pointer: fine)': {
            '&:hover': { bgcolor: 'pro.hover' },
          },
        }}
      >
        <Typography
          component="h4"
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 14.5,
            fontWeight: 500,
            lineHeight: 1.35,
            color: abierta ? 'primary.main' : 'text.primary',
            transition: 'color 200ms ease',
          }}
        >
          {seccion.titulo}
        </Typography>
        {nPasos > 0 && (
          <Chip
            size="small"
            label={textoPasos(nPasos)}
            sx={{
              height: 22,
              fontSize: 11.5,
              fontWeight: 500,
              bgcolor: 'primary.light',
              color: 'primary.dark',
              flexShrink: 0,
            }}
          />
        )}
      </AccordionSummary>
      <AccordionDetails
        sx={{
          px: 2,
          pt: 0,
          pb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {seccion.texto?.map((p, i) => (
          <Box key={i} component="p" sx={parrafoSx}>
            <TextoAyuda texto={p} />
          </Box>
        ))}
        {nPasos > 0 && seccion.pasos && <Pasos pasos={seccion.pasos} />}
        {seccion.nota && <Nota texto={seccion.nota} />}
      </AccordionDetails>
    </Accordion>
  )
}

// Icono de la página en un círculo de color (cabecera y desplegable).
function IconoPagina({
  pagina,
  tamano,
}: {
  pagina: PaginaAyuda
  tamano: number
}) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: tamano,
        height: tamano,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'primary.light',
        color: 'primary.dark',
        '& .MuiSvgIcon-root': { fontSize: Math.round(tamano * 0.5) },
      }}
    >
      {pagina.icono}
    </Box>
  )
}

/**
 * Contenido del panel de Ayuda.
 * - Cabecera con tinte azul: «Ayuda sobre» (desplegable con las páginas del
 *   menú; marca la página en la que está el profesional), y el icono, el
 *   título y la introducción de la página elegida.
 * - «En esta página»: un chip por sección; al pulsarlo se abre y se va a ella.
 * - Las secciones, como tarjetas desplegables (la primera, abierta).
 * - Al final, «¿Necesitas más ayuda?», que abre Soporte.
 * Elegir otra página solo cambia la ayuda: no navega. Si el profesional
 * cambia de pantalla con el panel abierto, la ayuda pasa a la nueva.
 */
function PanelAyuda({
  onAbrirSoporte,
  amplio = false,
}: {
  onAbrirSoporte?: () => void
  /** A pantalla completa: contenido centrado e índice lateral fijo. */
  amplio?: boolean
}) {
  const { pathname, key: visita } = useLocation()
  const [eleccion, setEleccion] = useState<EleccionAyuda>(null)
  const clave = paginaAyudaMostrada(pathname, visita, eleccion)
  const ayuda = AYUDA[clave]
  const pagina = PAGINAS_AYUDA.find((p) => p.clave === clave)

  // Secciones abiertas (por página): al cambiar de página, la primera.
  const [abiertas, setAbiertas] = useState<{ clave: string; ids: number[] }>({
    clave,
    ids: [0],
  })
  const idsAbiertas = abiertas.clave === clave ? abiertas.ids : [0]
  const alternar = (i: number) =>
    setAbiertas({
      clave,
      ids: idsAbiertas.includes(i)
        ? idsAbiertas.filter((x) => x !== i)
        : [...idsAbiertas, i],
    })

  const scroll = useRef<HTMLDivElement>(null)
  // Deja la sección arriba del contenido del panel, con un poco de aire. Se
  // desplaza solo ese contenido (no la página ni el panel entero).
  const desplazarA = (i: number) => {
    const caja = scroll.current
    const seccion = document.getElementById(`pro-ayuda-seccion-${i}`)
    if (!caja || !seccion) return
    const reducir = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const arriba =
      seccion.getBoundingClientRect().top -
      caja.getBoundingClientRect().top +
      caja.scrollTop -
      12
    caja.scrollTo({ top: arriba, behavior: reducir ? 'auto' : 'smooth' })
  }

  // Sección a la que ir en cuanto termine de abrirse (si estaba cerrada,
  // antes el contenido no es lo bastante alto para llegar).
  const pendiente = useRef<number | null>(null)
  const irASeccion = (i: number) => {
    if (idsAbiertas.includes(i)) {
      desplazarA(i)
      return
    }
    pendiente.current = i
    setAbiertas({ clave, ids: [...idsAbiertas, i] })
  }
  const alAbrirse = (i: number) => {
    if (pendiente.current !== i) return
    pendiente.current = null
    desplazarA(i)
  }

  const cambiarPagina = (nueva: string) => {
    setEleccion(elegirPaginaAyuda(nueva, visita))
    scroll.current?.scrollTo({ top: 0 })
  }

  const secciones = ayuda?.secciones ?? []
  // Última sección elegida en el índice (se resalta en el índice lateral).
  const [activa, setActiva] = useState<{ clave: string; i: number } | null>(
    null,
  )
  const iActiva = activa?.clave === clave ? activa.i : null
  const elegirSeccion = (i: number) => {
    setActiva({ clave, i })
    irASeccion(i)
  }

  const etiquetaSx = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'text.secondary',
  } as const

  const selector = (
    <Box sx={{ width: amplio ? 300 : '100%', flexShrink: 0 }}>
      <Typography
        id="pro-ayuda-pagina-etiqueta"
        component="label"
        sx={{ ...etiquetaSx, mb: 0.75 }}
      >
        Ayuda sobre
      </Typography>
      <Select
        labelId="pro-ayuda-pagina-etiqueta"
        id="pro-ayuda-pagina"
        value={clave}
        onChange={(e) => cambiarPagina(e.target.value)}
        size="small"
        fullWidth
        renderValue={(valor) => {
          const p = PAGINAS_AYUDA.find((x) => x.clave === valor)
          return p ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <IconoPagina pagina={p} tamano={24} />
              <span>{p.nombre}</span>
            </Box>
          ) : null
        }}
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          '& .MuiSelect-select': { py: 0.875 },
        }}
        MenuProps={{
          slotProps: { paper: { sx: { borderRadius: 2, mt: 0.5 } } },
        }}
      >
        {PAGINAS_AYUDA.map((p) => (
          <MenuItem key={p.clave} value={p.clave} sx={{ gap: 0.5 }}>
            <ListItemIcon
              sx={{
                color: 'text.secondary',
                '& .MuiSvgIcon-root': { fontSize: 20 },
              }}
            >
              {p.icono}
            </ListItemIcon>
            <ListItemText primary={p.nombre} />
          </MenuItem>
        ))}
      </Select>
    </Box>
  )

  const tituloPagina = ayuda && pagina && (
    <Box
      sx={{
        display: 'flex',
        gap: amplio ? 2.5 : 2,
        alignItems: 'flex-start',
        flex: 1,
        minWidth: 0,
      }}
    >
      <IconoPagina pagina={pagina} tamano={amplio ? 56 : 44} />
      <Box sx={{ minWidth: 0 }}>
        {/* aria-live solo en el título: al cambiar de página se anuncia
            cuál es, sin leer toda la ayuda de golpe. */}
        <Typography
          component="h3"
          aria-live="polite"
          sx={{
            fontSize: amplio ? 28 : 20,
            fontWeight: amplio ? 400 : 500,
            lineHeight: 1.25,
            color: 'text.primary',
            letterSpacing: '-0.005em',
            mt: amplio ? 0.5 : 0,
          }}
        >
          {ayuda.titulo}
        </Typography>
        {secciones.length > 0 && (
          <Box
            sx={{
              ...parrafoSx,
              mt: amplio ? 1 : 0.75,
              fontSize: amplio ? 15 : undefined,
              maxWidth: amplio ? 640 : undefined,
            }}
          >
            <TextoAyuda texto={ayuda.introduccion} />
          </Box>
        )}
      </Box>
    </Box>
  )

  const vacio = ayuda && secciones.length === 0 && (
    // Página sin ayuda (aún no existe): estado vacío.
    <Box sx={{ pt: amplio ? 6 : 2, pb: 4, textAlign: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          width: amplio ? 80 : 64,
          height: amplio ? 80 : 64,
          mx: 'auto',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.light',
          color: 'primary.dark',
        }}
      >
        <ScheduleRounded sx={{ fontSize: amplio ? 38 : 30 }} />
      </Box>
      <Chip
        label="Próximamente"
        size="small"
        sx={{
          mt: 2,
          fontWeight: 500,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          color: 'primary.main',
        }}
      />
      <Typography sx={{ ...parrafoSx, mt: 1.5, maxWidth: 280, mx: 'auto' }}>
        {ayuda.introduccion}
      </Typography>
    </Box>
  )

  // Índice en chips (panel estrecho).
  const indiceChips = secciones.length > 1 && (
    <Box component="nav" aria-labelledby="pro-ayuda-indice" sx={{ mb: 2.5 }}>
      <Typography id="pro-ayuda-indice" sx={{ ...etiquetaSx, mb: 1 }}>
        En esta página
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {secciones.map((s, i) => (
          <Chip
            key={i}
            label={s.titulo}
            size="small"
            variant="outlined"
            onClick={() => elegirSeccion(i)}
            sx={{
              height: 28,
              fontSize: 12.5,
              borderColor: 'divider',
              color: 'text.primary',
              '@media (hover: hover) and (pointer: fine)': {
                '&:hover': {
                  bgcolor: 'primary.light',
                  borderColor: 'transparent',
                  color: 'primary.dark',
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  )

  // Índice lateral fijo (pantalla completa), como el menú de un centro de
  // ayuda: la sección elegida queda resaltada.
  const indiceLateral = secciones.length > 1 && (
    <Box
      component="nav"
      aria-labelledby="pro-ayuda-indice"
      sx={{ position: 'sticky', top: 24, alignSelf: 'start' }}
    >
      <Typography
        id="pro-ayuda-indice"
        sx={{ ...etiquetaSx, mb: 1.25, px: 1.5 }}
      >
        En esta página
      </Typography>
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          borderLeft: 2,
          borderColor: 'divider',
        }}
      >
        {secciones.map((s, i) => {
          const esActiva = iActiva === i
          return (
            <li key={i}>
              <ButtonBase
                onClick={() => elegirSeccion(i)}
                aria-current={esActiva ? 'true' : undefined}
                sx={{
                  width: 'calc(100% + 2px)',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  ml: '-2px',
                  py: 0.875,
                  px: 1.5,
                  borderLeft: 2,
                  borderColor: esActiva ? 'primary.main' : 'transparent',
                  borderRadius: '0 8px 8px 0',
                  fontSize: 13.5,
                  lineHeight: 1.4,
                  fontWeight: esActiva ? 500 : 400,
                  color: esActiva ? 'primary.main' : 'text.secondary',
                  bgcolor: esActiva
                    ? (t) =>
                        alpha(
                          t.palette.primary.main,
                          t.palette.mode === 'dark' ? 0.14 : 0.08,
                        )
                    : 'transparent',
                  transition:
                    'background-color 160ms ease, color 160ms ease, border-color 160ms ease',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': {
                      color: esActiva ? 'primary.main' : 'text.primary',
                      bgcolor: esActiva ? undefined : 'pro.hover',
                    },
                  },
                  '&.Mui-focusVisible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: -2,
                  },
                }}
              >
                {s.titulo}
              </ButtonBase>
            </li>
          )
        })}
      </Box>
    </Box>
  )

  const tarjetas = secciones.length > 0 && (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {secciones.map((s, i) => (
        <TarjetaSeccion
          key={`${clave}-${i}`}
          id={`pro-ayuda-seccion-${i}`}
          seccion={s}
          abierta={idsAbiertas.includes(i)}
          onAlternar={() => alternar(i)}
          onAbierta={() => alAbrirse(i)}
        />
      ))}
    </Box>
  )

  // Si la ayuda no basta: a Soporte.
  const soporte = onAbrirSoporte && (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.paper',
          color: 'primary.main',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <SupportAgentOutlined sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}
        >
          ¿Necesitas más ayuda?
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          Abre el panel de Soporte.
        </Typography>
      </Box>
      <Button
        size="small"
        variant="outlined"
        onClick={onAbrirSoporte}
        sx={{ borderRadius: 999, flexShrink: 0 }}
      >
        Soporte
      </Button>
    </Box>
  )

  // A pantalla completa, el contenido va centrado y con un ancho cómodo.
  const centrado = amplio
    ? { maxWidth: 1080, mx: 'auto', px: { md: 5, lg: 6 } }
    : { px: 3 }

  return (
    <Box
      ref={scroll}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
      }}
    >
      {/* Cabecera de la página, con un tinte azul que se desvanece. */}
      <Box
        sx={{
          background: (t) =>
            `linear-gradient(180deg, ${alpha(
              t.palette.primary.main,
              t.palette.mode === 'dark' ? 0.14 : 0.08,
            )} 0%, ${alpha(t.palette.primary.main, 0)} 100%)`,
        }}
      >
        <Box
          sx={{
            ...centrado,
            pt: amplio ? 4 : 2.5,
            pb: amplio ? 4 : 3,
            display: 'flex',
            flexDirection: amplio ? 'row-reverse' : 'column',
            alignItems: amplio ? 'flex-start' : 'stretch',
            gap: amplio ? 5 : 3,
          }}
        >
          {selector}
          {tituloPagina}
        </Box>
      </Box>

      <Box sx={{ ...centrado, pb: amplio ? 6 : 3 }}>
        {vacio}
        {secciones.length > 0 &&
          (amplio ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '220px minmax(0, 1fr)',
                columnGap: { md: 4, lg: 6 },
                alignItems: 'start',
              }}
            >
              {indiceLateral || <span />}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {tarjetas}
                {soporte}
              </Box>
            </Box>
          ) : (
            <>
              {indiceChips}
              {tarjetas}
              {soporte && <Box sx={{ mt: 3 }}>{soporte}</Box>}
            </>
          ))}
        {secciones.length === 0 && soporte && (
          <Box sx={{ maxWidth: amplio ? 480 : undefined, mx: 'auto' }}>
            {soporte}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default PanelAyuda
