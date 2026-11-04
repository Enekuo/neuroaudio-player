import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
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
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import PublishRounded from '@mui/icons-material/PublishRounded'
import UnpublishedOutlined from '@mui/icons-material/UnpublishedOutlined'
import { formatTime } from '../../library/utils/formatTime'
import { etiquetaOyente } from '../../perfilProfesional/modelo'
import {
  LIMITES_PROGRAMA,
  textoRitmo,
  type AccesoPrograma,
  type ProgramaProfesional,
} from '../../programasProfesional/modelo'
import {
  borrarPrograma,
  cambiarEstadoPrograma,
  darPrograma,
  quitarPrograma,
} from '../../programasProfesional/programaService'
import { animacionEntrada } from '../theme/movimiento'
import ChipPara from './ChipPara'
import DialogoPrograma from './DialogoPrograma'
import SelectorPersonas from './SelectorPersonas'
import { useDatosProgramas, type DatosProgramas } from './useDatosProgramas'

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const APERTURA = {
  libre: 'Libre: todos los pasos abiertos desde el principio.',
  orden: 'En orden: el siguiente paso se abre al completar el anterior.',
  calendario:
    'Por calendario: se abre un paso según el ritmo, desde el día en que cada persona lo recibe.',
} as const

const personasTexto = (n: number) => (n === 1 ? '1 persona' : `${n} personas`)

type Confirmacion = 'borrador' | 'borrar' | { quitar: AccesoPrograma } | null

/**
 * Un programa (/profesional/listas/programas/:programaId): sus datos y
 * pasos (editables, salvo para quién es), publicar o pasar a borrador,
 * borrar y, en uno privado, sus personas («+ Añadir persona» y quitar).
 * El progreso de cada persona no se muestra (llegará con Estadísticas).
 */
function PaginaPrograma({ uid }: { uid: string }) {
  const datos = useDatosProgramas(uid)
  const { programaId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [aviso, setAviso] = useState<string | null>(
    (location.state as { aviso?: string } | null)?.aviso ?? null,
  )
  const [editando, setEditando] = useState(false)
  const [anadiendo, setAnadiendo] = useState(false)
  const [confirmar, setConfirmar] = useState<Confirmacion>(null)
  const [ocupado, setOcupado] = useState(false)

  const programa = datos.programas?.find((p) => p.id === programaId)
  const accesos = datos.accesosPorPrograma.get(programaId) ?? []
  const volver = () => navigate('/profesional/listas/programas')

  if (datos.error) {
    return (
      <Alert severity="error">
        No se pudo cargar el programa. Revisa tu conexión y vuelve a entrar.
      </Alert>
    )
  }
  if (!datos.programas || !datos.biblioteca || !datos.oyentes) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando programa" />
      </Box>
    )
  }
  if (!programa) {
    return (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={volver}>
            Volver
          </Button>
        }
      >
        Este programa ya no existe.
      </Alert>
    )
  }

  const publicado = programa.estado === 'publicado'
  const quienes =
    programa.para === 'todos' ? 'Tus oyentes' : personasTexto(accesos.length)

  const ejecutar = async (accion: () => Promise<void>, error: string) => {
    setOcupado(true)
    try {
      await accion()
    } catch {
      setAviso(error)
    } finally {
      setOcupado(false)
      setConfirmar(null)
    }
  }

  const publicar = () =>
    ejecutar(async () => {
      await cambiarEstadoPrograma(programa, 'publicado')
      setAviso(
        programa.para === 'todos'
          ? 'Programa publicado. Ya lo ven tus oyentes con vínculo activo.'
          : accesos.length === 0
            ? 'Programa publicado. Añade personas para que lo vean.'
            : `Programa publicado. Ya lo ${accesos.length === 1 ? 've 1 persona' : `ven ${accesos.length} personas`}.`,
      )
    }, 'No se pudo publicar. Inténtalo de nuevo.')

  const aBorrador = () =>
    ejecutar(async () => {
      await cambiarEstadoPrograma(programa, 'borrador')
      setAviso('Programa en borrador. Nadie lo ve hasta que lo publiques.')
    }, 'No se pudo pasar a borrador. Inténtalo de nuevo.')

  const borrar = () =>
    ejecutar(async () => {
      await borrarPrograma(programa.id, accesos)
      navigate('/profesional/listas/programas', {
        state: { aviso: `«${programa.titulo}» borrado.` },
      })
    }, 'No se pudo borrar el programa. Inténtalo de nuevo.')

  const quitar = (acceso: AccesoPrograma) =>
    ejecutar(async () => {
      await quitarPrograma(programa.id, acceso.oyenteUid)
      setAviso(`Se lo has quitado a ${nombre(acceso.oyenteUid)}. Ya no lo ve.`)
    }, 'No se pudo quitar. Inténtalo de nuevo.')

  const porUid = new Map(datos.oyentes.map((o) => [o.oyenteUid, o]))
  const nombre = (oyenteUid: string) =>
    etiquetaOyente(porUid.get(oyenteUid) ?? { oyenteUid, nombre: '' })
  const porId = new Map(datos.biblioteca.map((a) => [a.id, a]))

  return (
    <Box component="section" aria-labelledby="programa-nombre">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Tooltip title="Volver a tus programas">
          <IconButton aria-label="Volver a tus programas" onClick={volver}>
            <ArrowBackRounded />
          </IconButton>
        </Tooltip>
        <Typography
          id="programa-nombre"
          variant="h5"
          component="h1"
          sx={{ fontWeight: 400, minWidth: 0 }}
          noWrap
        >
          {programa.titulo}
        </Typography>
      </Box>

      <Box
        sx={[
          { display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 },
          animacionEntrada({ retardo: 40 }),
        ]}
      >
        <Chip
          size="small"
          label={publicado ? 'Publicado' : 'Borrador'}
          color={publicado ? 'success' : 'default'}
          variant={publicado ? 'filled' : 'outlined'}
        />
        <ChipPara para={programa.para} personas={accesos.length} />
        <Chip
          size="small"
          variant="outlined"
          label={textoRitmo(programa.ritmo, programa.ritmoDias)}
        />
      </Box>

      {programa.descripcion && (
        <Typography sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>
          {programa.descripcion}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {APERTURA[programa.apertura]}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<EditOutlined />}
          onClick={() => setEditando(true)}
          disabled={ocupado}
        >
          Editar
        </Button>
        {publicado ? (
          <Button
            variant="outlined"
            startIcon={<UnpublishedOutlined />}
            onClick={() => setConfirmar('borrador')}
            disabled={ocupado}
          >
            Pasar a borrador
          </Button>
        ) : (
          <Tooltip
            title={
              programa.pasos.length === 0
                ? 'Añade al menos un audio para publicarlo.'
                : ''
            }
          >
            <span>
              <Button
                variant="contained"
                startIcon={<PublishRounded />}
                onClick={() => void publicar()}
                disabled={ocupado || programa.pasos.length === 0}
              >
                Publicar
              </Button>
            </span>
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          color="error"
          startIcon={<DeleteOutlineRounded />}
          onClick={() => setConfirmar('borrar')}
          disabled={ocupado}
        >
          Borrar
        </Button>
      </Box>

      <Typography variant="subtitle1" component="h2" sx={{ mb: 1 }}>
        Pasos ({programa.pasos.length})
      </Typography>
      {programa.pasos.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 4, px: 2, textAlign: 'center', mb: 3 }}
        >
          <Typography color="text.secondary">
            Aún no tiene audios. Añádelos con «Editar».
          </Typography>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          component="ol"
          aria-label="Pasos del programa, en orden"
          sx={{ listStyle: 'none', m: 0, mb: 3, p: 0, overflow: 'hidden' }}
        >
          {programa.pasos.map((id, indice) => {
            const audio = porId.get(id)
            return (
              <Box
                component="li"
                key={id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  borderTop: indice === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 20, fontVariantNumeric: 'tabular-nums' }}
                >
                  {indice + 1}
                </Typography>
                <Typography
                  sx={{ fontWeight: 500 }}
                  color={audio ? 'text.primary' : 'text.secondary'}
                  noWrap
                >
                  {audio?.titulo ?? 'Audio borrado de Biblioteca'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {audio ? formatTime(audio.duracionSegundos) : ''}
                </Typography>
              </Box>
            )
          })}
        </Paper>
      )}

      {/* Quién lo tiene: «Dentro de «…»». */}
      <Paper variant="outlined" sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{ fontWeight: 400, fontSize: 18, mb: 1 }}
        >
          Dentro de «{programa.titulo}»
        </Typography>
        {programa.para === 'todos' ? (
          <Typography variant="body2" color="text.secondary">
            Lo ven todos tus oyentes con vínculo activo (
            {personasTexto(
              datos.oyentes.filter((o) => o.estado === 'activo').length,
            )}{' '}
            ahora), también los que lleguen después, cada uno desde el paso 1.
          </Typography>
        ) : (
          <PersonasDelPrograma
            accesos={accesos}
            nombre={nombre}
            enPausa={(u) => porUid.get(u)?.estado !== 'activo'}
            ocupado={ocupado}
            onAnadir={() => setAnadiendo(true)}
            onQuitar={(acceso) => setConfirmar({ quitar: acceso })}
            lleno={accesos.length >= LIMITES_PROGRAMA.personas}
          />
        )}
      </Paper>

      {editando && (
        <DialogoPrograma
          datos={datos}
          programa={programa}
          onCerrar={(resultado) => {
            setEditando(false)
            if (resultado) setAviso(resultado.mensaje)
          }}
        />
      )}

      {anadiendo && (
        <DialogoAnadirPersonas
          datos={datos}
          programa={programa}
          accesos={accesos}
          nombre={nombre}
          onCerrar={(mensaje) => {
            setAnadiendo(false)
            if (mensaje) setAviso(mensaje)
          }}
        />
      )}

      <Dialog
        open={confirmar !== null}
        onClose={() => !ocupado && setConfirmar(null)}
        aria-labelledby="confirmar-programa-titulo"
      >
        <DialogTitle id="confirmar-programa-titulo">
          {confirmar === 'borrar'
            ? '¿Borrar este programa?'
            : confirmar === 'borrador'
              ? '¿Pasar a borrador?'
              : '¿Quitar a esta persona?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmar === 'borrar'
              ? `Vas a borrar «${programa.titulo}». ${programa.para === 'todos' ? 'Tus oyentes lo perderán' : accesos.length === 0 ? 'Nadie lo tiene todavía' : `${quienes} lo perderán`}. No se puede deshacer.`
              : confirmar === 'borrador'
                ? `${quienes} ${programa.para === 'personas' && accesos.length === 1 ? 'dejará' : 'dejarán'} de verlo hasta que lo vuelvas a publicar. Su progreso se conserva.`
                : confirmar && typeof confirmar === 'object'
                  ? `${nombre(confirmar.quitar.oyenteUid)} dejará de ver «${programa.titulo}». Si se lo vuelves a dar, conserva lo que ya completó.`
                  : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(null)} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            color={confirmar === 'borrador' ? 'primary' : 'error'}
            variant="contained"
            disabled={ocupado}
            onClick={() => {
              if (confirmar === 'borrar') void borrar()
              else if (confirmar === 'borrador') void aBorrador()
              else if (confirmar) void quitar(confirmar.quitar)
            }}
          >
            {confirmar === 'borrar'
              ? 'Borrar'
              : confirmar === 'borrador'
                ? 'Pasar a borrador'
                : 'Quitar'}
          </Button>
        </DialogActions>
      </Dialog>

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

