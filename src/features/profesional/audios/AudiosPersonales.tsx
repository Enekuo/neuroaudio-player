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
import InputAdornment from '@mui/material/InputAdornment'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import PublishRounded from '@mui/icons-material/PublishRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
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
import {
  escucharMisOyentes,
  escucharPerfil,
} from '../../perfilProfesional/perfilService'
import { animacionEntrada } from '../theme/movimiento'
import DialogoAudio from './DialogoAudio'

type Filtro = 'todos' | 'publicado' | 'borrador'

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type Edicion = { audio?: AudioProfesional } | null
type Confirmacion = {
  audio: AudioProfesional
  accion: 'despublicar' | 'borrar'
}

/**
 * Pestaña «Para una persona»: audios que solo ve y escucha un oyente
 * concreto, con vínculo activo con el profesional. Buscador, filtro por
 * estado y por persona; subir (eligiendo antes a la persona), editar,
 * publicar, despublicar y borrar. La persona de un audio no se puede
 * cambiar. Nunca se mezclan con los generales ni entran en las listas.
 */
function AudiosPersonales({ uid }: { uid: string }) {
  const [audios, setAudios] = useState<AudioProfesional[] | null>(null)
  const [oyentes, setOyentes] = useState<OyenteDelProfesional[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const [fotoPrincipalId, setFotoPrincipalId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [persona, setPersona] = useState('todas')
  const [edicion, setEdicion] = useState<Edicion>(null)
  const [confirmar, setConfirmar] = useState<Confirmacion | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [menu, setMenu] = useState<{
    ancla: HTMLElement
    audio: AudioProfesional
  } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(
    () =>
      escucharMisAudiosPersonales(
        uid,
        (lista) => {
          setAudios(lista)
          setErrorCarga(false)
        },
        () => setErrorCarga(true),
      ),
    [uid],
  )

  useEffect(
    () => escucharMisOyentes(uid, setOyentes, () => setErrorCarga(true)),
    [uid],
  )

  // Para la portada «Foto del profesional»: su foto principal.
  useEffect(
    () =>
      escucharPerfil(uid, (perfil) =>
        setFotoPrincipalId(perfil?.fotoPrincipalId ?? null),
      ),
    [uid],
  )

  const porUid = useMemo(
    () => new Map((oyentes ?? []).map((o) => [o.oyenteUid, o])),
    [oyentes],
  )
  const nombre = (oyenteUid: string | null) =>
    oyenteUid
      ? etiquetaOyente(porUid.get(oyenteUid) ?? { oyenteUid, nombre: '' })
      : ''
  const activos = (oyentes ?? []).filter((o) => o.estado === 'activo')

  // En el filtro: los oyentes activos y cualquiera que ya tenga audios.
  const personas = useMemo(() => {
    const uids = new Set([
      ...(oyentes ?? [])
        .filter((o) => o.estado === 'activo')
        .map((o) => o.oyenteUid),
      ...(audios ?? []).map((a) => a.destinatarioUid ?? ''),
    ])
    uids.delete('')
    return [...uids]
      .map((oyenteUid) => ({
        oyenteUid,
        etiqueta: etiquetaOyente(
          porUid.get(oyenteUid) ?? { oyenteUid, nombre: '' },
        ),
      }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))
  }, [oyentes, audios, porUid])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return (audios ?? []).filter(
      (a) =>
        (filtro === 'todos' || a.estado === filtro) &&
        (persona === 'todas' || a.destinatarioUid === persona) &&
        (!q || normalizar(a.titulo).includes(q)),
    )
  }, [audios, busqueda, filtro, persona])

  const ordenNuevo =
    audios && audios.length > 0
      ? Math.min(...audios.map((a) => a.orden)) - 1
      : 0

  const publicar = async (audio: AudioProfesional) => {
    try {
      await actualizarAudio(audio.id, { estado: 'publicado' })
      setAviso(
        `«${audio.titulo}» publicado. Ya lo ve ${nombre(audio.destinatarioUid)}.`,
      )
    } catch {
      setAviso('No se pudo cambiar el estado. Inténtalo de nuevo.')
    }
  }

  const confirmarAccion = async () => {
    if (!confirmar) return
    const { audio, accion } = confirmar
    setOcupado(true)
    try {
      if (accion === 'borrar') {
        await borrarAudio(audio)
        setAviso(`«${audio.titulo}» borrado.`)
      } else {
        await actualizarAudio(audio.id, { estado: 'borrador' })
        setAviso(
          `«${audio.titulo}» despublicado. ${nombre(audio.destinatarioUid)} ya no lo ve.`,
        )
      }
      setConfirmar(null)
    } catch {
      setAviso(
        accion === 'borrar'
          ? 'No se pudo borrar el audio. Inténtalo de nuevo.'
          : 'No se pudo cambiar el estado. Inténtalo de nuevo.',
      )
    } finally {
      setOcupado(false)
    }
  }

  if (errorCarga) {
    return (
      <Alert severity="error">
        No se pudieron cargar tus audios. Revisa tu conexión y vuelve a entrar.
      </Alert>
    )
  }
  if (!audios || !oyentes) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando audios" />
      </Box>
    )
  }

  const botonSubir = (texto: string) => (
    <Tooltip
      title={
        activos.length === 0
          ? 'Necesitas al menos un oyente con vínculo activo.'
          : ''
      }
    >
      <span>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setEdicion({})}
          disabled={activos.length === 0}
        >
          {texto}
        </Button>
      </span>
    </Tooltip>
  )

  let contenido
  if (audios.length === 0) {
    const sinOyentes = activos.length === 0
    contenido = (
      <Paper
        variant="outlined"
        sx={[
          { px: 3, py: 7, textAlign: 'center' },
          animacionEntrada({ retardo: 60 }),
        ]}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 2,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.light',
            color: 'primary.main',
          }}
        >
          <PersonOutlineRounded />
        </Box>
        <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
          {sinOyentes
            ? 'Todavía no tienes oyentes'
            : 'Aún no has creado audios para una persona'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: sinOyentes ? 0 : 3, maxWidth: 440, mx: 'auto' }}
        >
          {sinOyentes
            ? 'Cuando alguien se una a ti, podrás crearle audios.'
            : 'Un audio para una persona solo lo ve y lo escucha ella.'}
        </Typography>
        {!sinOyentes && botonSubir('Crear un audio para una persona')}
      </Paper>
    )
  } else {
    contenido = (
      <>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por título"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ flex: '1 1 220px', maxWidth: 360 }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar por título' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label="Persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="todas">Todas</MenuItem>
            {personas.map((p) => (
              <MenuItem key={p.oyenteUid} value={p.oyenteUid}>
                {p.etiqueta}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Estado"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="publicado">Publicados</MenuItem>
            <MenuItem value="borrador">Borradores</MenuItem>
          </TextField>
          <Box sx={{ flex: 1 }} />
          {botonSubir('Subir audio')}
        </Box>

        {activos.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Ahora no tienes oyentes con vínculo activo: no puedes crear audios
            nuevos para una persona.
          </Alert>
        )}

        {visibles.length === 0 ? (
          <Paper variant="outlined" sx={{ py: 5, px: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Ningún audio coincide con la búsqueda.
            </Typography>
          </Paper>
        ) : (
          <Paper
            variant="outlined"
            component="ul"
            sx={{ listStyle: 'none', m: 0, p: 0, overflow: 'hidden' }}
          >
            {visibles.map((audio, indice) => {
              const oyente = audio.destinatarioUid
                ? porUid.get(audio.destinatarioUid)
                : undefined
              const enPausa = oyente?.estado !== 'activo'
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
                        icon={<PersonOutlineRounded />}
                        label={nombre(audio.destinatarioUid)}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={
                          audio.estado === 'publicado'
                            ? 'Publicado'
                            : 'Borrador'
                        }
                        color={
                          audio.estado === 'publicado' ? 'success' : 'default'
                        }
                        variant={
                          audio.estado === 'publicado' ? 'filled' : 'outlined'
                        }
                      />
                      {enPausa && (
                        <Chip
                          size="small"
                          color="warning"
                          variant="outlined"
                          label="Vínculo en pausa: no lo ve"
                        />
                      )}
                      {audio.contieneSalud && (
                        <Chip size="small" variant="outlined" label="Salud" />
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: { sm: 'none' } }}
                      >
                        {formatTime(audio.duracionSegundos)}
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
                      onClick={(e) =>
                        setMenu({ ancla: e.currentTarget, audio })
                      }
                    >
                      <MoreVertRounded />
                    </IconButton>
                  </Tooltip>
                </Box>
              )
            })}
          </Paper>
        )}
      </>
    )
  }

  const audioMenu = menu?.audio

  return (
    <Box>
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
          personal={{ oyentes }}
          onCerrar={(mensaje) => {
            setEdicion(null)
            if (mensaje) setAviso(mensaje)
          }}
        />
      )}

      <Dialog
        open={Boolean(confirmar)}
        onClose={() => !ocupado && setConfirmar(null)}
        aria-labelledby="confirmar-personal-titulo"
      >
        <DialogTitle id="confirmar-personal-titulo">
          {confirmar?.accion === 'borrar'
            ? '¿Borrar este audio?'
            : '¿Despublicar este audio?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmar?.accion === 'borrar'
              ? `Vas a borrar «${confirmar.audio.titulo}». ${nombre(confirmar.audio.destinatarioUid)} dejará de verlo y no se puede deshacer.`
              : `${nombre(confirmar?.audio.destinatarioUid ?? null)} dejará de ver «${confirmar?.audio.titulo}». Podrás volver a publicarlo cuando quieras.`}
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

      <Snackbar
        open={aviso !== null}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
      />
    </Box>
  )
}

export default AudiosPersonales
