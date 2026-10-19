import { useMemo, useState } from 'react'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  enviarAudio,
  retirarEnvio,
} from '../../audiosProfesional/audioProfesionalService'
import {
  LIMITES_BIBLIOTECA,
  type AudioProfesional,
  type EnvioAudio,
} from '../../audiosProfesional/modelo'
import {
  etiquetaOyente,
  type OyenteDelProfesional,
} from '../../perfilProfesional/modelo'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type DialogoEnviosProps = {
  audio: AudioProfesional
  /** Todos los envíos del profesional (se filtran los de este audio). */
  envios: EnvioAudio[]
  oyentes: OyenteDelProfesional[]
  onCerrar: () => void
  onAviso: (mensaje: string) => void
}

/**
 * Enviar un audio de «Mis audios»: arriba, a quién se lo has enviado (con
 * «Retirar»: deja de verlo al momento); debajo, tus oyentes con vínculo
 * activo que aún no lo tienen, para marcar una o varias personas (hasta 20
 * de una vez). Lo reciben en «Para ti», en tu página.
 */
function DialogoEnvios({
  audio,
  envios,
  oyentes,
  onCerrar,
  onAviso,
}: DialogoEnviosProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [retirando, setRetirando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const porUid = useMemo(
    () => new Map(oyentes.map((o) => [o.oyenteUid, o])),
    [oyentes],
  )
  const nombre = (oyenteUid: string) =>
    etiquetaOyente(porUid.get(oyenteUid) ?? { oyenteUid, nombre: '' })

  // A quién se lo ha enviado ya (de este audio), por nombre.
  const yaLoTienen = useMemo(() => {
    const etiqueta = (oyenteUid: string) =>
      etiquetaOyente(porUid.get(oyenteUid) ?? { oyenteUid, nombre: '' })
    return envios
      .filter((e) => e.audioId === audio.id)
      .map((e) => e.oyenteUid)
      .sort((a, b) => etiqueta(a).localeCompare(etiqueta(b), 'es'))
  }, [envios, audio.id, porUid])
  const conEl = useMemo(() => new Set(yaLoTienen), [yaLoTienen])

  // A quién se le puede enviar: vínculo activo y aún sin el audio.
  const disponibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return oyentes
      .filter((o) => o.estado === 'activo' && !conEl.has(o.oyenteUid))
      .filter((o) => !q || normalizar(etiquetaOyente(o)).includes(q))
      .sort((a, b) => etiquetaOyente(a).localeCompare(etiquetaOyente(b), 'es'))
  }, [oyentes, conEl, busqueda])
  const hayActivosSinEl = oyentes.some(
    (o) => o.estado === 'activo' && !conEl.has(o.oyenteUid),
  )
  const sinOyentes = !oyentes.some((o) => o.estado === 'activo')

  const lleno = marcados.size >= LIMITES_BIBLIOTECA.enviosALaVez
  const alternar = (oyenteUid: string) =>
    setMarcados((anteriores) => {
      const nuevos = new Set(anteriores)
      if (nuevos.has(oyenteUid)) nuevos.delete(oyenteUid)
      else if (nuevos.size < LIMITES_BIBLIOTECA.enviosALaVez)
        nuevos.add(oyenteUid)
      return nuevos
    })

  const enviar = async () => {
    const elegidos = [...marcados]
    setEnviando(true)
    setError(null)
    try {
      const fallidos = await enviarAudio(audio, elegidos)
      const enviados = elegidos.length - fallidos.length
      setMarcados(new Set(fallidos))
      if (fallidos.length > 0) {
        setError(
          `No se pudo enviar a ${fallidos.map(nombre).join(', ')}. Comprueba que su vínculo sigue activo e inténtalo de nuevo.`,
        )
      }
      if (enviados > 0) {
        onAviso(
          enviados === 1
            ? `Enviado a ${nombre(elegidos.find((u) => !fallidos.includes(u)) as string)}. Ya lo tiene en «Para ti».`
            : `Enviado a ${enviados} personas. Ya lo tienen en «Para ti».`,
        )
      }
    } catch {
      setError('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const retirar = async (oyenteUid: string) => {
    setRetirando(oyenteUid)
    setError(null)
    try {
      await retirarEnvio(audio.id, oyenteUid)
      onAviso(`Se lo has retirado a ${nombre(oyenteUid)}. Ya no lo ve.`)
    } catch {
      setError('No se pudo retirar. Inténtalo de nuevo.')
    } finally {
      setRetirando(null)
    }
  }

  return (
    <Dialog
      open
      onClose={() => !enviando && onCerrar()}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="envios-titulo"
    >
      <DialogTitle id="envios-titulo">Enviar «{audio.titulo}»</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
          Lo tienen ({yaLoTienen.length})
        </Typography>
        {yaLoTienen.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Aún no se lo has enviado a nadie.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ mb: 2.5 }}>
            {yaLoTienen.map((oyenteUid) => {
              const estado = porUid.get(oyenteUid)?.estado
              const enPausa = estado !== 'activo'
              return (
                <ListItem
                  key={oyenteUid}
                  disableGutters
                  secondaryAction={
                    <Button
                      size="small"
                      color="error"
                      onClick={() => void retirar(oyenteUid)}
                      disabled={retirando !== null}
                      aria-label={`Retirar a ${nombre(oyenteUid)}`}
                    >
                      {retirando === oyenteUid ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        'Retirar'
                      )}
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <Box
                        component="span"
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        {nombre(oyenteUid)}
                        {enPausa && (
                          <Chip
                            size="small"
                            color="warning"
                            variant="outlined"
                            label={
                              estado
                                ? 'Vínculo en pausa: no lo ve'
                                : 'Sin vínculo: no lo ve'
                            }
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              )
            })}
          </List>
        )}

        <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
          Enviar a
        </Typography>
        {sinOyentes ? (
          <Typography variant="body2" color="text.secondary">
            Todavía no tienes oyentes. Cuando alguien se una a ti, podrás
            enviarles audios.
          </Typography>
        ) : !hayActivosSinEl ? (
          <Typography variant="body2" color="text.secondary">
            Ya lo tienen todos tus oyentes.
          </Typography>
        ) : (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar persona"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': 'Buscar persona' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {lleno && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Puedes enviarlo a {LIMITES_BIBLIOTECA.enviosALaVez} personas de
                una vez.
              </Typography>
            )}
            {disponibles.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 3, textAlign: 'center' }}
              >
                Nadie coincide con la búsqueda.
              </Typography>
            ) : (
              <List dense sx={{ mt: 1 }}>
                {disponibles.map((o) => {
                  const marcado = marcados.has(o.oyenteUid)
                  const idEtiqueta = `enviar-${o.oyenteUid}`
                  return (
                    <ListItem key={o.oyenteUid} disablePadding>
                      <ListItemButton
                        onClick={() => alternar(o.oyenteUid)}
                        disabled={(!marcado && lleno) || enviando}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Checkbox
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
                          primary={etiquetaOyente(o)}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )}
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cerrar
        </Button>
        <Button
          variant="contained"
          onClick={() => void enviar()}
          disabled={marcados.size === 0 || enviando}
          startIcon={
            enviando ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {marcados.size > 0 ? `Enviar (${marcados.size})` : 'Enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogoEnvios
