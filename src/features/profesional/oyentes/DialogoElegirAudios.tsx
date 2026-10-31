import { useMemo, useState } from 'react'
import { Link as EnlaceRouter } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  LIMITES_BIBLIOTECA,
  type AudioProfesional,
} from '../../audiosProfesional/modelo'
import { formatTime } from '../../library/utils/formatTime'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type DialogoElegirAudiosProps = {
  titulo: string
  /** Texto bajo el título (p. ej. qué audio se va a cambiar). */
  explicacion?: string
  /** Todos los audios de «Mis audios». */
  audios: AudioProfesional[]
  /** Los que ya tiene la persona: no salen. */
  yaLoTiene: Set<string>
  /** Varios (hasta 20, con casillas) o uno solo. */
  varios: boolean
  /** Texto del botón; en «varios» se le añade (n). */
  accion: string
  /** Devuelve un error para mostrar o null si ha ido bien (y se cierra). */
  onConfirmar: (audioIds: string[]) => Promise<string | null>
  onCerrar: () => void
  /** Textos propios (por defecto, los de enviar a una persona). */
  textos?: {
    /** Tras «Aún no tienes audios en Biblioteca. Sube el primero». */
    finSinAudios?: string
    /** Cuando ya no queda ninguno por elegir. */
    todosElegidos?: string
    /** Cuando se llega al máximo de una vez. */
    limite?: string
  }
}

/**
 * Elegir audios de «Mis audios» para una persona, con buscador (título o
 * etiqueta) y filtro por etiqueta. No salen los que ya tiene.
 */
function DialogoElegirAudios({
  titulo,
  explicacion,
  audios,
  yaLoTiene,
  varios,
  accion,
  onConfirmar,
  onCerrar,
  textos = {},
}: DialogoElegirAudiosProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const [elegidos, setElegidos] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [etiqueta, setEtiqueta] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const candidatos = useMemo(
    () => audios.filter((a) => !yaLoTiene.has(a.id)),
    [audios, yaLoTiene],
  )
  const etiquetas = useMemo(
    () =>
      [...new Set(candidatos.flatMap((a) => a.etiquetas))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [candidatos],
  )
  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return candidatos
      .filter(
        (a) =>
          (!etiqueta || a.etiquetas.includes(etiqueta)) &&
          (!q ||
            normalizar(a.titulo).includes(q) ||
            a.etiquetas.some((e) => normalizar(e).includes(q))),
      )
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
  }, [candidatos, busqueda, etiqueta])

  // Solo cuentan los que aún no tiene (tras un envío a medias, los que sí
  // llegaron dejan de estar en la lista y no se vuelven a enviar).
  const vigentes = elegidos.filter((id) => candidatos.some((a) => a.id === id))
  const lleno = varios && vigentes.length >= LIMITES_BIBLIOTECA.enviosALaVez
  const alternar = (id: string) =>
    setElegidos((antes) =>
      !varios
        ? [id]
        : antes.includes(id)
          ? antes.filter((x) => x !== id)
          : !lleno
            ? [...antes, id]
            : antes,
    )

  const confirmar = async () => {
    setEnviando(true)
    setError(null)
    const fallo = await onConfirmar(vigentes)
    setEnviando(false)
    if (fallo) setError(fallo)
    else onCerrar()
  }

  let lista
  if (audios.length === 0) {
    lista = (
      <Typography variant="body2" color="text.secondary">
        Aún no tienes audios en Biblioteca.{' '}
        <EnlaceRouter to="/profesional/mis-audios">
          Sube el primero
        </EnlaceRouter>{' '}
        {textos.finSinAudios ?? 'y podrás enviárselo.'}
      </Typography>
    )
  } else if (candidatos.length === 0) {
    lista = (
      <Typography variant="body2" color="text.secondary">
        {textos.todosElegidos ?? 'Ya tiene todos los audios de Biblioteca.'}
      </Typography>
    )
  } else {
    lista = (
      <>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por título o etiqueta"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
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
        {etiquetas.length > 0 && (
          <Box
            sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}
            role="group"
            aria-label="Filtrar por etiqueta"
          >
            {etiquetas.map((e) => (
              <Chip
                key={e}
                size="small"
                label={e}
                color={etiqueta === e ? 'primary' : 'default'}
                variant={etiqueta === e ? 'filled' : 'outlined'}
                onClick={() => setEtiqueta(etiqueta === e ? null : e)}
                aria-pressed={etiqueta === e}
              />
            ))}
          </Box>
        )}
        {lleno && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {textos.limite ??
              `Puedes enviar ${LIMITES_BIBLIOTECA.enviosALaVez} audios de una vez.`}
          </Typography>
        )}
        {visibles.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 3, textAlign: 'center' }}
          >
            Ningún audio coincide con la búsqueda.
          </Typography>
        ) : (
          <List dense sx={{ mt: 1 }}>
            {visibles.map((a) => {
              const marcado = elegidos.includes(a.id)
              const idEtiqueta = `elegir-${a.id}`
              const Control = varios ? Checkbox : Radio
              return (
                <ListItem key={a.id} disablePadding>
                  <ListItemButton
                    onClick={() => alternar(a.id)}
                    disabled={(!marcado && lleno) || enviando}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Control
                        edge="start"
                        checked={marcado}
                        tabIndex={-1}
                        disableRipple
                        slotProps={{
                          input: { 'aria-labelledby': idEtiqueta },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={idEtiqueta}
                      primary={a.titulo}
                      secondary={[
                        formatTime(a.duracionSegundos),
                        ...a.etiquetas,
                      ].join(' · ')}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        )}
      </>
    )
  }

  return (
    <Dialog
      open
      onClose={() => !enviando && onCerrar()}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="elegir-audios-titulo"
    >
      <DialogTitle id="elegir-audios-titulo">{titulo}</DialogTitle>
      <DialogContent dividers>
        {explicacion && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {explicacion}
          </Typography>
        )}
        {lista}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => void confirmar()}
          disabled={vigentes.length === 0 || enviando}
          startIcon={
            enviando ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {varios && vigentes.length > 0
            ? `${accion} (${vigentes.length})`
            : accion}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogoElegirAudios
