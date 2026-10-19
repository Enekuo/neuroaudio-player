import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import { useAuth } from '../../auth/context/AuthContext'
import { animacionEntrada } from '../theme/movimiento'
import AudiosGenerales from './AudiosGenerales'
import AudiosPersonales from './AudiosPersonales'

type Pestana = 'generales' | 'personales'

/**
 * Página Audios del panel (/profesional/audios), con dos pestañas:
 * - «Audios generales»: la biblioteca que ven todos los oyentes con acceso.
 * - «Para una persona»: audios que solo ve y escucha un oyente concreto
 *   con vínculo activo (tipo `personal` + `destinatarioUid`).
 */
function AudiosPage() {
  const { user } = useAuth()
  const [pestana, setPestana] = useState<Pestana>('generales')

  if (!user) {
    return (
      <Alert severity="warning">Inicia sesión para gestionar tus audios.</Alert>
    )
  }

  return (
    <Box component="section" aria-labelledby="audios-titulo">
      <Box sx={{ mb: 2.5 }}>
        <Typography
          id="audios-titulo"
          variant="h5"
          component="h1"
          sx={{ fontWeight: 400 }}
        >
          Audios
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mt: 0.75,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Tus audios publicados los escuchan las personas que tienen acceso a
            ti.
          </Typography>
          {/* Cómo se cobra la cuota de acceso aún no está decidido. */}
          <Chip
            size="small"
            icon={<HelpOutlineRounded />}
            label="Cuota de acceso: por decidir"
            color="warning"
            variant="outlined"
          />
        </Box>
      </Box>

      <Tabs
        value={pestana}
        onChange={(_, valor: Pestana) => setPestana(valor)}
        aria-label="Tipos de audio"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          value="generales"
          label="Audios generales"
          id="pestana-generales"
          aria-controls="panel-audios"
        />
        <Tab
          value="personales"
          label="Para una persona"
          id="pestana-personales"
          aria-controls="panel-audios"
        />
      </Tabs>

      <Box
        key={pestana}
        id="panel-audios"
        role="tabpanel"
        aria-labelledby={`pestana-${pestana}`}
        sx={animacionEntrada({ duracion: 220, distancia: 6 })}
      >
        {pestana === 'generales' ? (
          <AudiosGenerales uid={user.uid} />
        ) : (
          <AudiosPersonales uid={user.uid} />
        )}
      </Box>
    </Box>
  )
}

export default AudiosPage
