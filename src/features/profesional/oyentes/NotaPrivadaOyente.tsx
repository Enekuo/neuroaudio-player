import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import LockOutlined from '@mui/icons-material/LockOutlined'
import {
  escucharNotaPrivada,
  guardarNotaPrivada,
  limpiarNota,
  type NotaPrivada,
} from '../../oyentesProfesional/notaService'
import { MAX_NOTA_PRIVADA } from '../../perfilProfesional/modelo'
import { formatoFecha } from './formato'

type NotaPrivadaOyenteProps = {
  uid: string
  oyenteUid: string
  onAviso: (mensaje: string) => void
  /** Hay cambios sin guardar (para avisar al salir). */
  onCambios: (hayCambios: boolean) => void
}

/**
 * Nota privada del profesional sobre una persona. Solo la ve él (las reglas
 * no dejan leerla al oyente). Se guarda con «Guardar nota»; vacía, se borra.
 */
function NotaPrivadaOyente({
  uid,
  oyenteUid,
  onAviso,
  onCambios,
}: NotaPrivadaOyenteProps) {
  // undefined: cargando.
  const [nota, setNota] = useState<NotaPrivada | null | undefined>(undefined)
  const [texto, setTexto] = useState('')
  const [editado, setEditado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    setError(null)
    return escucharNotaPrivada(uid, oyenteUid, setNota, () =>
      setError('No se pudo cargar la nota.'),
    )
  }, [uid, oyenteUid, intento])

  // Mientras no la estés editando, sigue a la guardada.
  useEffect(() => {
    if (!editado && nota !== undefined) setTexto(nota?.texto ?? '')
  }, [nota, editado])

  const guardada = nota?.texto ?? ''
  const hayCambios = editado && limpiarNota(texto) !== guardada
  useEffect(() => onCambios(hayCambios), [hayCambios, onCambios])
  useEffect(() => () => onCambios(false), [onCambios])

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    const vacia = !limpiarNota(texto)
    try {
      await guardarNotaPrivada(uid, oyenteUid, texto)
      setEditado(false)
      onAviso(vacia ? 'Nota borrada.' : 'Nota guardada.')
    } catch {
      setError('No se pudo guardar la nota. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Paper
      variant="outlined"
      component="section"
      aria-labelledby="nota-privada-titulo"
      sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
    >
      <Typography
        id="nota-privada-titulo"
        variant="h6"
        component="h2"
        sx={{ fontWeight: 400 }}
      >
        Nota privada
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          alignItems: 'center',
          color: 'text.secondary',
          mt: 0.5,
          mb: 2,
        }}
      >
        <LockOutlined sx={{ fontSize: 16 }} />
        <Typography variant="body2">
          Solo la ves tú. Esta persona no puede leerla.
        </Typography>
      </Box>

      {nota === undefined && !error ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
          <CircularProgress size={28} aria-label="Cargando la nota" />
        </Box>
      ) : (
        <>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="Por ejemplo: qué le está funcionando, qué quiere trabajar…"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setEditado(true)
              setError(null)
            }}
            disabled={guardando || nota === undefined}
            slotProps={{
              htmlInput: {
                maxLength: MAX_NOTA_PRIVADA,
                'aria-label': 'Nota privada',
              },
            }}
            helperText={`${texto.length}/${MAX_NOTA_PRIVADA}`}
          />
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {hayCambios
                ? 'Cambios sin guardar'
                : nota?.actualizadoEn
                  ? `Guardada el ${formatoFecha.format(nota.actualizadoEn)}`
                  : ''}
            </Typography>
            <Box sx={{ flex: 1 }} />
            {hayCambios && (
              <Button
                onClick={() => {
                  setEditado(false)
                  setTexto(guardada)
                  setError(null)
                }}
                disabled={guardando}
              >
                Descartar
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => void guardar()}
              disabled={!hayCambios || guardando}
              startIcon={
                guardando ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              Guardar nota
            </Button>
          </Box>
        </>
      )}
      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            nota === undefined ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => setIntento((n) => n + 1)}
              >
                Reintentar
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}
    </Paper>
  )
}

export default NotaPrivadaOyente
