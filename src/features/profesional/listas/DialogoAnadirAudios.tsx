import { useMemo, useState } from 'react'
import { Link as EnlaceRouter } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@mui/material/Link'
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
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { formatTime } from '../../library/utils/formatTime'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type DialogoAnadirAudiosProps = {
  /** Todos los audios generales del profesional, en su orden. */
  audios: AudioProfesional[]
  /** Los que ya están en la lista. */
  enLista: string[]
  /** Cuántos caben aún. */
  hueco: number
  onCerrar: () => void
  /** Los marcados, en el orden de su biblioteca. */
  onAnadir: (ids: string[]) => void
}

/**
 * «Añadir audios»: los audios del profesional (con buscador) para marcarlos.
 * Los que ya están en la lista salen marcados y no se pueden volver a añadir.
 */
function DialogoAnadirAudios({
  audios,
  enLista,
  hueco,
  onCerrar,
  onAnadir,
}: DialogoAnadirAudiosProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const [busqueda, setBusqueda] = useState('')
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const ya = useMemo(() => new Set(enLista), [enLista])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return audios.filter((a) => !q || normalizar(a.titulo).includes(q))
  }, [audios, busqueda])

  const lleno = marcados.size >= hueco
  const alternar = (id: string) =>
    setMarcados((anteriores) => {
      const nuevos = new Set(anteriores)
      if (nuevos.has(id)) nuevos.delete(id)
      else if (nuevos.size < hueco) nuevos.add(id)
      return nuevos
    })

  return (
    <Dialog
      open
      onClose={onCerrar}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="anadir-audios-titulo"
    >
      <DialogTitle id="anadir-audios-titulo">Añadir audios</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {audios.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aún no has subido audios.
            </Typography>
            <Link
              component={EnlaceRouter}
              to="/profesional/audios"
              sx={{ display: 'inline-block', mt: 1 }}
            >
              Ir a Audios
            </Link>
          </Box>
        ) : (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por título"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
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
            {lleno && hueco > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5 }}
              >
                Una lista puede tener 100 audios como mucho.
              </Typography>
            )}
            {visibles.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 4, textAlign: 'center' }}
              >
                Ningún audio coincide con la búsqueda.
              </Typography>
            ) : (
              <List dense sx={{ mt: 1 }}>
                {visibles.map((audio) => {
                  const dentro = ya.has(audio.id)
                  const marcado = dentro || marcados.has(audio.id)
                  const idEtiqueta = `anadir-${audio.id}`
                  return (
                    <ListItem key={audio.id} disablePadding>
                      <ListItemButton
                        onClick={() => alternar(audio.id)}
                        disabled={dentro || (!marcado && lleno)}
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
                          primary={audio.titulo}
                          secondary={
                            dentro
                              ? 'Ya está en la lista'
                              : formatTime(audio.duracionSegundos)
                          }
                          slotProps={{ primary: { noWrap: true } }}
                        />
                        {audio.estado === 'borrador' && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label="Borrador"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={marcados.size === 0}
          onClick={() =>
            onAnadir(audios.filter((a) => marcados.has(a.id)).map((a) => a.id))
          }
        >
          {marcados.size > 0 ? `Añadir (${marcados.size})` : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogoAnadirAudios
