import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import BugReportOutlined from '@mui/icons-material/BugReportOutlined'
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import EmojiObjectsOutlined from '@mui/icons-material/EmojiObjectsOutlined'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import SendRounded from '@mui/icons-material/SendRounded'
import ThumbDownOffAltOutlined from '@mui/icons-material/ThumbDownOffAltOutlined'
import ThumbUpOffAltOutlined from '@mui/icons-material/ThumbUpOffAltOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import { PAGINAS_AYUDA, paginaDeRuta } from '../ayuda/paginas'
import { useModoColor } from '../theme/modoColor'
import {
  LIMITES_SOPORTE,
  PAGINA_OTRA,
  SUBTIPOS_COMENTARIO,
  construirMensajeSoporte,
  textoSoporteValido,
  type BorradoresSoporte,
  type SubtipoComentario,
  type TipoMensajeSoporte,
} from './modelo'
import {
  cargarBorradores,
  enviarMensajeSoporte,
  guardarBorradores,
} from './soporteService'

// Mismo lenguaje visual que el panel de Ayuda: etiquetas en versalitas,
// párrafos grises, cabecera con tinte azul e icono en un círculo de color.
const etiquetaSx = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: 0.75,
} as const

const parrafoSx = {
  typography: 'body2',
  lineHeight: 1.65,
  color: 'text.secondary',
  m: 0,
} as const

function Circulo({
  children,
  tamano,
}: {
  children: ReactNode
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
      {children}
    </Box>
  )
}

/** Cabecera de cada pestaña: tinte azul que se desvanece, icono, título y entrada. */
function Cabecera({
  icono,
  titulo,
  entrada,
}: {
  icono: ReactNode
  titulo: string
  entrada: string
}) {
  return (
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 3,
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        background: (t) =>
          `linear-gradient(180deg, ${alpha(
            t.palette.primary.main,
            t.palette.mode === 'dark' ? 0.14 : 0.08,
          )} 0%, ${alpha(t.palette.primary.main, 0)} 100%)`,
      }}
    >
      <Circulo tamano={44}>{icono}</Circulo>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="h3"
          sx={{
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'text.primary',
            letterSpacing: '-0.005em',
          }}
        >
          {titulo}
        </Typography>
        <Typography sx={{ ...parrafoSx, mt: 0.75 }}>{entrada}</Typography>
      </Box>
    </Box>
  )
}

/** Campo de texto de varias líneas, con su contador. */
function CampoTexto({
  id,
  etiqueta,
  valor,
  onCambiar,
  ayuda,
  deshabilitado,
}: {
  id: string
  etiqueta: string
  valor: string
  onCambiar: (v: string) => void
  ayuda?: string
  deshabilitado: boolean
}) {
  const corto =
    valor.trim().length > 0 && valor.trim().length < LIMITES_SOPORTE.textoMin
  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={etiquetaSx}>
        {etiqueta}
      </Typography>
      <TextField
        id={id}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        multiline
        minRows={5}
        maxRows={14}
        fullWidth
        required
        disabled={deshabilitado}
        slotProps={{
          htmlInput: {
            maxLength: LIMITES_SOPORTE.textoMax,
            'aria-describedby': `${id}-ayuda`,
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: 2,
            typography: 'body2',
            lineHeight: 1.6,
          },
        }}
      />
      <Box
        id={`${id}-ayuda`}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          mt: 0.75,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: 'text.secondary',
        }}
      >
        <span>
          {corto
            ? `Escribe al menos ${LIMITES_SOPORTE.textoMin} caracteres.`
            : ayuda}
        </span>
        <Box
          component="span"
          sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
        >
          {valor.length} de {LIMITES_SOPORTE.textoMax}
        </Box>
      </Box>
    </Box>
  )
}

/** Aviso en color suave (como «Ten en cuenta» en Ayuda), con icono. */
function Aviso({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.25,
        alignItems: 'flex-start',
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
        '& > .MuiSvgIcon-root': {
          fontSize: 20,
          color: 'primary.main',
          mt: '1px',
          flexShrink: 0,
        },
      }}
    >
      {icono}
      <Box sx={{ ...parrafoSx, minWidth: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Box>
    </Box>
  )
}

