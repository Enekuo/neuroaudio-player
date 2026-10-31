import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
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
import LibraryAddOutlined from '@mui/icons-material/LibraryAddOutlined'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import GraphicEqRounded from '@mui/icons-material/GraphicEqRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PublishRounded from '@mui/icons-material/PublishRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import UnpublishedOutlined from '@mui/icons-material/UnpublishedOutlined'
import {
  actualizarAudio,
  anadirDesdeBiblioteca,
  borrarAudio,
  escucharMiBiblioteca,
  escucharMisAudiosGenerales,
  guardarOrden,
} from '../../audiosProfesional/audioProfesionalService'
import {
  LIMITES_BIBLIOTECA,
  carpetaDePortada,
  type AudioProfesional,
} from '../../audiosProfesional/modelo'
import PortadaAudio from '../../audiosProfesional/PortadaAudio'
import { escucharPerfil } from '../../perfilProfesional/perfilService'
import { formatTime } from '../../library/utils/formatTime'
import { animacionEntrada } from '../theme/movimiento'
import DialogoElegirAudios from '../oyentes/DialogoElegirAudios'
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

/**
 * Pestaña «Audios generales»: la biblioteca que ven todos los oyentes con
 * acceso (solo los publicados). Lista con buscador y filtro por estado,
 * subir, editar, publicar o despublicar, borrar y reordenar.
 */
function AudiosGenerales({ uid }: { uid: string }) {
  const [audios, setAudios] = useState<AudioProfesional[] | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)
  const [fotoPrincipalId, setFotoPrincipalId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [edicion, setEdicion] = useState<Edicion>(null)
  const [aBorrar, setABorrar] = useState<AudioProfesional | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [menu, setMenu] = useState<{
    ancla: HTMLElement
    audio: AudioProfesional
  } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // «Añadir desde Biblioteca»: abierto, y sus audios (se leen solo entonces).
  const [anadiendo, setAnadiendo] = useState(false)
  const [biblioteca, setBiblioteca] = useState<AudioProfesional[] | null>(null)
  // Orden provisional mientras se guarda un reordenamiento (evita saltos).
  const [ordenLocal, setOrdenLocal] = useState<string[] | null>(null)
  // El que se arrastra: en estado (para pintarlo) y en una referencia (para
  // leerlo al soltar aunque el estado aún no se haya actualizado).
  const [arrastrado, setArrastrado] = useState<string | null>(null)
  const arrastradoRef = useRef<string | null>(null)
  const empezarArrastre = (audioId: string | null) => {
    arrastradoRef.current = audioId
    setArrastrado(audioId)
  }

  useEffect(
    () =>
      escucharMisAudiosGenerales(
        uid,
        (lista) => {
          setAudios(lista)
          setErrorCarga(false)
        },
        () => setErrorCarga(true),
      ),
    [uid],
  )

  useEffect(() => {
    if (!anadiendo) return
    return escucharMiBiblioteca(uid, setBiblioteca, () => {
      setAnadiendo(false)
      setAviso('No se pudo cargar tu Biblioteca. Inténtalo de nuevo.')
    })
  }, [uid, anadiendo])

  // Para la portada: la foto principal del propio profesional.
  useEffect(
    () =>
      escucharPerfil(uid, (perfil) =>
        setFotoPrincipalId(perfil?.fotoPrincipalId ?? null),
      ),
    [uid],
  )

  const ordenados = useMemo(() => {
    if (!audios) return []
    if (!ordenLocal) return audios
    const porId = new Map(audios.map((a) => [a.id, a]))
    const enOrden = ordenLocal
      .map((id) => porId.get(id))
      .filter((a): a is AudioProfesional => !!a)
    const resto = audios.filter((a) => !ordenLocal.includes(a.id))
    return [...enOrden, ...resto]
  }, [audios, ordenLocal])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return ordenados.filter(
      (a) =>
        (filtro === 'todos' || a.estado === filtro) &&
        (!q || normalizar(a.titulo).includes(q)),
    )
  }, [ordenados, busqueda, filtro])

  // Reordenar solo tiene sentido viendo la lista completa.
  const puedeReordenar =
    filtro === 'todos' && !busqueda.trim() && ordenados.length > 1
  const ordenNuevo =
    audios && audios.length > 0
      ? Math.min(...audios.map((a) => a.orden)) - 1
      : 0

  // Los añadidos desde Biblioteca van al final de la lista.
  const ordenAlFinal =
    audios && audios.length > 0
      ? Math.max(...audios.map((a) => a.orden)) + 1
      : 0
  const yaEnAudios = useMemo(
    () =>
      new Set(
        (audios ?? []).flatMap((a) => (a.deMisAudios ? [a.deMisAudios] : [])),
      ),
    [audios],
  )

  const anadir = async (ids: string[]) => {
    const origenes = ids
      .map((id) => biblioteca?.find((a) => a.id === id))
      .filter((a): a is AudioProfesional => !!a)
    try {
      await anadirDesdeBiblioteca(origenes, ordenAlFinal)
      setAviso(
        origenes.length === 1
          ? `«${origenes[0].titulo}» añadido a Audios y publicado.`
          : `${origenes.length} audios añadidos a Audios y publicados.`,
      )
      return null
    } catch {
      return 'No se pudieron añadir. Revisa tu conexión e inténtalo de nuevo.'
    }
  }

  const botonAnadir = (
    <Button
      variant="outlined"
      startIcon={<LibraryAddOutlined />}
      onClick={() => {
        setBiblioteca(null)
        setAnadiendo(true)
      }}
    >
      Añadir desde Biblioteca
    </Button>
  )

  const aplicarOrden = async (ids: string[]) => {
    setOrdenLocal(ids)
    try {
      await guardarOrden(ids)
    } catch {
      setAviso('No se pudo guardar el nuevo orden. Inténtalo de nuevo.')
    } finally {
      setOrdenLocal(null)
    }
  }

  const mover = (audioId: string, paso: -1 | 1) => {
    const ids = ordenados.map((a) => a.id)
    const i = ids.indexOf(audioId)
    const j = i + paso
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    void aplicarOrden(ids)
  }

  const soltarSobre = (destinoId: string) => (evento: DragEvent) => {
    evento.preventDefault()
    const origen = arrastradoRef.current
    if (!origen || origen === destinoId) return
    const ids = ordenados.map((a) => a.id).filter((id) => id !== origen)
    ids.splice(ids.indexOf(destinoId), 0, origen)
    empezarArrastre(null)
    void aplicarOrden(ids)
  }

  const cambiarEstado = async (audio: AudioProfesional) => {
    const estado = audio.estado === 'publicado' ? 'borrador' : 'publicado'
    try {
      await actualizarAudio(audio.id, { estado })
      setAviso(
        estado === 'publicado'
          ? `«${audio.titulo}» publicado. Ya lo ven tus oyentes con acceso.`
          : `«${audio.titulo}» despublicado. Tus oyentes ya no lo ven.`,
      )
    } catch {
      setAviso('No se pudo cambiar el estado. Inténtalo de nuevo.')
    }
  }

  const confirmarBorrado = async () => {
    if (!aBorrar) return
    setBorrando(true)
    try {
      await borrarAudio(aBorrar)
      setAviso(
        aBorrar.deMisAudios
          ? `«${aBorrar.titulo}» quitado de Audios. Sigue en Biblioteca.`
          : `«${aBorrar.titulo}» borrado.`,
      )
      setABorrar(null)
    } catch {
      setAviso('No se pudo borrar el audio. Inténtalo de nuevo.')
    } finally {
      setBorrando(false)
    }
  }

  if (errorCarga) {
    return (
      <Alert severity="error">
        No se pudieron cargar tus audios. Revisa tu conexión y vuelve a entrar.
      </Alert>
    )
  }
  if (!audios) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando audios" />
      </Box>
    )
  }

  const contenido =
    audios.length === 0 ? (
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
          <GraphicEqRounded />
        </Box>
        <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
          Aún no has subido audios
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 3, maxWidth: 440, mx: 'auto' }}
        >
          Los audios generales que publiques los escucharán todas las personas
          que tienen acceso a ti.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setEdicion({})}
          >
            Subir tu primer audio
          </Button>
          {botonAnadir}
        </Box>
      </Paper>
    ) : (
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
          {botonAnadir}
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setEdicion({})}
          >
            Subir audio
          </Button>
        </Box>

        {!puedeReordenar &&
          ordenados.length > 1 &&
          (busqueda.trim() || filtro !== 'todos') && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Para cambiar el orden, quita la búsqueda y el filtro.
            </Typography>
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
            {visibles.map((audio, indice) => (
              <Box
                component="li"
                key={audio.id}
                draggable={puedeReordenar}
                onDragStart={() => empezarArrastre(audio.id)}
                onDragEnd={() => empezarArrastre(null)}
                onDragOver={(e) => puedeReordenar && e.preventDefault()}
                onDrop={soltarSobre(audio.id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'auto 44px minmax(0, 1fr) auto',
                    sm: 'auto 48px minmax(0, 1fr) auto auto auto',
                  },
                  alignItems: 'center',
                  gap: { xs: 1.25, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  py: 1.5,
                  borderTop: indice === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                  bgcolor:
                    arrastrado === audio.id
                      ? 'action.selected'
                      : 'background.paper',
                  opacity: arrastrado === audio.id ? 0.6 : 1,
                  transition: 'background-color 160ms ease, opacity 160ms ease',
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    display: 'flex',
                    color: puedeReordenar ? 'text.secondary' : 'text.disabled',
                    cursor: puedeReordenar ? 'grab' : 'default',
                  }}
                >
                  <DragIndicatorRounded fontSize="small" />
                </Box>
                <PortadaAudio
                  profesionalUid={uid}
                  fotoPrincipalId={fotoPrincipalId}
                  portada={audio.portada}
                  audioId={carpetaDePortada(audio).audioId}
                  biblioteca={carpetaDePortada(audio).biblioteca}
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
                      label={
                        audio.estado === 'publicado' ? 'Publicado' : 'Borrador'
                      }
                      color={
                        audio.estado === 'publicado' ? 'success' : 'default'
                      }
                      variant={
                        audio.estado === 'publicado' ? 'filled' : 'outlined'
                      }
                    />
                    {audio.contieneSalud && (
                      <Chip size="small" variant="outlined" label="Salud" />
                    )}
                    {audio.deMisAudios && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label="De Biblioteca"
                      />
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
                    onClick={(e) => setMenu({ ancla: e.currentTarget, audio })}
                  >
                    <MoreVertRounded />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Paper>
        )}
      </>
    )

  const audioMenu = menu?.audio
  const posicion = audioMenu
    ? ordenados.findIndex((a) => a.id === audioMenu.id)
    : -1

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
            if (audioMenu) void cambiarEstado(audioMenu)
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
        {puedeReordenar && (
          <MenuItem
            disabled={posicion <= 0}
            onClick={() => {
              if (audioMenu) mover(audioMenu.id, -1)
              setMenu(null)
            }}
          >
            <ListItemIcon>
              <ArrowUpwardRounded fontSize="small" />
            </ListItemIcon>
            Subir
          </MenuItem>
        )}
        {puedeReordenar && (
          <MenuItem
            disabled={posicion < 0 || posicion >= ordenados.length - 1}
            onClick={() => {
              if (audioMenu) mover(audioMenu.id, 1)
              setMenu(null)
            }}
          >
            <ListItemIcon>
              <ArrowDownwardRounded fontSize="small" />
            </ListItemIcon>
            Bajar
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setABorrar(audioMenu ?? null)
            setMenu(null)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlineRounded fontSize="small" />
          </ListItemIcon>
          {audioMenu?.deMisAudios ? 'Quitar de Audios' : 'Borrar'}
        </MenuItem>
      </Menu>

      {edicion && (
        <DialogoAudio
          uid={uid}
          audio={edicion.audio}
          ordenNuevo={ordenNuevo}
          fotoPrincipalId={fotoPrincipalId}
          onCerrar={(mensaje) => {
            setEdicion(null)
            if (mensaje) setAviso(mensaje)
          }}
        />
      )}

      <Dialog
        open={Boolean(aBorrar)}
        onClose={() => !borrando && setABorrar(null)}
        aria-labelledby="borrar-audio-titulo"
      >
        <DialogTitle id="borrar-audio-titulo">
          {aBorrar?.deMisAudios ? '¿Quitar de Audios?' : '¿Borrar este audio?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {aBorrar?.deMisAudios
              ? `Vas a quitar «${aBorrar.titulo}» de Audios. Tus oyentes dejarán de verlo aquí y en tus listas. Sigue en Biblioteca.`
              : `Vas a borrar «${aBorrar?.titulo}». Tus oyentes dejarán de verlo y no se puede deshacer.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setABorrar(null)} disabled={borrando}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmarBorrado}
            disabled={borrando}
          >
            {aBorrar?.deMisAudios ? 'Quitar' : 'Borrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {anadiendo && biblioteca && (
        <DialogoElegirAudios
          titulo="Añadir desde Biblioteca"
          explicacion="Se añaden publicados, al final de la lista. Siguen también en Biblioteca: título, descripción, imagen y salud serán los mismos en los dos sitios."
          audios={biblioteca}
          yaLoTiene={yaEnAudios}
          varios
          accion="Añadir"
          onConfirmar={anadir}
          onCerrar={() => setAnadiendo(false)}
          textos={{
            finSinAudios: 'y podrás añadirlo aquí.',
            todosElegidos: 'Ya están en Audios todos los audios de Biblioteca.',
            limite: `Puedes añadir ${LIMITES_BIBLIOTECA.enviosALaVez} audios de una vez.`,
          }}
        />
      )}

      <Snackbar
        open={aviso !== null}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}

export default AudiosGenerales
