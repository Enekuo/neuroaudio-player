import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import { escucharMisAudiosGenerales } from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { escucharMisListas } from '../../listasProfesional/listaProfesionalService'
import type { ListaProfesional } from '../../listasProfesional/modelo'
import { animacionEntrada } from '../theme/movimiento'
import EditorLista from './EditorLista'
import ListasDelProfesional from './ListasDelProfesional'

/** Lo que carga la página una vez y comparten la cuadrícula y el editor. */
export type DatosListas = {
  uid: string
  listas: ListaProfesional[] | null
  audios: AudioProfesional[] | null
  error: boolean
}

/**
 * Página «Listas y programas» del panel (/profesional/listas):
 * - /profesional/listas: pestaña «Listas» (tarjetas, buscador, filtro).
 * - /profesional/listas/programas: pestaña «Programas» (próximamente).
 * - /profesional/listas/nueva[?plantilla=id] y /profesional/listas/:listaId:
 *   el editor de una lista.
 */
function ListasPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [listas, setListas] = useState<ListaProfesional[] | null>(null)
  const [audios, setAudios] = useState<AudioProfesional[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!uid) return
    return escucharMisListas(
      uid,
      (l) => {
        setListas(l)
        setError(false)
      },
      () => setError(true),
    )
  }, [uid])

  useEffect(() => {
    if (!uid) return
    return escucharMisAudiosGenerales(uid, setAudios, () => setError(true))
  }, [uid])

  if (!uid) {
    return (
      <Alert severity="warning">Inicia sesión para gestionar tus listas.</Alert>
    )
  }

  const datos: DatosListas = { uid, listas, audios, error }

  return (
    <Routes>
      <Route index element={<Cabecera pestana="listas" datos={datos} />} />
      <Route
        path="programas"
        element={<Cabecera pestana="programas" datos={datos} />}
      />
      <Route path="nueva" element={<EditorLista datos={datos} />} />
      <Route path=":listaId" element={<EditorLista datos={datos} />} />
    </Routes>
  )
}

function Cabecera({
  pestana,
  datos,
}: {
  pestana: 'listas' | 'programas'
  datos: DatosListas
}) {
  const { pathname } = useLocation()
  const base = pathname.replace(/\/programas\/?$/, '').replace(/\/$/, '')

  return (
    <Box component="section" aria-labelledby="listas-titulo">
      <Box sx={{ mb: 2.5 }}>
        <Typography
          id="listas-titulo"
          variant="h5"
          component="h1"
          sx={{ fontWeight: 400 }}
        >
          Listas y programas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Agrupa tus audios en listas. Las publicadas las ven las personas que
          tienen acceso a ti.
        </Typography>
      </Box>

      <Tabs
        value={pestana}
        aria-label="Listas y programas"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          value="listas"
          label="Listas"
          component={Link}
          to={base}
          id="pestana-listas"
          aria-controls="panel-listas"
        />
        <Tab
          value="programas"
          label="Programas"
          component={Link}
          to={`${base}/programas`}
          id="pestana-programas"
          aria-controls="panel-listas"
        />
      </Tabs>

      <Box
        id="panel-listas"
        role="tabpanel"
        aria-labelledby={`pestana-${pestana}`}
      >
        {pestana === 'listas' ? (
          <ListasDelProfesional datos={datos} />
        ) : (
          <Programas />
        )}
      </Box>
    </Box>
  )
}

/**
 * Pestaña «Programas»: visible, sin funcionalidad todavía. El modelo ya
 * contempla `tipo: 'programa'` (listasProfesional/modelo.ts).
 */
function Programas() {
  return (
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
        <EventRepeatOutlined />
      </Box>
      <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
        Próximamente
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, maxWidth: 440, mx: 'auto' }}
      >
        Aquí podrás crear programas paso a paso.
      </Typography>
    </Paper>
  )
}

export default ListasPage