/** Botón de envío: píldora, con indicador mientras envía. */
function BotonEnviar({
  listo,
  enviando,
  onEnviar,
}: {
  listo: boolean
  enviando: boolean
  onEnviar: () => void
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        variant="contained"
        onClick={onEnviar}
        disabled={!listo || enviando}
        aria-busy={enviando}
        startIcon={
          enviando ? (
            <CircularProgress size={16} color="inherit" aria-hidden="true" />
          ) : (
            <SendRounded sx={{ fontSize: 18 }} />
          )
        }
        sx={{ borderRadius: 999, px: 2.5, minWidth: 120 }}
      >
        {enviando ? 'Enviando…' : 'Enviar'}
      </Button>
    </Box>
  )
}

/** Estado de éxito: icono, título, texto y «Enviar otro». */
function Enviado({
  titulo,
  texto,
  onOtro,
}: {
  titulo: string
  texto: string
  onOtro: () => void
}) {
  return (
    <Box role="status" sx={{ px: 3, pt: 6, pb: 4, textAlign: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 72,
          height: 72,
          mx: 'auto',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.light',
          color: 'primary.dark',
          // Un halo suave alrededor, del mismo azul.
          boxShadow: (t) =>
            `0 0 0 8px ${alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.1 : 0.06)}`,
        }}
      >
        <CheckRounded sx={{ fontSize: 36 }} />
      </Box>
      <Typography
        component="h3"
        sx={{ mt: 3, fontSize: 20, fontWeight: 500, color: 'text.primary' }}
      >
        {titulo}
      </Typography>
      <Typography
        sx={{
          ...parrafoSx,
          mt: 1,
          maxWidth: 300,
          mx: 'auto',
          overflowWrap: 'anywhere',
        }}
      >
        {texto}
      </Typography>
      <Button
        variant="outlined"
        onClick={onOtro}
        sx={{ mt: 3, borderRadius: 999, px: 2.5 }}
      >
        Enviar otro
      </Button>
    </Box>
  )
}

type Estado = 'editando' | 'enviando' | 'enviado' | 'error'

const ICONO_SUBTIPO: Record<SubtipoComentario, ReactNode> = {
  sugerencia: <EmojiObjectsOutlined />,
  me_gusta: <ThumbUpOffAltOutlined />,
  no_me_gusta: <ThumbDownOffAltOutlined />,
}

const ERROR_ENVIO =
  'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.'

/**
 * Contenido del panel de Soporte: dos pestañas, «Necesito ayuda con un
 * problema» y «Enviar comentarios». Cada una guarda un mensaje en
 * `mensajesSoporte` con el uid, el nombre y el correo de la cuenta (nunca
 * escritos a mano). Lo escrito a medias sigue ahí al volver a abrir el panel
 * durante la sesión; si el envío falla, no se pierde.
 */
function PanelSoporte() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { modo } = useModoColor()
  const paginaActual = paginaDeRuta(pathname)

  const [pestana, setPestana] = useState<TipoMensajeSoporte>('problema')
  const [borradores, setBorradores] =
    useState<BorradoresSoporte>(cargarBorradores)
  const [estados, setEstados] = useState<Record<TipoMensajeSoporte, Estado>>({
    problema: 'editando',
    comentario: 'editando',
  })

  useEffect(() => guardarBorradores(borradores), [borradores])

  const correo = user?.email ?? null
  const problema = borradores.problema
  const comentario = borradores.comentario
  // Sin elegir a mano, «¿En qué página ocurre?» marca la página actual.
  const paginaProblema = problema.pagina ?? paginaActual

  const cambiar = <T extends TipoMensajeSoporte>(
    tipo: T,
    cambios: Partial<BorradoresSoporte[T]>,
  ) => {
    setBorradores((b) => ({ ...b, [tipo]: { ...b[tipo], ...cambios } }))
    // Al volver a escribir tras un error, el aviso se va.
    setEstados((e) => (e[tipo] === 'error' ? { ...e, [tipo]: 'editando' } : e))
  }

  const enviar = async (tipo: TipoMensajeSoporte) => {
    if (!user || !correo || estados[tipo] === 'enviando') return
    const borrador = borradores[tipo]
    if (!textoSoporteValido(borrador.texto)) return
    if (tipo === 'comentario' && !comentario.subtipo) return
    setEstados((e) => ({ ...e, [tipo]: 'enviando' }))
    try {
      await enviarMensajeSoporte(
        construirMensajeSoporte({
          cuenta: { uid: user.uid, nombre: user.displayName, correo },
          tipo,
          subtipo: tipo === 'comentario' ? comentario.subtipo : null,
          pagina: tipo === 'problema' ? paginaProblema : paginaActual,
          texto: borrador.texto,
          ruta: pathname,
          navegador: navigator.userAgent,
          modoOscuro: modo === 'dark',
        }),
      )
      // Enviado: el borrador se vacía.
      setBorradores((b) => ({
        ...b,
        [tipo]:
          tipo === 'problema'
            ? { texto: '', pagina: null }
            : { texto: '', subtipo: null },
      }))
      setEstados((e) => ({ ...e, [tipo]: 'enviado' }))
    } catch {
      // El texto se queda tal cual para reintentar.
      setEstados((e) => ({ ...e, [tipo]: 'error' }))
    }
  }

  const otro = (tipo: TipoMensajeSoporte) =>
    setEstados((e) => ({ ...e, [tipo]: 'editando' }))

  const estado = estados[pestana]
  const enviando = estado === 'enviando'

  const formularioProblema = (
    <>
      <Cabecera
        icono={<BugReportOutlined />}
        titulo="Necesito ayuda con un problema"
        entrada="Cuéntanos qué ha pasado y te responderemos por correo."
      />
      <Box
        sx={{
          px: 3,
          pb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Box>
          <Typography
            id="soporte-pagina-etiqueta"
            component="label"
            sx={etiquetaSx}
          >
            ¿En qué página ocurre?
          </Typography>
          <Select
            labelId="soporte-pagina-etiqueta"
            id="soporte-pagina"
            value={paginaProblema}
            onChange={(e) => cambiar('problema', { pagina: e.target.value })}
            disabled={enviando}
            size="small"
            fullWidth
            renderValue={(valor) => {
              const p = PAGINAS_AYUDA.find((x) => x.clave === valor)
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Circulo tamano={24}>
                    {p ? p.icono : <HelpOutlineRounded />}
                  </Circulo>
                  <span>{p ? p.nombre : 'Otra o no lo sé'}</span>
                </Box>
              )
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
            {[
              ...PAGINAS_AYUDA,
              {
                clave: PAGINA_OTRA,
                nombre: 'Otra o no lo sé',
                icono: <HelpOutlineRounded />,
              },
            ].map((p) => (
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

        <CampoTexto
          id="soporte-problema-texto"
          etiqueta="¿Qué ha pasado?"
          valor={problema.texto}
          onCambiar={(texto) => cambiar('problema', { texto })}
          ayuda="Cuanto más detalle, mejor: qué querías hacer y qué ha ocurrido."
          deshabilitado={enviando}
        />

        {correo && (
          <Aviso icono={<MailOutlineRounded />}>
            Te responderemos a{' '}
            <Box
              component="span"
              sx={{ color: 'text.primary', fontWeight: 500 }}
            >
              {correo}
            </Box>
            .
          </Aviso>
        )}

        {estados.problema === 'error' && (
          <Alert severity="error">{ERROR_ENVIO}</Alert>
        )}

        <BotonEnviar
          listo={Boolean(correo) && textoSoporteValido(problema.texto)}
          enviando={enviando}
          onEnviar={() => void enviar('problema')}
        />
      </Box>
    </>
  )

  const formularioComentario = (
    <>
      <Cabecera
        icono={<ChatBubbleOutlineRounded />}
        titulo="Enviar comentarios"
        entrada="Tu opinión nos ayuda a mejorar NeuroAudio."
      />
      <Box
        sx={{
          px: 3,
          pb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Box>
          <Typography id="soporte-tipo-etiqueta" sx={etiquetaSx}>
            Tipo
          </Typography>
          {/* Tres opciones, una a elegir: como tarjetas pequeñas con icono. */}
          <Box
            role="radiogroup"
            aria-labelledby="soporte-tipo-etiqueta"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {SUBTIPOS_COMENTARIO.map((s) => {
              const elegido = comentario.subtipo === s.valor
              return (
                <ButtonBase
                  key={s.valor}
                  role="radio"
                  aria-checked={elegido}
                  disabled={enviando}
                  onClick={() => cambiar('comentario', { subtipo: s.valor })}
                  sx={{
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2,
                    border: 1,
                    borderColor: elegido
                      ? (t) => alpha(t.palette.primary.main, 0.5)
                      : 'divider',
                    bgcolor: elegido ? 'primary.light' : 'background.paper',
                    color: elegido ? 'primary.dark' : 'text.primary',
                    fontSize: 14,
                    fontWeight: elegido ? 500 : 400,
                    textAlign: 'left',
                    transition:
                      'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
                    '& .MuiSvgIcon-root': {
                      fontSize: 20,
                      color: elegido ? 'primary.dark' : 'text.secondary',
                    },
                    '@media (hover: hover) and (pointer: fine)': {
                      '&:hover': {
                        bgcolor: elegido ? 'pro.activoHover' : 'pro.hover',
                      },
                    },
                    '&.Mui-focusVisible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  {ICONO_SUBTIPO[s.valor]}
                  <Box component="span" sx={{ flex: 1 }}>
                    {s.etiqueta}
                  </Box>
                  {elegido && <CheckRounded aria-hidden="true" />}
                </ButtonBase>
              )
            })}
          </Box>
        </Box>

        <CampoTexto
          id="soporte-comentario-texto"
          etiqueta="Tu comentario"
          valor={comentario.texto}
          onCambiar={(texto) => cambiar('comentario', { texto })}
          deshabilitado={enviando}
        />

        {estados.comentario === 'error' && (
          <Alert severity="error">{ERROR_ENVIO}</Alert>
        )}

        <BotonEnviar
          listo={
            Boolean(correo) &&
            Boolean(comentario.subtipo) &&
            textoSoporteValido(comentario.texto)
          }
          enviando={enviando}
          onEnviar={() => void enviar('comentario')}
        />
      </Box>
    </>
  )

  let contenido: ReactNode
  if (estado === 'enviado') {
    contenido =
      pestana === 'problema' ? (
        <Enviado
          titulo="Mensaje enviado"
          texto={`Gracias. Te responderemos a ${correo ?? 'tu correo'} lo antes posible.`}
          onOtro={() => otro('problema')}
        />
      ) : (
        <Enviado
          titulo="Comentario enviado"
          texto="Gracias. Lo leeremos con atención."
          onOtro={() => otro('comentario')}
        />
      )
  } else {
    contenido =
      pestana === 'problema' ? formularioProblema : formularioComentario
  }

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      <Tabs
        value={pestana}
        onChange={(_, v: TipoMensajeSoporte) => setPestana(v)}
        variant="fullWidth"
        aria-label="Apartados de soporte"
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab
          value="problema"
          label="Necesito ayuda con un problema"
          id="pro-soporte-pestana-problema"
          aria-controls="pro-soporte-apartado"
          sx={{ textTransform: 'none', fontSize: 13 }}
        />
        <Tab
          value="comentario"
          label="Enviar comentarios"
          id="pro-soporte-pestana-comentario"
          aria-controls="pro-soporte-apartado"
          sx={{ textTransform: 'none', fontSize: 13 }}
        />
      </Tabs>
      <Box
        role="tabpanel"
        id="pro-soporte-apartado"
        aria-labelledby={`pro-soporte-pestana-${pestana}`}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {!correo && user && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Alert severity="warning">
              Tu cuenta no tiene correo, así que no podemos responderte.
            </Alert>
          </Box>
        )}
        {contenido}
      </Box>
    </Box>
  )
}

export default PanelSoporte
