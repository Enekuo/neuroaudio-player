import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PublishRounded from '@mui/icons-material/PublishRounded'
import UnpublishedOutlined from '@mui/icons-material/UnpublishedOutlined'
import {
  actualizarAudio,
  borrarAudio,
  escucharMisAudiosPersonales,
} from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import PortadaAudio from '../../audiosProfesional/PortadaAudio'
import { formatTime } from '../../library/utils/formatTime'
import {
  etiquetaOyente,
  type OyenteDelProfesional,
} from '../../perfilProfesional/modelo'
import DialogoAudio from '../audios/DialogoAudio'
import { formatoFecha } from './formato'

type AudiosParaLaPersonaProps = {
  uid: string
  oyente: OyenteDelProfesional
  oyentes: OyenteDelProfesional[]
  fotoPrincipalId: string | null
  onAviso: (mensaje: string) => void
}

type Confirmar = {
  audio: AudioProfesional
  accion: 'borrar' | 'despublicar'
} | null

/**
 * En la ficha de una persona: los audios «Para una persona» hechos para
 * ella (título, estado y fecha), con «Crear audio para esta persona» y los
 * mismos editar, publicar, despublicar y borrar que en su pestaña de
 * «Audios» (mismo diálogo y mismos avisos).
 */
function AudiosParaLaPersona({
  uid,
  oyente,
  oyentes,
  fotoPrincipalId,
  onAviso,
}: AudiosParaLaPersonaProps) {
  // Todos los personales del profesional (para el orden de uno nuevo).
  const [todos, setTodos] = useState<AudioProfesional[] | null>(null)
  const [error, setError] = useState(false)
  const [intento, setIntento] = useState(0)
  const [edicion, setEdicion] = useState<{ audio?: AudioProfesional } | null>(
    null,
  )
  const [menu, setMenu] = useState<{
    ancla: HTMLElement
    audio: AudioProfesional
  } | null>(null)
  const [confirmar, setConfirmar] = useState<Confirmar>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    setError(false)
    return escucharMisAudiosPersonales(uid, setTodos, () => setError(true))
  }, [uid, intento])

  const suyos = useMemo(
    () =>
      (todos ?? [])
        .filter((a) => a.destinatarioUid === oyente.oyenteUid)
        .sort(
          (a, b) => (b.creadoEn?.getTime() ?? 0) - (a.creadoEn?.getTime() ?? 0),
        ),
    [todos, oyente.oyenteUid],
  )
  const ordenNuevo =
    todos && todos.length > 0 ? Math.min(...todos.map((a) => a.orden)) - 1 : 0

  const nombre = etiquetaOyente(oyente)
  const activo = oyente.estado === 'activo'

  const publicar = async (audio: AudioProfesional) => {
    try {
      await actualizarAudio(audio.id, { estado: 'publicado' })
      onAviso(`«${audio.titulo}» publicado. Ya lo ve ${nombre}.`)
    } catch {
      onAviso('No se pudo cambiar el estado. Inténtalo de nuevo.')
    }
  }

  const confirmarAccion = async () => {
    if (!confirmar) return
    const { audio, accion } = confirmar
    setOcupado(true)
    try {
      if (accion === 'borrar') {
        await borrarAudio(audio)
        onAviso(`«${audio.titulo}» borrado.`)
      } else {
        await actualizarAudio(audio.id, { estado: 'borrador' })
        onAviso(`«${audio.titulo}» despublicado. ${nombre} ya no lo ve.`)
      }
      setConfirmar(null)
    } catch {
      onAviso(
        accion === 'borrar'
          ? 'No se pudo borrar el audio. Inténtalo de nuevo.'
          : 'No se pudo cambiar el estado. Inténtalo de nuevo.',
      )
    } finally {
      setOcupado(false)
    }
  }

  let contenido
  if (error) {
    contenido = (
      <Alert
        severity="error"
        sx={{ mb: 3 }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => setIntento((n) => n + 1)}
          >
            Reintentar
          </Button>
        }
      >
        No se pudieron cargar sus audios. Revisa tu conexión.
      </Alert>
    )
  } else if (!todos) {
    contenido = (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 4, mb: 3 }}>
        <CircularProgress size={28} aria-label="Cargando sus audios" />
      </Box>
    )
  } else if (suyos.length === 0) {
    contenido = (
      <Paper
        variant="outlined"
        sx={{ py: 5, px: 2, textAlign: 'center', mb: 3 }}
      >
        <Typography color="text.secondary">
          Todavía no has creado ningún audio solo para esta persona.
        </Typography>
      </Paper>
    )
  } else {
    contenido = (
      <Paper
        variant="outlined"
        component="ul"
        aria-labelledby="para-la-persona-titulo"
        sx={{ listStyle: 'none', m: 0, mb: 3, p: 0, overflow: 'hidden' }}
      >
        {suyos.map((audio, indice) => {
          const publicado = audio.estado === 'publicado'
          return (
            <Box
              component="li"
              key={audio.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '44px minmax(0, 1fr) auto',
                  sm: '48px minmax(0, 1fr) auto auto auto',
                },
                alignItems: 'center',
                gap: { xs: 1.25, sm: 2 },
                px: { xs: 1.5, sm: 2 },
                py: 1.5,
                borderTop: indice === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
              }}
            >
              <PortadaAudio
                profesionalUid={uid}
                fotoPrincipalId={fotoPrincipalId}
                portada={audio.portada}
                audioId={audio.id}
                portadaImagen={audio.portadaImagen}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 10,
                  display: 'block',
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 500 }} noWrap>
                  {audio.titulo}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.75,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    mt: 0.5,
                  }}
                >
                  <Chip
                    size="small"
                    label={publicado ? 'Publicado' : 'Borrador'}
                    color={publicado ? 'success' : 'default'}
                    variant={publicado ? 'filled' : 'outlined'}
                  />
                  {audio.contieneSalud && (
                    <Chip size="small" variant="outlined" label="Salud" />
                  )}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: { sm: 'none' } }}
                  >
                    {formatTime(audio.duracionSegundos)}
                    {audio.creadoEn
                      ? ` · ${formatoFecha.format(audio.creadoEn)}`
                      : ''}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(audio.duracionSegundos)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  whiteSpace: 'nowrap',
                }}
              >
                {audio.creadoEn ? formatoFecha.format(audio.creadoEn) : ''}
              </Typography>
              <Tooltip title="Opciones">
                <IconButton
                  aria-label={`Opciones de «${audio.titulo}»`}
                  onClick={(e) => setMenu({ ancla: e.currentTarget, audio })}
                >
                  <MoreVertRounded />
                </IconButton>
              </Tooltip>
            </Box>
          )
        })}
      </Paper>
    )
  }

  const audioMenu = menu?.audio

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          id="para-la-persona-titulo"
          variant="h6"
          component="h2"
          sx={{ fontWeight: 400 }}
        >
          Hechos para esta persona
        </Typography>
        {todos && (
          <Typography color="text.secondary">({suyos.length})</Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Tooltip
          title={
            activo
              ? ''
              : 'Está en pausa: reanuda su vínculo para crear audios para ella.'
          }
        >
          <span>
            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={() => setEdicion({})}
              disabled={!activo || !todos}
            >
              Crear audio para esta persona
            </Button>
          </span>
        </Tooltip>
      </Box>

      {contenido}

      <Menu
        anchorEl={menu?.ancla}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
      >
        <MenuItem
          onClick={() => {
            setEdicion({ audio: audioMenu })
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (audioMenu?.estado === 'publicado') {
              setConfirmar({ audio: audioMenu, accion: 'despublicar' })
            } else if (audioMenu) {
              void publicar(audioMenu)
            }
            setMenu(null)
          }}
        >
          <ListItemIcon>
            {audioMenu?.estado === 'publicado' ? (
              <UnpublishedOutlined fontSize="small" />
            ) : (
              <PublishRounded fontSize="small" />
            )}
          </ListItemIcon>
          {audioMenu?.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (audioMenu) setConfirmar({ audio: audioMenu, accion: 'borrar' })
            setMenu(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlineRounded fontSize="small" />
          </ListItemIcon>
          Borrar
        </MenuItem>
      </Menu>

      {edicion && (
        <DialogoAudio
          uid={uid}
          audio={edicion.audio}
          ordenNuevo={ordenNuevo}
          fotoPrincipalId={fotoPrincipalId}
          personal={{ oyentes, destinatarioFijo: oyente.oyenteUid }}
          onCerrar={(mensaje) => {
            setEdicion(null)
            if (mensaje) onAviso(mensaje)
          }}
        />
      )}

      <Dialog
        open={Boolean(confirmar)}
        onClose={() => !ocupado && setConfirmar(null)}
        aria-labelledby="confirmar-para-la-persona-titulo"
      >
        <DialogTitle id="confirmar-para-la-persona-titulo">
          {confirmar?.accion === 'borrar'
            ? '¿Borrar este audio?'
            : '¿Despublicar este audio?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmar?.accion === 'borrar'
              ? `Vas a borrar «${confirmar.audio.titulo}». ${nombre} dejará de verlo y no se puede deshacer.`
              : `${nombre} dejará de ver «${confirmar?.audio.titulo}». Podrás volver a publicarlo cuando quieras.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(null)} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            color={confirmar?.accion === 'borrar' ? 'error' : 'primary'}
            variant="contained"
            onClick={confirmarAccion}
            disabled={ocupado}
          >
            {confirmar?.accion === 'borrar' ? 'Borrar' : 'Despublicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AudiosParaLaPersona