function PersonasDelPrograma({
  accesos,
  nombre,
  enPausa,
  ocupado,
  lleno,
  onAnadir,
  onQuitar,
}: {
  accesos: AccesoPrograma[]
  nombre: (oyenteUid: string) => string
  enPausa: (oyenteUid: string) => boolean
  ocupado: boolean
  lleno: boolean
  onAnadir: () => void
  onQuitar: (acceso: AccesoPrograma) => void
}) {
  const ordenados = [...accesos].sort((a, b) =>
    nombre(a.oyenteUid).localeCompare(nombre(b.oyenteUid), 'es'),
  )
  return (
    <>
      {ordenados.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          Aún no se lo has dado a nadie.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {ordenados.map((a) => (
            <Box
              component="li"
              key={a.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  minWidth: 0,
                  flex: 1,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Typography>{nombre(a.oyenteUid)}</Typography>
                {enPausa(a.oyenteUid) && (
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label="Vínculo en pausa: no lo ve"
                  />
                )}
              </Box>
              {a.creadoEn && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}
                >
                  Desde el {formatoFecha.format(a.creadoEn)}
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={() => onQuitar(a)}
                disabled={ocupado}
                aria-label={`Quitar a ${nombre(a.oyenteUid)}`}
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Tooltip
          title={
            lleno
              ? `Un programa puede tener ${LIMITES_PROGRAMA.personas} personas como mucho.`
              : ''
          }
        >
          <span>
            <Button
              startIcon={<AddRounded />}
              onClick={onAnadir}
              disabled={ocupado || lleno}
              sx={{ ml: -1 }}
            >
              Añadir persona
            </Button>
          </span>
        </Tooltip>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        Si entra alguien nuevo, lo añades aquí: no hace falta crear otro
        programa.
      </Typography>
    </>
  )
}

function DialogoAnadirPersonas({
  datos,
  programa,
  accesos,
  nombre,
  onCerrar,
}: {
  datos: DatosProgramas
  programa: ProgramaProfesional
  accesos: AccesoPrograma[]
  nombre: (oyenteUid: string) => string
  onCerrar: (mensaje?: string) => void
}) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const [elegidos, setElegidos] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ya = useMemo(() => new Set(accesos.map((a) => a.oyenteUid)), [accesos])

  const dar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const fallidos = await darPrograma(programa, elegidos)
      if (fallidos.length > 0) {
        setElegidos(fallidos)
        setError(
          `No se pudo dar a ${fallidos.map(nombre).join(', ')}. Comprueba que su vínculo sigue activo e inténtalo de nuevo.`,
        )
        setGuardando(false)
        return
      }
      const n = elegidos.length
      onCerrar(
        programa.estado === 'publicado'
          ? n === 1
            ? `${nombre(elegidos[0])} ya tiene el programa.`
            : `${n} personas ya tienen el programa.`
          : `${n === 1 ? 'Añadida 1 persona' : `Añadidas ${n} personas`}. Lo verán cuando lo publiques.`,
      )
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open
      onClose={() => !guardando && onCerrar()}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="anadir-personas-titulo"
    >
      <DialogTitle id="anadir-personas-titulo">
        Añadir personas a «{programa.titulo}»
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cada persona empieza desde el paso 1 el día que se lo das.
        </Typography>
        {datos.oyentes && (
          <SelectorPersonas
            oyentes={datos.oyentes}
            excluir={ya}
            elegidos={elegidos}
            onCambiar={setElegidos}
            maximo={LIMITES_PROGRAMA.personas - accesos.length}
            deshabilitado={guardando}
          />
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => onCerrar()} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => void dar()}
          disabled={elegidos.length === 0 || guardando}
          startIcon={
            guardando ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {elegidos.length > 0 ? `Añadir (${elegidos.length})` : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaginaPrograma
