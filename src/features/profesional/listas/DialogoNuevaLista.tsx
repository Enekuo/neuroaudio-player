import { useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import { LIST_TEMPLATES } from '../../library/data/plantillasListas'
import {
  huecoListaPropia,
  type ListaProfesional,
} from '../../listasProfesional/modelo'
import { estiloPortadaLista } from '../../listasProfesional/vista/imagenLista'

type DialogoNuevaListaProps = {
  uid: string
  listas: ListaProfesional[]
  onCerrar: () => void
  /** Ruta del editor elegida. */
  onElegir: (destino: string) => void
}

/**
 * «Nueva lista»: dos caminos. Desde una lista ya hecha (una de las 8 de la
 * app, con su nombre e imagen fijos; cada una se usa una vez) o desde cero.
 */
function DialogoNuevaLista({
  uid,
  listas,
  onCerrar,
  onElegir,
}: DialogoNuevaListaProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const [paso, setPaso] = useState<'inicio' | 'plantillas'>('inicio')
  const usadas = new Map(
    listas.filter((l) => l.plantillaId).map((l) => [l.plantillaId, l.id]),
  )
  const hayHuecoPropio = huecoListaPropia(uid, listas) !== null

  return (
    <Dialog
      open
      onClose={onCerrar}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="nueva-lista-titulo"
    >
      <DialogTitle id="nueva-lista-titulo">
        {paso === 'inicio' ? 'Nueva lista' : 'Elige una lista ya hecha'}
      </DialogTitle>
      <DialogContent>
        {paso === 'inicio' ? (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Opcion
              icono={<AutoAwesomeOutlined />}
              titulo="Empezar desde una lista ya hecha"
              texto="Con el nombre y la imagen de una de las listas de NeuroAudio. Solo tienes que añadir tus audios."
              onClick={() => setPaso('plantillas')}
            />
            <Opcion
              icono={<EditOutlined />}
              titulo="Crear desde cero"
              texto="Con tu propio nombre e imagen."
              disabled={!hayHuecoPropio}
              onClick={() => onElegir('/profesional/listas/nueva')}
            />
            {!hayHuecoPropio && (
              <Alert severity="info">
                Has llegado al máximo de listas propias. Borra alguna para crear
                otra.
              </Alert>
            )}
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              El nombre y la imagen son los de la lista. Cada una se puede usar
              una vez; las que ya has creado se abren para editarlas.
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 1.5,
              }}
            >
              {LIST_TEMPLATES.map((plantilla) => {
                const existente = usadas.get(plantilla.id)
                return (
                  <ButtonBase
                    key={plantilla.id}
                    focusRipple
                    onClick={() =>
                      onElegir(
                        existente
                          ? `/profesional/listas/${existente}`
                          : `/profesional/listas/nueva?plantilla=${plantilla.id}`,
                      )
                    }
                    sx={{
                      display: 'block',
                      textAlign: 'left',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      aria-hidden="true"
                      sx={{ width: '100%', aspectRatio: '1' }}
                      style={estiloPortadaLista(plantilla.id, null)}
                    />
                    <Box sx={{ px: 1.25, py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {plantilla.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {existente ? 'Ya creada · Editar' : 'Usar esta lista'}
                      </Typography>
                    </Box>
                  </ButtonBase>
                )
              })}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {paso === 'plantillas' && (
          <Button onClick={() => setPaso('inicio')}>Atrás</Button>
        )}
        <Button onClick={onCerrar}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  )
}

function Opcion({
  icono,
  titulo,
  texto,
  disabled,
  onClick,
}: {
  icono: ReactNode
  titulo: string
  texto: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <ButtonBase
      focusRipple
      disabled={disabled}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        textAlign: 'left',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 160ms ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.light',
          color: 'primary.main',
        }}
      >
        {icono}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500 }}>{titulo}</Typography>
        <Typography variant="body2" color="text.secondary">
          {texto}
        </Typography>
      </Box>
      <ChevronRightRounded sx={{ color: 'text.secondary' }} />
    </ButtonBase>
  )
}

export default DialogoNuevaLista
