import type { ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import EditOutlined from '@mui/icons-material/EditOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import {
  OPCIONES_RESPUESTA,
  REDES,
  type FotoPerfil,
  type PerfilProfesional,
} from '../../perfilProfesional/modelo'
import { useFotoPerfil } from '../../perfilProfesional/fotos/useFotoPerfil'
import { animacionEntrada } from '../theme/movimiento'
import AvatarPanel from './AvatarPanel'
import { ICONO_RED, ETIQUETA_RED } from './redes'

type ResumenPerfilProps = {
  uid: string
  perfil: PerfilProfesional
  onEditar: () => void
  onVistaPrevia: () => void
}

const textoPlanoSx = {
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere',
} as const

function FotoResumen({
  uid,
  foto,
  principal,
}: {
  uid: string
  foto: FotoPerfil
  principal: boolean
}) {
  // La principal se ve en círculo con su encuadre; el resto, con su
  // proporción original (sin recortar ni deformar).
  const url = useFotoPerfil(uid, foto.id, principal ? 'cuadrada' : 'miniatura')
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '1',
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {url && (
        <Box
          component="img"
          src={url}
          alt={foto.alt}
          draggable={false}
          sx={
            principal
              ? {
                  width: '82%',
                  height: '82%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }
              : {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }
          }
        />
      )}
      {principal && (
        <Chip
          label="Principal"
          size="small"
          color="primary"
          sx={{ position: 'absolute', top: 6, left: 6 }}
        />
      )}
    </Box>
  )
}

function Tarjeta({
  titulo,
  extra,
  retardo,
  children,
}: {
  titulo: string
  extra?: ReactNode
  retardo: number
  children: ReactNode
}) {
  return (
    <Paper
      variant="outlined"
      sx={[
        { p: { xs: 2.5, sm: 3 } },
        animacionEntrada({ retardo, distancia: 10 }),
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography
          component="h2"
          sx={{ fontSize: 16, fontWeight: 500, overflowWrap: 'anywhere' }}
        >
          {titulo}
        </Typography>
        {extra}
      </Box>
      {children}
    </Paper>
  )
}

/** Lo que aún falta para que el perfil esté completo. */
function pendientes(perfil: PerfilProfesional) {
  const faltan: string[] = []
  if (!perfil.fotoPrincipalId) faltan.push('una foto principal')
  if (!perfil.nombre.trim()) faltan.push('tu nombre')
  if (!perfil.frase.trim()) faltan.push('una frase corta')
  if (!perfil.secciones.some((s) => s.visible && s.texto.trim())) {
    faltan.push('alguna sección (por ejemplo «Acerca de mí»)')
  }
  if (!perfil.bienvenida.trim()) faltan.push('un mensaje de bienvenida')
  return faltan
}

/**
 * Vista normal de la página Perfil: cabecera con la foto principal, el nombre,
 * la frase y los enlaces, los botones «Editar perfil» y «Vista previa», y
 * debajo una tarjeta por bloque (fotos, secciones, bienvenida).
 */
function ResumenPerfil({
  uid,
  perfil,
  onEditar,
  onVistaPrevia,
}: ResumenPerfilProps) {
  const enlaces = REDES.filter((red) => perfil.enlaces[red])
  const respuesta = OPCIONES_RESPUESTA.find((o) => o.valor === perfil.respuesta)
  const faltan = pendientes(perfil)
  let retardo = 60

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 3 },
          }}
        >
          <AvatarPanel
            uid={uid}
            nombre={perfil.nombre}
            fotos={perfil.fotos}
            fotoPrincipalId={perfil.fotoPrincipalId}
            tamano={112}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 24, sm: 28 },
                fontWeight: 400,
                lineHeight: 1.25,
                overflowWrap: 'anywhere',
              }}
            >
              {perfil.nombre || 'Tu nombre'}
            </Typography>
            {perfil.frase && (
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75, ...textoPlanoSx }}
              >
                {perfil.frase}
              </Typography>
            )}
            {(enlaces.length > 0 || respuesta) && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {enlaces.map((red) => (
                  <Chip
                    key={red}
                    component="a"
                    href={perfil.enlaces[red]}
                    target="_blank"
                    rel="noopener nofollow"
                    clickable
                    variant="outlined"
                    icon={ICONO_RED[red]}
                    label={ETIQUETA_RED[red]}
                  />
                ))}
                {respuesta && (
                  <Chip
                    icon={<ScheduleOutlined />}
                    label={`Suelo responder ${respuesta.etiqueta.toLowerCase()}`}
                    sx={{ bgcolor: 'action.hover' }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<EditOutlined />}
            onClick={onEditar}
          >
            Editar perfil
          </Button>
          <Button
            variant="outlined"
            startIcon={<VisibilityOutlined />}
            onClick={onVistaPrevia}
          >
            Vista previa: así te ve un oyente
          </Button>
        </Box>
      </Paper>

      {faltan.length > 0 && (
        <Alert
          severity="info"
          variant="outlined"
          sx={animacionEntrada({ retardo: 40 })}
        >
          Para que tus oyentes te conozcan mejor, te falta añadir{' '}
          {faltan.join(', ')}.
        </Alert>
      )}

      {perfil.dedicacion.trim() && (
        <Tarjeta titulo="A qué me dedico" retardo={(retardo += 50)}>
          <Typography color="text.secondary" sx={textoPlanoSx}>
            {perfil.dedicacion}
          </Typography>
        </Tarjeta>
      )}

      {perfil.fotos.length > 0 && (
        <Tarjeta titulo="Fotos" retardo={(retardo += 50)}>
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            }}
          >
            {perfil.fotos.map((foto) => (
              <FotoResumen
                key={foto.id}
                uid={uid}
                foto={foto}
                principal={foto.id === perfil.fotoPrincipalId}
              />
            ))}
          </Box>
        </Tarjeta>
      )}

      {perfil.secciones.map((seccion) => (
        <Tarjeta
          key={seccion.id}
          titulo={seccion.titulo.trim() || 'Sección sin título'}
          retardo={(retardo += 50)}
          extra={
            !seccion.visible && (
              <Chip
                size="small"
                icon={<VisibilityOffOutlined />}
                label="Oculta"
              />
            )
          }
        >
          {seccion.texto.trim() ? (
            <Typography color="text.secondary" sx={textoPlanoSx}>
              {seccion.texto}
            </Typography>
          ) : (
            <Typography color="text.disabled">Sin texto todavía.</Typography>
          )}
        </Tarjeta>
      ))}

      {perfil.bienvenida.trim() && (
        <Tarjeta titulo="Mensaje de bienvenida" retardo={(retardo += 50)}>
          <Typography color="text.secondary" sx={textoPlanoSx}>
            {perfil.bienvenida}
          </Typography>
        </Tarjeta>
      )}
    </Box>
  )
}

export default ResumenPerfil
