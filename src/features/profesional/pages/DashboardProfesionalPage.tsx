import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link as EnlaceRouter, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined'
import LibraryMusicOutlined from '@mui/icons-material/LibraryMusicOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import { contarDashboard } from '../dashboard/dashboardService'
import {
  ABRIR_NUEVO_PROGRAMA,
  ABRIR_SUBIDA,
  RUTA_CREAR_PROGRAMA,
  RUTA_SUBIR_AUDIO,
  primerosPasos,
  type AccionPaso,
  type ClaveConteo,
  type Conteos,
} from '../dashboard/modelo'
import { useNombreProfesional } from '../dashboard/useNombreProfesional'
import { animacionEntrada, animacionFundido } from '../theme/movimiento'

type TarjetaResumen = {
  clave: ClaveConteo
  label: string
  description: string
  icon: ReactNode
  enlace: { texto: string; destino: string }
}

// Resumen: números reales (consultas de conteo; ver dashboard/modelo.ts).
const TARJETAS_RESUMEN: TarjetaResumen[] = [
  {
    clave: 'audiosPublicados',
    label: 'Audios publicados',
    description: 'Los audios que compartes con tus oyentes.',
    icon: <LibraryMusicOutlined />,
    enlace: { texto: 'Ver audios →', destino: '/profesional/audios' },
  },
  {
    clave: 'oyentesActivos',
    label: 'Oyentes',
    description: 'Las personas que tienen acceso a tus audios.',
    icon: <PeopleOutlined />,
    enlace: { texto: 'Ver oyentes →', destino: '/profesional/oyentes' },
  },
  {
    clave: 'programasPublicados',
    label: 'Programas',
    description: 'Tus programas paso a paso publicados.',
    icon: <EventRepeatOutlined />,
    enlace: { texto: 'Ver programas →', destino: RUTA_CREAR_PROGRAMA },
  },
]

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; conteos: Conteos }

/**
 * Portada del panel de profesional (/profesional): saludo, resumen con
 * números reales, accesos rápidos y «Primeros pasos» (hasta completarlos).
 */
function DashboardProfesionalPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const navigate = useNavigate()
  const { nombre, listo, perfil, perfilCargado } = useNombreProfesional()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!uid) return
    let vigente = true
    setEstado({ tipo: 'cargando' })
    contarDashboard(uid)
      .then((conteos) => vigente && setEstado({ tipo: 'listo', conteos }))
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [uid, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  // Los flujos de otras páginas se abren con un aviso al navegar.
  const subirAudio = () =>
    navigate(RUTA_SUBIR_AUDIO, { state: { abrir: ABRIR_SUBIDA } })
  const crearPrograma = () =>
    navigate(RUTA_CREAR_PROGRAMA, { state: { abrir: ABRIR_NUEVO_PROGRAMA } })
  const ir = (accion: AccionPaso) => {
    if (accion.tipo === 'subirAudio') subirAudio()
    else if (accion.tipo === 'crearPrograma') crearPrograma()
    else navigate(accion.destino)
  }

  const pasos =
    estado.tipo === 'listo' && perfilCargado
      ? primerosPasos(perfil, estado.conteos)
      : null
  const hechos = pasos?.filter((p) => p.hecho).length ?? 0
  const mostrarPasos = pasos !== null && hechos < pasos.length

  return (
    <Box component="section" aria-labelledby="pro-dashboard-saludo">
      <Box sx={{ pt: { xs: 2, md: 5 }, pb: { xs: 4, md: 6 } }}>
        <Typography
          id="pro-dashboard-saludo"
          component="h1"
          sx={[
            {
              fontSize: { xs: 30, md: 40 },
              lineHeight: 1.2,
              fontWeight: 400,
              letterSpacing: '-0.01em',
            },
            listo ? animacionFundido() : { visibility: 'hidden' },
          ]}
        >
          {listo && nombre ? `Bienvenido, ${nombre}` : 'Bienvenido'}
        </Typography>
        <Typography
          sx={{
            mt: 1.5,
            fontSize: { xs: 15, md: 16 },
            color: 'text.secondary',
          }}
        >
          Esto es lo que tienes hoy en tu panel.
        </Typography>
      </Box>

      {/* Fila 1: resumen. */}
      <Typography
        component="h2"
        sx={[
          { fontSize: 16, fontWeight: 500, mb: 2 },
          animacionEntrada({ retardo: 60 }),
        ]}
      >
        Resumen
      </Typography>

      {estado.tipo === 'error' ? (
        <Paper
          variant="outlined"
          role="alert"
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No se pudo cargar el resumen.
          </Typography>
          <Button variant="outlined" onClick={reintentar}>
            Reintentar
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {TARJETAS_RESUMEN.map((tarjeta, indice) => (
            <Paper
              key={tarjeta.clave}
              variant="outlined"
              sx={[
                {
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 176,
                },
                animacionEntrada({ retardo: 90 + indice * 50, distancia: 10 }),
              ]}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  color: 'text.secondary',
                }}
              >
                <Box sx={{ display: 'flex', '& svg': { fontSize: 20 } }}>
                  {tarjeta.icon}
                </Box>
                <Typography
                  component="h3"
                  sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}
                >
                  {tarjeta.label}
                </Typography>
              </Box>

              {estado.tipo === 'cargando' ? (
                <Skeleton
                  variant="text"
                  width={56}
                  sx={{ mt: 2, fontSize: 32 }}
                  aria-label="Cargando"
                />
              ) : (
                <Typography
                  sx={{
                    mt: 2.5,
                    fontSize: 32,
                    lineHeight: 1,
                    fontWeight: 400,
                  }}
                >
                  {estado.conteos[tarjeta.clave]}
                </Typography>
              )}
              <Typography
                variant="body2"
                sx={{ mt: 1.5, color: 'text.secondary' }}
              >
                {tarjeta.description}
              </Typography>

              <Box sx={{ flexGrow: 1 }} />
              <Button
                component={EnlaceRouter}
                to={tarjeta.enlace.destino}
                size="small"
                sx={{ mt: 2, alignSelf: 'flex-start', ml: -1 }}
              >
                {tarjeta.enlace.texto}
              </Button>
            </Paper>
          ))}
        </Box>
      )}

      {/* Fila 2: accesos rápidos y primeros pasos. */}
      <Box
        sx={{
          mt: { xs: 3, md: 4 },
          display: 'grid',
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: {
            xs: '1fr',
            md: mostrarPasos ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
          },
          alignItems: 'start',
        }}
      >
        <Paper
          variant="outlined"
          sx={[{ p: 3 }, animacionEntrada({ retardo: 240, distancia: 10 })]}
        >
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 500 }}>
            Accesos rápidos
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<CloudUploadOutlined />}
              onClick={subirAudio}
              sx={{ py: 1.5 }}
            >
              Subir un audio
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<EventRepeatOutlined />}
              onClick={crearPrograma}
              sx={{ py: 1.5 }}
            >
              Crear un programa
            </Button>
          </Box>
        </Paper>

        {mostrarPasos && pasos && (
          <Paper
            variant="outlined"
            sx={[{ p: 3 }, animacionEntrada({ retardo: 290, distancia: 10 })]}
          >
            <Typography component="h2" sx={{ fontSize: 16, fontWeight: 500 }}>
              Primeros pasos
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {hechos} de {pasos.length} completados
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(hechos / pasos.length) * 100}
              aria-label="Primeros pasos completados"
              sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
            />
            <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 1.5, p: 0 }}>
              {pasos.map((paso) => (
                <Box
                  component="li"
                  key={paso.id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <Checkbox
                    checked={paso.hecho}
                    disabled
                    size="small"
                    slotProps={{ input: { 'aria-label': paso.texto } }}
                    sx={{ ml: -1 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      flexGrow: 1,
                      color: paso.hecho ? 'text.secondary' : 'text.primary',
                      textDecoration: paso.hecho ? 'line-through' : 'none',
                    }}
                  >
                    {paso.texto}
                  </Typography>
                  {!paso.hecho && paso.accion && (
                    <Button
                      size="small"
                      onClick={() => paso.accion && ir(paso.accion.destino)}
                    >
                      {paso.accion.texto}
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  )
}

export default DashboardProfesionalPage
