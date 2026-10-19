import { useMemo, useState } from 'react'
import { Link as EnlaceRouter, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import QueueMusicOutlined from '@mui/icons-material/QueueMusicOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { nombreLista } from '../../listasProfesional/modelo'
import PortadaLista from '../../listasProfesional/vista/PortadaLista'
import { animacionEntrada } from '../theme/movimiento'
import DialogoNuevaLista from './DialogoNuevaLista'
import type { DatosListas } from './ListasPage'

type Filtro = 'todas' | 'publicado' | 'borrador'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const textoAudios = (n: number) => (n === 1 ? '1 audio' : `${n} audios`)

/**
 * Pestaña «Listas»: tarjetas con la imagen, el nombre, el número de audios
 * y el estado; buscador y filtro por estado; «Nueva lista».
 */
function ListasDelProfesional({ datos }: { datos: DatosListas }) {
  const { listas, audios, error } = datos
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [nueva, setNueva] = useState(false)

  // Solo cuentan los audios que siguen existiendo.
  const existentes = useMemo(
    () => new Set((audios ?? []).map((a) => a.id)),
    [audios],
  )

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return (listas ?? []).filter(
      (l) =>
        (filtro === 'todas' || l.estado === filtro) &&
        (!q || normalizar(nombreLista(l)).includes(q)),
    )
  }, [listas, busqueda, filtro])

  if (error) {
    return (
      <Alert severity="error">
        No se pudieron cargar tus listas. Revisa tu conexión y vuelve a entrar.
      </Alert>
    )
  }
  if (!listas || !audios) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando listas" />
      </Box>
    )
  }

  const dialogo = nueva && (
    <DialogoNuevaLista
      uid={datos.uid}
      listas={listas}
      onCerrar={() => setNueva(false)}
      onElegir={(destino) => {
        setNueva(false)
        navigate(destino)
      }}
    />
  )

  if (listas.length === 0) {
    return (
      <>
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
            <QueueMusicOutlined />
          </Box>
          <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
            Aún no has creado listas
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 3, maxWidth: 440, mx: 'auto' }}
          >
            Una lista agrupa tus audios en un recorrido. Empieza desde una de
            las listas de NeuroAudio o crea la tuya.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => setNueva(true)}
          >
            Crear tu primera lista
          </Button>
        </Paper>
        {dialogo}
      </>
    )
  }

  return (
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
          placeholder="Buscar por nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ flex: '1 1 220px', maxWidth: 360 }}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar por nombre' },
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
          <MenuItem value="todas">Todas</MenuItem>
          <MenuItem value="publicado">Publicadas</MenuItem>
          <MenuItem value="borrador">Borradores</MenuItem>
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setNueva(true)}
        >
          Nueva lista
        </Button>
      </Box>

      {visibles.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 5, px: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Ninguna lista coincide con la búsqueda.
          </Typography>
        </Paper>
      ) : (
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 2,
          }}
        >
          {visibles.map((lista, indice) => {
            const cuantos = lista.audios.filter((id) =>
              existentes.has(id),
            ).length
            const publicada = lista.estado === 'publicado'
            return (
              <Box
                component="li"
                key={lista.id}
                sx={animacionEntrada({
                  retardo: 40 + Math.min(indice, 8) * 30,
                })}
              >
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardActionArea
                    component={EnlaceRouter}
                    to={`/profesional/listas/${lista.id}`}
                    sx={{ height: '100%', alignItems: 'stretch' }}
                  >
                    <PortadaLista
                      lista={lista}
                      style={{ width: '100%', aspectRatio: '1' }}
                    />
                    <Box sx={{ p: 1.75 }}>
                      <Typography sx={{ fontWeight: 500 }} noWrap>
                        {nombreLista(lista)}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          mt: 0.75,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {textoAudios(cuantos)}
                        </Typography>
                        <Chip
                          size="small"
                          label={publicada ? 'Publicada' : 'Borrador'}
                          color={publicada ? 'success' : 'default'}
                          variant={publicada ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              </Box>
            )
          })}
        </Box>
      )}
      {dialogo}
    </>
  )
}

export default ListasDelProfesional
