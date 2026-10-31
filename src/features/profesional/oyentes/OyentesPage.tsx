import { useEffect, useMemo, useState } from 'react'
import { Link as EnlaceRouter, Route, Routes } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import { useAuth } from '../../auth/context/AuthContext'
import { escucharMisEnvios } from '../../audiosProfesional/audioProfesionalService'
import type { EnvioAudio } from '../../audiosProfesional/modelo'
import {
  MAX_OYENTES,
  etiquetaOyente,
  type OyenteDelProfesional,
} from '../../perfilProfesional/modelo'
import { escucharMisOyentes } from '../../perfilProfesional/perfilService'
import { animacionEntrada } from '../theme/movimiento'
import FichaOyente from './FichaOyente'
import { formatoFecha, inicialOyente } from './formato'

type FiltroEstado = 'todos' | 'activo' | 'pausado'

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const audiosTexto = (n: number) => (n === 1 ? '1 audio' : `${n} audios`)

/**
 * «Oyentes» (/profesional/oyentes): las personas con vínculo con el
 * profesional, con su estado, su fecha de entrada y cuántos audios de «Mis
 * audios» tiene cada una. Buscador (nombre o correo) y filtro por estado.
 * Cada fila abre su ficha (/profesional/oyentes/{oyenteUid}).
 */
function OyentesPage() {
  const { user } = useAuth()
  if (!user) {
    return (
      <Alert severity="warning">Inicia sesión para ver a tus oyentes.</Alert>
    )
  }
  return (
    <Routes>
      <Route index element={<ListaOyentes uid={user.uid} />} />
      <Route path=":oyenteUid" element={<FichaOyente uid={user.uid} />} />
    </Routes>
  )
}

function ListaOyentes({ uid }: { uid: string }) {
  const [intento, setIntento] = useState(0)
  const [oyentes, setOyentes] = useState<OyenteDelProfesional[] | null>(null)
  const [envios, setEnvios] = useState<EnvioAudio[] | null>(null)
  const [error, setError] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('todos')

  useEffect(() => {
    setError(false)
    setOyentes(null)
    return escucharMisOyentes(uid, setOyentes, () => setError(true))
  }, [uid, intento])

  useEffect(
    () => escucharMisEnvios(uid, setEnvios, () => setError(true)),
    [uid, intento],
  )

  // Cuántos audios de «Mis audios» tiene cada persona.
  const audiosDe = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const e of envios ?? [])
      cuenta.set(e.oyenteUid, (cuenta.get(e.oyenteUid) ?? 0) + 1)
    return cuenta
  }, [envios])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return (oyentes ?? []).filter(
      (o) =>
        (estado === 'todos' || o.estado === estado) &&
        (!q ||
          normalizar(etiquetaOyente(o)).includes(q) ||
          normalizar(o.email).includes(q)),
    )
  }, [oyentes, busqueda, estado])

  const cabecera = (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        id="oyentes-titulo"
        variant="h5"
        component="h1"
        sx={{ fontWeight: 400 }}
      >
        Oyentes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        Las personas que te siguen. Mientras su vínculo esté activo, ven tus
        audios generales y los que les envías.
      </Typography>
    </Box>
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
        No se pudieron cargar tus oyentes. Revisa tu conexión.
      </Alert>
    )
  } else if (!oyentes || !envios) {
    contenido = (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando tus oyentes" />
      </Box>
    )
  } else if (oyentes.length === 0) {
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
          <PeopleOutlined />
        </Box>
        <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
          Todavía no tienes oyentes
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, maxWidth: 460, mx: 'auto' }}
        >
          Cuando alguien se una a ti, aparecerá aquí.
        </Typography>
      </Paper>
    )
  } else {
    const activos = oyentes.filter((o) => o.estado === 'activo').length
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
            placeholder="Buscar por nombre o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ flex: '1 1 220px', maxWidth: 360 }}
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar por nombre o correo' },
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
            value={estado}
            onChange={(e) => setEstado(e.target.value as FiltroEstado)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="activo">Activos</MenuItem>
            <MenuItem value="pausado">En pausa</MenuItem>
          </TextField>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {oyentes.length === 1 ? '1 oyente' : `${oyentes.length} oyentes`} ·{' '}
          {activos === 1 ? '1 activo' : `${activos} activos`}
        </Typography>
        {oyentes.length >= MAX_OYENTES && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            El panel muestra como mucho {MAX_OYENTES} oyentes a la vez. Si
            tienes más, algunos no aparecen en esta lista.
          </Alert>
        )}

        {visibles.length === 0 ? (
          <Paper variant="outlined" sx={{ py: 5, px: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nadie coincide con la búsqueda.
            </Typography>
          </Paper>
        ) : (
          <Paper
            variant="outlined"
            component="ul"
            aria-labelledby="oyentes-titulo"
            sx={{ listStyle: 'none', m: 0, p: 0, overflow: 'hidden' }}
          >
            {visibles.map((oyente, indice) => (
              <FilaOyente
                key={oyente.oyenteUid}
                oyente={oyente}
                audios={audiosDe.get(oyente.oyenteUid) ?? 0}
                primera={indice === 0}
              />
            ))}
          </Paper>
        )}
      </>
    )
  }

  return (
    <Box component="section" aria-labelledby="oyentes-titulo">
      {cabecera}
      {contenido}
    </Box>
  )
}

function FilaOyente({
  oyente,
  audios,
  primera,
}: {
  oyente: OyenteDelProfesional
  audios: number
  primera: boolean
}) {
  const activo = oyente.estado === 'activo'
  const fechaEntrada = oyente.creadoEn
    ? formatoFecha.format(oyente.creadoEn)
    : '—'
  const chipEstado = (
    <Chip
      size="small"
      label={activo ? 'Activo' : 'En pausa'}
      color={activo ? 'success' : 'warning'}
      variant="outlined"
    />
  )
  return (
    <Box
      component="li"
      sx={{
        borderTop: primera ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <ButtonBase
        component={EnlaceRouter}
        to={encodeURIComponent(oyente.oyenteUid)}
        aria-label={`Abrir la ficha de ${etiquetaOyente(oyente)}`}
        sx={{
          width: '100%',
          textAlign: 'left',
          display: 'grid',
          gridTemplateColumns: {
            xs: '40px minmax(0, 1fr) 24px',
            sm: '40px minmax(0, 1fr) auto 120px 90px 24px',
          },
          alignItems: 'center',
          gap: { xs: 1.25, sm: 2 },
          px: { xs: 1.5, sm: 2 },
          py: 1.5,
          transition: 'background-color 150ms ease',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.light',
            color: 'primary.main',
            fontSize: 16,
          }}
        >
          {inicialOyente(oyente)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 500 }} noWrap>
            {etiquetaOyente(oyente)}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {oyente.email || '—'}
          </Typography>
          {/* En el móvil, el resto de datos debajo del nombre. */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              gap: 0.75,
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 0.75,
            }}
          >
            {chipEstado}
            <Typography variant="body2" color="text.secondary">
              {audiosTexto(audios)} · Desde {fechaEntrada}
            </Typography>
          </Box>
          {!activo && oyente.estadoCambiadoEn && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.25 }}
            >
              En pausa desde {formatoFecha.format(oyente.estadoCambiadoEn)}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{chipEstado}</Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}
          title="Fecha de entrada"
        >
          {fechaEntrada}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: { xs: 'none', sm: 'block' },
            whiteSpace: 'nowrap',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
          title="Audios de Biblioteca que tiene"
        >
          {audiosTexto(audios)}
        </Typography>
        <ChevronRightRounded sx={{ color: 'text.secondary' }} />
      </ButtonBase>
    </Box>
  )
}

export default OyentesPage
