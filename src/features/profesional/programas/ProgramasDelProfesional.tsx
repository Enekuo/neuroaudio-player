import { useState } from 'react'
import { Link as EnlaceRouter, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import ListItemButton from '@mui/material/ListItemButton'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined'
import { LIMITES_PROGRAMA } from '../../programasProfesional/modelo'
import { animacionEntrada } from '../theme/movimiento'
import ChipPara from './ChipPara'
import DialogoPrograma from './DialogoPrograma'
import { useDatosProgramas } from './useDatosProgramas'

const textoPasos = (n: number) => (n === 1 ? '1 paso' : `${n} pasos`)

/**
 * Pestaña «Programas»: sus programas (nombre, pasos, ritmo, estado y para
 * quién) y «Nuevo programa». Al tocar uno se abre su página.
 */
function ProgramasDelProfesional({ uid }: { uid: string }) {
  const datos = useDatosProgramas(uid)
  const { programas, accesosPorPrograma, error } = datos
  const navigate = useNavigate()
  const [creando, setCreando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  if (error) {
    return (
      <Alert severity="error">
        No se pudieron cargar tus programas. Revisa tu conexión y vuelve a
        entrar.
      </Alert>
    )
  }
  if (!programas) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando programas" />
      </Box>
    )
  }

  const lleno = programas.length >= LIMITES_PROGRAMA.programas
  const botonCrear = (texto: string) => (
    <Tooltip
      title={
        lleno
          ? `Puedes tener ${LIMITES_PROGRAMA.programas} programas como mucho. Borra alguno para crear otro.`
          : ''
      }
    >
      <span>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setCreando(true)}
          disabled={lleno}
        >
          {texto}
        </Button>
      </span>
    </Tooltip>
  )

  const contenido =
    programas.length === 0 ? (
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
          Aún no has creado programas
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 3, maxWidth: 440, mx: 'auto' }}
        >
          Un programa es una lista de audios de tu Biblioteca para seguir paso a
          paso, con un ritmo recomendado.
        </Typography>
        {botonCrear('Crear tu primer programa')}
      </Paper>
    ) : (
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mb: 2,
          }}
        >
          {botonCrear('Nuevo programa')}
        </Box>
        <Paper
          variant="outlined"
          component="ul"
          sx={{ listStyle: 'none', m: 0, p: 0, overflow: 'hidden' }}
        >
          {programas.map((p, indice) => {
            const publicado = p.estado === 'publicado'
            const personas = accesosPorPrograma.get(p.id)?.length ?? 0
            return (
              <Box
                component="li"
                key={p.id}
                sx={[
                  {
                    borderTop: indice === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                  },
                  animacionEntrada({ retardo: 40 + Math.min(indice, 8) * 30 }),
                ]}
              >
                <ListItemButton
                  component={EnlaceRouter}
                  to={`/profesional/listas/programas/${p.id}`}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography sx={{ minWidth: 0 }} noWrap>
                      {p.titulo}
                    </Typography>
                    <ChipPara para={p.para} personas={personas} />
                    {!publicado && (
                      <Chip size="small" variant="outlined" label="Borrador" />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {textoPasos(p.pasos.length)}
                  </Typography>
                </ListItemButton>
              </Box>
            )
          })}
        </Paper>
      </>
    )

  return (
    <>
      {contenido}
      {creando && (
        <DialogoPrograma
          datos={datos}
          onCerrar={(resultado) => {
            setCreando(false)
            if (!resultado) return
            setAviso(resultado.mensaje)
            if (resultado.creado)
              navigate(`/profesional/listas/programas/${resultado.creado}`, {
                state: { aviso: resultado.mensaje },
              })
          }}
        />
      )}
      <Snackbar
        open={aviso !== null}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}

export default ProgramasDelProfesional
