import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import {
  escucharMiBiblioteca,
  escucharMisAudiosGenerales,
  escucharMisAudiosPersonales,
} from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { escucharMisListas } from '../../listasProfesional/listaProfesionalService'
import type { ListaProfesional } from '../../listasProfesional/modelo'
import { Apartado, CabeceraAjustes } from './comunes'
import { formatearEspacio } from '../../../lib/formato'
import { resumirUso } from './uso'

/** Botón de algo que aún no existe: desactivado y con «Próximamente». */
function AccionProximamente({ texto }: { texto: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
      }}
    >
      <Chip size="small" label="Próximamente" />
      <Button variant="outlined" disabled sx={{ borderRadius: 999 }}>
        {texto}
      </Button>
    </Box>
  )
}

/**
 * Ajustes → Plan y uso (antes, dos pestañas): tu plan, lo que llevas usado y
 * tus facturas. Solo el diseño: el plan es siempre «Free» (los planes del
 * profesional aún no están decididos), el uso son las cifras reales que ya
 * leía el panel, y la facturación está vacía (sin método de pago ni facturas
 * todavía). No conecta nada nuevo.
 */
function PlanYUsoAjustes() {
  return (
    <Box component="section" aria-labelledby="ajustes-plan-y-uso">
      <CabeceraAjustes
        id="ajustes-plan-y-uso"
        titulo="Plan y uso"
        intro="Tu plan, lo que llevas usado y tus facturas."
      />
      <TarjetaPlan />
      <TarjetaUso />
      <TarjetaFacturacion />
    </Box>
  )
}

function TarjetaPlan() {
  return (
    <Apartado id="ajustes-tu-plan" titulo="Tu plan">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mt: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="p" sx={{ fontWeight: 400 }}>
              Free
            </Typography>
            <Chip
              size="small"
              label="Gratis"
              sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Gestión de suscripción próximamente.
          </Typography>
        </Box>
        <AccionProximamente texto="Cambiar de plan" />
      </Box>
    </Apartado>
  )
}

/**
 * Las cifras de Uso de siempre, con los datos del profesional que el panel ya
 * lee: sus audios (generales, «para una persona» y Mis audios), sus listas y
 * el espacio de sus archivos de audio. En vivo; con carga, error y vacío.
 */
function TarjetaUso() {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const [intento, setIntento] = useState(0)
  const [generales, setGenerales] = useState<AudioProfesional[] | null>(null)
  const [personales, setPersonales] = useState<AudioProfesional[] | null>(null)
  const [biblioteca, setBiblioteca] = useState<AudioProfesional[] | null>(null)
  const [listas, setListas] = useState<ListaProfesional[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!uid) return
    setError(false)
    const fallo = () => setError(true)
    const cancelar = [
      escucharMisAudiosGenerales(uid, setGenerales, fallo),
      escucharMisAudiosPersonales(uid, setPersonales, fallo),
      escucharMiBiblioteca(uid, setBiblioteca, fallo),
      escucharMisListas(uid, setListas, fallo),
    ]
    return () => cancelar.forEach((c) => c())
  }, [uid, intento])

  const cargando = !generales || !personales || !biblioteca || !listas
  const uso = useMemo(
    () => resumirUso([generales ?? [], personales ?? [], biblioteca ?? []]),
    [generales, personales, biblioteca],
  )
  const vacio = !cargando && uso.audios === 0 && listas.length === 0

  const cifras = [
    {
      etiqueta: 'Audios guardados',
      valor: String(uso.audios),
      nota: 'Generales, para una persona y de Biblioteca',
    },
    { etiqueta: 'Listas creadas', valor: String(listas?.length ?? 0) },
    {
      etiqueta: 'Espacio usado',
      valor: formatearEspacio(uso.bytes),
      nota: 'Solo audios, sin fotos ni portadas',
    },
  ]

  return (
    <Apartado id="ajustes-uso" titulo="Uso">
      {error ? (
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
          sx={{ mt: 1 }}
        >
          No se pudo cargar tu uso. Revisa tu conexión.
        </Alert>
      ) : (
        <>
          <Box
            aria-busy={cargando}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mt: 1,
            }}
          >
            {cifras.map((cifra) => (
              <Paper key={cifra.etiqueta} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {cifra.etiqueta}
                </Typography>
                <Typography
                  variant="h5"
                  component="p"
                  sx={{
                    fontWeight: 400,
                    fontVariantNumeric: 'tabular-nums',
                    mt: 0.25,
                  }}
                >
                  {cargando ? (
                    <Skeleton width={72} aria-label="Cargando" />
                  ) : (
                    cifra.valor
                  )}
                </Typography>
                {cifra.nota && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {cifra.nota}
                  </Typography>
                )}
              </Paper>
            ))}
          </Box>
          {vacio && (
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              Todavía no has subido audios ni creado listas.
            </Typography>
          )}
        </>
      )}
    </Apartado>
  )
}

const COLUMNAS_FACTURAS: {
  titulo: string
  alinear?: 'right'
}[] = [
  { titulo: 'Fecha' },
  { titulo: 'Concepto' },
  { titulo: 'Importe', alinear: 'right' },
  { titulo: 'Estado' },
  { titulo: 'Factura', alinear: 'right' },
]

/** Facturación: método de pago y facturas, con su diseño pero vacío. */
function TarjetaFacturacion() {
  return (
    <Apartado id="ajustes-facturacion" titulo="Facturación">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mt: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: 'text.secondary',
          }}
        >
          <CreditCardOutlined fontSize="small" />
          <Typography variant="body2">
            Todavía no has añadido un método de pago.
          </Typography>
        </Box>
        <AccionProximamente texto="Cambiar método de pago" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Table size="small" aria-label="Facturas">
        <TableHead sx={{ display: { xs: 'none', sm: 'table-header-group' } }}>
          <TableRow>
            {COLUMNAS_FACTURAS.map((c) => (
              <TableCell
                key={c.titulo}
                align={c.alinear}
                // Primera y última columna, al ras de la tarjeta; entre
                // columnas, su margen de siempre.
                sx={{
                  color: 'text.secondary',
                  '&:first-of-type': { pl: 0 },
                  '&:last-of-type': { pr: 0 },
                }}
              >
                {c.titulo}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={COLUMNAS_FACTURAS.length}
              align="center"
              sx={{ color: 'text.secondary', py: 3, borderBottom: 0 }}
            >
              Todavía no tienes facturas.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Apartado>
  )
}

export default PlanYUsoAjustes
