import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { alpha, useTheme, type SxProps, type Theme } from '@mui/material/styles'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { LIMITES_BIBLIOTECA } from '../../audiosProfesional/modelo'
import { formatTime } from '../../library/utils/formatTime'
import {
  LIMITES_PROGRAMA,
  validarPrograma,
  type AperturaPrograma,
  type ParaPrograma,
  type ProgramaProfesional,
  type RitmoPrograma,
} from '../../programasProfesional/modelo'
import {
  actualizarPrograma,
  crearPrograma,
  darPrograma,
} from '../../programasProfesional/programaService'
import DialogoElegirAudios from '../oyentes/DialogoElegirAudios'
import SelectorPersonas from './SelectorPersonas'
import type { DatosProgramas } from './useDatosProgramas'

const APERTURAS: { valor: AperturaPrograma; titulo: string; texto: string }[] =
  [
    {
      valor: 'libre',
      titulo: 'Libre',
      texto: 'Todos los pasos abiertos desde el principio.',
    },
    {
      valor: 'orden',
      titulo: 'En orden',
      texto: 'El siguiente paso se abre al completar el anterior.',
    },
    {
      valor: 'calendario',
      titulo: 'Por calendario',
      texto:
        'Se abre un paso según el ritmo, contando desde el día en que cada persona recibe el programa.',
    },
  ]

const RITMOS: { valor: RitmoPrograma; boton: string; texto: string }[] = [
  { valor: 'diario', boton: 'Diario', texto: '1 audio al día' },
  { valor: 'semanal', boton: 'Semanal', texto: '1 audio a la semana' },
  { valor: 'mensual', boton: 'Mensual', texto: '1 audio al mes' },
  { valor: 'dias', boton: 'N días', texto: '1 audio cada N días' },
]

/** Botones seguidos (como pestañas): el elegido, en azul claro. */
const botonesSeguidos: SxProps<Theme> = {
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    fontSize: 15,
    py: 1,
    px: 1,
    color: 'text.secondary',
  },
  '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover':
    {
      bgcolor: 'primary.light',
      color: 'primary.main',
    },
}

/** Cada paso (y «Añadir audio»), en su propia caja. */
const cajaPaso = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  bgcolor: 'background.paper',
}

type DialogoProgramaProps = {
  datos: DatosProgramas
  /** El programa a editar; sin él, se crea uno nuevo (en borrador). */
  programa?: ProgramaProfesional
  /** Al terminar: el aviso para mostrar y, si se ha creado, su id. */
  onCerrar: (resultado?: { mensaje: string; creado?: string }) => void
}

/**
 * «Crear programa» y «Editar programa»: nombre, descripción, cómo se abre,
 * ritmo recomendado, audios de Biblioteca en orden y, al crearlo, para quién
 * es (no se cambia después). Se crea en borrador.
 */
function DialogoPrograma({ datos, programa, onCerrar }: DialogoProgramaProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const esNuevo = !programa
  const biblioteca = useMemo(() => datos.biblioteca ?? [], [datos.biblioteca])
  const porId = useMemo(
    () => new Map(biblioteca.map((a) => [a.id, a])),
    [biblioteca],
  )

  const [titulo, setTitulo] = useState(programa?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(programa?.descripcion ?? '')
  const [apertura, setApertura] = useState<AperturaPrograma>(
    programa?.apertura ?? 'orden',
  )
  const [ritmo, setRitmo] = useState<RitmoPrograma>(programa?.ritmo ?? 'diario')
  const [ritmoDias, setRitmoDias] = useState(String(programa?.ritmoDias ?? 2))
  const [pasos, setPasos] = useState<string[]>(programa?.pasos ?? [])
  const [para, setPara] = useState<ParaPrograma>(programa?.para ?? 'personas')
  const [personas, setPersonas] = useState<string[]>([])
  const [eligiendo, setEligiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const datosPrograma = {
    titulo,
    descripcion,
    apertura,
    ritmo,
    ritmoDias: ritmo === 'dias' ? Number(ritmoDias) : null,
    pasos,
  }

  const mover = (indice: number, paso: -1 | 1) =>
    setPasos((p) => {
      const j = indice + paso
      if (j < 0 || j >= p.length) return p
      const nuevo = [...p]
      ;[nuevo[indice], nuevo[j]] = [nuevo[j], nuevo[indice]]
      return nuevo
    })

  const guardar = async () => {
    const fallos = validarPrograma(
      datosPrograma,
      programa?.estado === 'publicado',
    )
    if (fallos.length > 0) {
      setErrores(fallos)
      return
    }
    setGuardando(true)
    setErrores([])
    try {
      if (programa) {
        await actualizarPrograma(programa.id, datosPrograma)
        onCerrar({ mensaje: 'Cambios guardados.' })
        return
      }
      const id = await crearPrograma(datos.uid, datosPrograma, para)
      let mensaje = 'Programa creado en borrador. Publícalo cuando esté listo.'
      if (para === 'personas' && personas.length > 0) {
        const fallidos = await darPrograma(
          { id, profesionalUid: datos.uid, estado: 'borrador', pasos },
          personas,
        )
        if (fallidos.length > 0)
          mensaje = `Programa creado, pero no se pudo dar a ${fallidos.length === 1 ? '1 persona' : `${fallidos.length} personas`}. Añádelas desde el programa.`
      }
      onCerrar({ mensaje, creado: id })
    } catch {
      setErrores([
        'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.',
      ])
      setGuardando(false)
    }
  }

  const huecoPasos = LIMITES_PROGRAMA.pasos - pasos.length

  return (
    <Dialog
      open
      onClose={() => !guardando && onCerrar()}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="programa-titulo"
    >
      <DialogTitle id="programa-titulo">
        {esNuevo ? 'Crear programa' : 'Editar programa'}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        <TextField
          label="Nombre"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          helperText={`${titulo.length} de ${LIMITES_PROGRAMA.titulo}`}
          slotProps={{ htmlInput: { maxLength: LIMITES_PROGRAMA.titulo } }}
        />
        <TextField
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          multiline
          minRows={2}
          placeholder="Para qué es y cómo seguirlo (opcional)"
          helperText={`${descripcion.length} de ${LIMITES_PROGRAMA.descripcion}`}
          slotProps={{ htmlInput: { maxLength: LIMITES_PROGRAMA.descripcion } }}
        />

        <Box>
          <Typography
            id="programa-apertura"
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Cómo se abre
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={apertura}
            onChange={(_, valor: AperturaPrograma | null) =>
              valor && setApertura(valor)
            }
            aria-labelledby="programa-apertura"
            sx={botonesSeguidos}
          >
            {APERTURAS.map((a) => (
              <ToggleButton key={a.valor} value={a.valor}>
                {a.titulo}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {APERTURAS.find((a) => a.valor === apertura)?.texto}
          </Typography>
        </Box>

        <Box>
          <Typography
            id="programa-ritmo"
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Ritmo recomendado
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={ritmo}
            onChange={(_, valor: RitmoPrograma | null) =>
              valor && setRitmo(valor)
            }
            aria-labelledby="programa-ritmo"
            sx={botonesSeguidos}
          >
            {RITMOS.map((r) => (
              <ToggleButton key={r.valor} value={r.valor} aria-label={r.texto}>
                {r.boton}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {ritmo === 'dias' && (
            <TextField
              size="small"
              label="Cada cuántos días"
              type="number"
              value={ritmoDias}
              onChange={(e) => setRitmoDias(e.target.value)}
              sx={{ width: 170, mt: 1.5 }}
              slotProps={{
                htmlInput: { min: 1, max: LIMITES_PROGRAMA.ritmoDias },
              }}
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {apertura === 'calendario'
              ? 'Abre un paso con este ritmo.'
              : 'Se muestra como recomendación; no cierra nada.'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Audios, en orden (de Biblioteca)
          </Typography>
          {pasos.length > 0 && (
            <Box
              component="ol"
              aria-label="Pasos del programa, en orden"
              sx={{
                listStyle: 'none',
                m: 0,
                mb: 1,
                p: 0,
                display: 'grid',
                gap: 1,
              }}
            >
              {pasos.map((id, indice) => {
                const audio = porId.get(id)
                const nombre = audio?.titulo ?? 'Audio borrado de Biblioteca'
                return (
                  <Box
                    component="li"
                    key={id}
                    sx={{
                      ...cajaPaso,
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                      alignItems: 'center',
                      gap: 1,
                      pl: 2,
                      pr: 0.5,
                      py: 0.5,
                    }}
                  >
                    <Typography
                      color={audio ? 'text.primary' : 'text.secondary'}
                      noWrap
                    >
                      {indice + 1} · {nombre}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {audio ? formatTime(audio.duracionSegundos) : ''}
                    </Typography>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Subir">
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Subir «${nombre}»`}
                            disabled={indice === 0 || guardando}
                            onClick={() => mover(indice, -1)}
                          >
                            <ArrowUpwardRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Bajar">
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Bajar «${nombre}»`}
                            disabled={indice === pasos.length - 1 || guardando}
                            onClick={() => mover(indice, 1)}
                          >
                            <ArrowDownwardRounded fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Quitar del programa">
                        <IconButton
                          size="small"
                          aria-label={`Quitar «${nombre}» del programa`}
                          disabled={guardando}
                          onClick={() =>
                            setPasos((p) => p.filter((x) => x !== id))
                          }
                        >
                          <CloseRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
          <Tooltip
            title={
              huecoPasos <= 0
                ? `Un programa puede tener ${LIMITES_PROGRAMA.pasos} pasos como mucho.`
                : ''
            }
          >
            <span style={{ display: 'block' }}>
              <ButtonBase
                onClick={() => setEligiendo(true)}
                disabled={huecoPasos <= 0 || guardando || !datos.biblioteca}
                sx={{
                  ...cajaPaso,
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: 1,
                  px: 2,
                  py: 1.25,
                  color: 'text.secondary',
                  font: 'inherit',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&.Mui-disabled': { opacity: 0.5 },
                }}
              >
                <AddRounded fontSize="small" />
                Añadir audio de Biblioteca
              </ButtonBase>
            </span>
          </Tooltip>
          {pasos.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75 }}
            >
              Cada audio es un paso.
            </Typography>
          )}
        </Box>

        {esNuevo && (
          <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
            <Typography
              component="legend"
              sx={{ fontWeight: 600, mb: 1, p: 0 }}
            >
              ¿Para quién es?
            </Typography>
            <Box
              sx={(t) => ({
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: alpha(t.palette.primary.main, 0.03),
                px: 2,
                py: 1.5,
              })}
            >
              <RadioGroup
                value={para}
                onChange={(e) => setPara(e.target.value as ParaPrograma)}
              >
                <FormControlLabel
                  value="todos"
                  control={<Radio />}
                  label="Todos mis oyentes"
                />
                <FormControlLabel
                  value="personas"
                  control={<Radio />}
                  label="Personas concretas"
                />
              </RadioGroup>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, mb: para === 'personas' ? 1.5 : 0 }}
              >
                {para === 'todos'
                  ? 'Lo ven todos tus oyentes con vínculo activo, también los que lleguen después, cada uno desde el paso 1.'
                  : 'Solo las que elijas. Podrás añadir o quitar personas más adelante.'}
              </Typography>
              {para === 'personas' && datos.oyentes && (
                <SelectorPersonas
                  oyentes={datos.oyentes}
                  elegidos={personas}
                  onCambiar={setPersonas}
                  maximo={LIMITES_PROGRAMA.personas}
                  deshabilitado={guardando}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              «Para quién» no se puede cambiar después de crearlo.
            </Typography>
          </Box>
        )}

        {errores.length > 0 && (
          <Alert severity="error">
            {errores.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => onCerrar()} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          sx={{ borderRadius: 999, px: 3 }}
          onClick={() => void guardar()}
          disabled={guardando || !titulo.trim()}
          startIcon={
            guardando ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {esNuevo ? 'Crear en borrador' : 'Guardar cambios'}
        </Button>
      </DialogActions>

      {eligiendo && (
        <DialogoElegirAudios
          titulo="Añadir audios de Biblioteca"
          explicacion="Cada audio es un paso, en el orden en que los añadas. Luego puedes reordenarlos."
          audios={biblioteca}
          yaLoTiene={new Set(pasos)}
          varios
          accion="Añadir"
          onConfirmar={async (ids) => {
            if (ids.length > huecoPasos)
              return huecoPasos === 1
                ? `Solo cabe 1 paso más (como mucho ${LIMITES_PROGRAMA.pasos}).`
                : `Solo caben ${huecoPasos} pasos más (como mucho ${LIMITES_PROGRAMA.pasos}).`
            setPasos((p) => [...p, ...ids])
            return null
          }}
          onCerrar={() => setEligiendo(false)}
          textos={{
            finSinAudios: 'y podrás añadirlo a tus programas.',
            todosElegidos:
              'Ya están en el programa todos los audios de Biblioteca.',
            limite: `Puedes añadir ${LIMITES_BIBLIOTECA.enviosALaVez} audios de una vez.`,
          }}
        />
      )}
    </Dialog>
  )
}

export default DialogoPrograma
