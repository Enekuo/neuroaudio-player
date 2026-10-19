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
import LibraryMusicOutlined from '@mui/icons-material/LibraryMusicOutlined'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import SendOutlined from '@mui/icons-material/SendOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import {
  borrarAudio,
  escucharMiBiblioteca,
  escucharMisEnvios,
} from '../../audiosProfesional/audioProfesionalService'
import {
  LIMITES_BIBLIOTECA,
  type AudioProfesional,
  type EnvioAudio,
} from '../../audiosProfesional/modelo'
import PortadaAudio from '../../audiosProfesional/PortadaAudio'
import { formatTime } from '../../library/utils/formatTime'
import type { OyenteDelProfesional } from '../../perfilProfesional/modelo'
import {
  escucharMisOyentes,
  escucharPerfil,
} from '../../perfilProfesional/perfilService'
import DialogoAudio from '../audios/DialogoAudio'
import { animacionEntrada } from '../theme/movimiento'
import DialogoEnvios from './DialogoEnvios'

type Orden = 'recientes' | 'antiguos' | 'titulo'

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const personas = (n: number) => (n === 1 ? '1 persona' : `${n} personas`)

type Edicion = { audio?: AudioProfesional } | null

/**
 * «Mis audios» (/profesional/mis-audios): la biblioteca privada del
 * profesional. Sube un audio una vez, lo etiqueta y lo guarda; nadie lo ve
 * hasta que lo envía a una o varias personas (que lo reciben en «Para
 * ti»). Buscador, filtro por etiqueta y orden; editar y borrar.
 */
function MisAudiosPage() {
  const { user } = useAuth()
  if (!user) {
    return (
      <Alert severity="warning">Inicia sesión para gestionar tus audios.</Alert>
    )
  }
  return <Biblioteca uid={user.uid} />
}

