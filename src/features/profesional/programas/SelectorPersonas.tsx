import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  etiquetaOyente,
  type OyenteDelProfesional,
} from '../../perfilProfesional/modelo'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

type SelectorPersonasProps = {
  oyentes: OyenteDelProfesional[]
  /** Los que ya lo tienen: no salen. */
  excluir?: ReadonlySet<string>
  elegidos: string[]
  onCambiar: (elegidos: string[]) => void
  /** Cuántas se pueden elegir aún. */
  maximo: number
  deshabilitado?: boolean
}

/**
 * Elegir personas (como en «Enviar…»): arriba, las elegidas como chips (con
 * aspa para quitarlas); debajo, buscador y casillas. Solo salen los oyentes
 * con vínculo activo que aún no lo tienen.
 */
function SelectorPersonas({
  oyentes,
  excluir,
  elegidos,
  onCambiar,
  maximo,
  deshabilitado = false,
}: SelectorPersonasProps) {
  const [busqueda, setBusqueda] = useState('')
  const porUid = useMemo(
    () => new Map(oyentes.map((o) => [o.oyenteUid, o])),
    [oyentes],
  )
  const activos = useMemo(
    () =>
      oyentes
        .filter((o) => o.estado === 'activo' && !excluir?.has(o.oyenteUid))
        .sort((a, b) =>
          etiquetaOyente(a).localeCompare(etiquetaOyente(b), 'es'),
        ),
    [oyentes, excluir],
  )
  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return activos.filter(
      (o) => !q || normalizar(etiquetaOyente(o)).includes(q),
    )
  }, [activos, busqueda])
  const lleno = elegidos.length >= maximo

  const alternar = (oyenteUid: string) =>
    onCambiar(
      elegidos.includes(oyenteUid)
        ? elegidos.filter((u) => u !== oyenteUid)
        : lleno
          ? elegidos
          : [...elegidos, oyenteUid],
    )

  if (activos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {oyentes.some((o) => o.estado === 'activo')
          ? 'Ya lo tienen todos tus oyentes.'
          : 'Todavía no tienes oyentes con vínculo activo.'}
      </Typography>
    )
  }

  return (
    <Box>
      {elegidos.length > 0 && (
        <Box
          sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}
          aria-label="Personas elegidas"
        >
          {elegidos.map((uid) => (
            <Chip
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.main',
                '& .MuiChip-deleteIcon': { color: 'primary.main' },
              }}
              key={uid}
              label={etiquetaOyente(
                porUid.get(uid) ?? { oyenteUid: uid, nombre: '' },
              )}
              onDelete={deshabilitado ? undefined : () => alternar(uid)}
            />
          ))}
        </Box>
      )}
      <TextField
        size="small"
        fullWidth
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
        placeholder="Buscar oyente…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar oyente' },
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
          Has llegado al máximo de personas para este programa.
        </Typography>
      )}
      {visibles.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Nadie coincide con la búsqueda.
        </Typography>
      ) : (
        <List dense sx={{ mt: 1, maxHeight: 280, overflowY: 'auto' }}>
          {visibles.map((o) => {
            const marcado = elegidos.includes(o.oyenteUid)
            const idEtiqueta = `persona-${o.oyenteUid}`
            return (
              <ListItem key={o.oyenteUid} disablePadding divider>
                <ListItemButton
                  onClick={() => alternar(o.oyenteUid)}
                  disabled={(!marcado && lleno) || deshabilitado}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={marcado}
                      tabIndex={-1}
                      disableRipple
                      slotProps={{ input: { 'aria-labelledby': idEtiqueta } }}
                    />
                  </ListItemIcon>
                  <ListItemText id={idEtiqueta} primary={etiquetaOyente(o)} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      )}
    </Box>
  )
}

export default SelectorPersonas
