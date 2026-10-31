import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

/** Título e introducción de una página de Ajustes (como en el oyente). */
export function CabeceraAjustes({
  id,
  titulo,
  intro,
}: {
  id: string
  titulo: string
  /** Sin intro, solo el título (como «Cuenta» en el oyente). */
  intro?: string
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography id={id} variant="h6" component="h2" sx={{ fontWeight: 400 }}>
        {titulo}
      </Typography>
      {intro && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {intro}
        </Typography>
      )}
    </Box>
  )
}

/** Un apartado de una página de Ajustes; `proximamente`: aún no disponible. */
export function Apartado({
  id,
  titulo,
  proximamente = false,
  children,
}: {
  id: string
  titulo: string
  proximamente?: boolean
  children: ReactNode
}) {
  return (
    <Paper
      variant="outlined"
      component="section"
      aria-labelledby={id}
      sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography
          id={id}
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 500 }}
        >
          {titulo}
        </Typography>
        {proximamente && <Chip size="small" label="Próximamente" />}
      </Box>
      {children}
    </Paper>
  )
}

/** Fila de ajuste: nombre y explicación a la izquierda, el control a la derecha. */
export function Fila({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string
  ayuda: string
  children: ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        py: 1.5,
        '& + &': { borderTop: '1px solid', borderColor: 'divider' },
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
        <Typography>{etiqueta}</Typography>
        <Typography variant="body2" color="text.secondary">
          {ayuda}
        </Typography>
      </Box>
      {children}
    </Box>
  )
}

/** Dato de solo lectura (término y valor). */
export function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="dt"
        variant="body2"
        color="text.secondary"
        sx={{ mb: 0.25 }}
      >
        {titulo}
      </Typography>
      <Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>
        {valor}
      </Typography>
    </Box>
  )
}