function Biblioteca({ uid }: { uid: string }) {
  const [intento, setIntento] = useState(0)
  const [audios, setAudios] = useState<AudioProfesional[] | null>(null)
  const [envios, setEnvios] = useState<EnvioAudio[] | null>(null)
  const [error, setError] = useState(false)
  const [fotoPrincipalId, setFotoPrincipalId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [etiqueta, setEtiqueta] = useState('todas')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [edicion, setEdicion] = useState<Edicion>(null)
  const [aBorrar, setABorrar] = useState<AudioProfesional | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [menu, setMenu] = useState<{
    ancla: HTMLElement
    audio: AudioProfesional
  } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [oyentes, setOyentes] = useState<OyenteDelProfesional[]>([])
  // Audio cuyo diálogo «Enviar» está abierto (por id: se refresca en vivo).
  const [enviandoId, setEnviandoId] = useState<string | null>(null)

  useEffect(() => {
    setError(false)
    return escucharMiBiblioteca(uid, setAudios, () => setError(true))
  }, [uid, intento])

  useEffect(
    () => escucharMisEnvios(uid, setEnvios, () => setError(true)),
    [uid, intento],
  )

  // Sus oyentes (para enviar y para nombrar a quién se ha enviado).
  useEffect(
    () => escucharMisOyentes(uid, setOyentes, () => setOyentes([])),
    [uid],
  )

  // Para la portada «Foto del profesional».
  useEffect(
    () =>
      escucharPerfil(uid, (perfil) =>
        setFotoPrincipalId(perfil?.fotoPrincipalId ?? null),
      ),
    [uid],
  )

  // A cuántas personas se ha enviado cada audio.
  const enviadoA = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const e of envios ?? [])
      cuenta.set(e.audioId, (cuenta.get(e.audioId) ?? 0) + 1)
    return cuenta
  }, [envios])

  // Etiquetas que ya usa (para el filtro y para sugerirlas al escribir).
  const etiquetas = useMemo(
    () =>
      [...new Set((audios ?? []).flatMap((a) => a.etiquetas))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [audios],
  )

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    const filtrados = (audios ?? []).filter(
      (a) =>
        (etiqueta === 'todas' || a.etiquetas.includes(etiqueta)) &&
        (!q ||
          normalizar(a.titulo).includes(q) ||
          a.etiquetas.some((e) => normalizar(e).includes(q))),
    )
    const fecha = (a: AudioProfesional) => a.creadoEn?.getTime() ?? 0
    return filtrados.sort((a, b) =>
      orden === 'titulo'
        ? a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' })
        : orden === 'antiguos'
          ? fecha(a) - fecha(b)
          : fecha(b) - fecha(a),
    )
  }, [audios, busqueda, etiqueta, orden])

  const lleno = (audios?.length ?? 0) >= LIMITES_BIBLIOTECA.audios

  const confirmarBorrado = async () => {
    if (!aBorrar) return
    setBorrando(true)
    try {
      await borrarAudio(aBorrar)
      setAviso(`«${aBorrar.titulo}» borrado.`)
      setABorrar(null)
    } catch {
      setAviso('No se pudo borrar el audio. Inténtalo de nuevo.')
    } finally {
      setBorrando(false)
    }
  }

  const cabecera = (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        id="mis-audios-titulo"
        variant="h5"
        component="h1"
        sx={{ fontWeight: 400 }}
      >
        Mis audios
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        Tu biblioteca privada: sube un audio una vez y envíalo a las personas
        que lo necesiten. Nadie lo ve hasta que se lo envías.
      </Typography>
    </Box>
  )

  const botonSubir = (texto: string) => (
    <Tooltip
      title={
        lleno
          ? `Tu biblioteca está llena (${LIMITES_BIBLIOTECA.audios} audios). Borra alguno para subir otro.`
          : ''
      }
    >
      <span>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setEdicion({})}
          disabled={lleno}
        >
          {texto}
        </Button>
      </span>
    </Tooltip>
  )

  let contenido
  if (error) {
    contenido = (
      <Alert
        severity="error"
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
        No se pudieron cargar tus audios. Revisa tu conexión.
      </Alert>
    )
  } else if (!audios || !envios) {
    contenido = (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando tus audios" />
      </Box>
    )
  } else if (audios.length === 0) {
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
          <LibraryMusicOutlined />
        </Box>
        <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
          Tu biblioteca está vacía
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 3, maxWidth: 460, mx: 'auto' }}
        >
          Sube aquí los audios que usas con varias personas. Después podrás
          enviárselos a quien los necesite sin volver a subirlos.
        </Typography>
        {botonSubir('Subir tu primer audio')}
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
            placeholder="Buscar por título o etiqueta"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ flex: '1 1 220px', maxWidth: 360 }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar por título o etiqueta' },
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
            label="Etiqueta"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="todas">Todas</MenuItem>
            {etiquetas.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Orden"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="recientes">Más recientes</MenuItem>
            <MenuItem value="antiguos">Más antiguos</MenuItem>
            <MenuItem value="titulo">Título (A-Z)</MenuItem>
          </TextField>
          <Box sx={{ flex: 1 }} />
          {botonSubir('Subir audio')}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {audios.length} de {LIMITES_BIBLIOTECA.audios} audios
        </Typography>

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
              const n = enviadoA.get(audio.id) ?? 0
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
                    biblioteca
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
                          n > 0 ? `Enviado a ${personas(n)}` : 'Sin enviar'
                        }
                        color={n > 0 ? 'primary' : 'default'}
                        variant="outlined"
                        onClick={() => setEnviandoId(audio.id)}
                        aria-label={`${n > 0 ? `Enviado a ${personas(n)}` : 'Sin enviar'}: ver y enviar «${audio.titulo}»`}
                      />
                      {audio.etiquetas.map((e) => (
                        <Chip key={e} size="small" label={e} />
                      ))}
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
  const audioEnviando = audios?.find((a) => a.id === enviandoId) ?? null
  const enviosABorrar = aBorrar ? (enviadoA.get(aBorrar.id) ?? 0) : 0

  return (
    <Box component="section" aria-labelledby="mis-audios-titulo">
      {cabecera}
      {contenido}

      <Menu
        anchorEl={menu?.ancla}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
      >
        <MenuItem
          onClick={() => {
            setEnviandoId(audioMenu?.id ?? null)
            setMenu(null)
          }}
        >
          <ListItemIcon>
            <SendOutlined fontSize="small" />
          </ListItemIcon>
          Enviar…
        </MenuItem>
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
            setABorrar(audioMenu ?? null)
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
          ordenNuevo={0}
          fotoPrincipalId={fotoPrincipalId}
          biblioteca={{ sugerencias: etiquetas }}
          onCerrar={(mensaje) => {
            setEdicion(null)
            if (mensaje) setAviso(mensaje)
          }}
        />
      )}

      {audioEnviando && (
        <DialogoEnvios
          audio={audioEnviando}
          envios={envios ?? []}
          oyentes={oyentes}
          onCerrar={() => setEnviandoId(null)}
          onAviso={setAviso}
        />
      )}

      <Dialog
        open={Boolean(aBorrar)}
        onClose={() => !borrando && setABorrar(null)}
        aria-labelledby="borrar-mis-audios-titulo"
      >
        <DialogTitle id="borrar-mis-audios-titulo">
          ¿Borrar este audio?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {enviosABorrar > 0
              ? `Vas a borrar «${aBorrar?.titulo}». Se lo quitarás a ${personas(enviosABorrar)} que lo tienen en «Para ti». No se puede deshacer.`
              : `Vas a borrar «${aBorrar?.titulo}» de tu biblioteca. No se puede deshacer.`}
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
            Borrar
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

export default MisAudiosPage
