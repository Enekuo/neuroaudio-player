import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import {
  LIMITES,
  type FotoPerfil,
  type SeccionPerfil,
} from '../../perfilProfesional/modelo'
import { useFotoPerfil } from '../../perfilProfesional/fotos/useFotoPerfil'
import { PLANTILLAS_SECCION, ayudaDeSeccion } from './plantillas'

type EditorSeccionesProps = {
  uid: string
  secciones: SeccionPerfil[]
  fotos: FotoPerfil[]
  onCambiar: (secciones: SeccionPerfil[]) => void
}

function FotoElegible({
  uid,
  foto,
  elegida,
  onAlternar,
}: {
  uid: string
  foto: FotoPerfil
  elegida: boolean
  onAlternar: () => void
}) {
  const url = useFotoPerfil(uid, foto.id, 'miniatura')
  return (
    <Box
      component="label"
      sx={{
        position: 'relative',
        width: 72,
        height: 72,
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: 'pointer',
        bgcolor: 'action.hover',
        outline: elegida ? '2px solid' : '1px solid',
        outlineColor: elegida ? 'primary.main' : 'divider',
        outlineOffset: elegida ? 1 : 0,
      }}
    >
      {url && (
        <Box
          component="img"
          src={url}
          alt={foto.alt}
          draggable={false}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      )}
      <Checkbox
        size="small"
        checked={elegida}
        onChange={onAlternar}
        slotProps={{ input: { 'aria-label': foto.alt || 'Foto del perfil' } }}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          p: 0.25,
          bgcolor: 'rgba(255,255,255,0.85)',
          borderRadius: '0 0 0 8px',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
        }}
      />
    </Box>
  )
}

function nuevoId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

/**
 * Secciones (las «páginas» del perfil): título, texto plano y fotos del
 * propio perfil. Se reordenan con las flechas, se ocultan o se borran.
 */
function EditorSecciones({
  uid,
  secciones,
  fotos,
  onCambiar,
}: EditorSeccionesProps) {
  const titulosUsados = new Set(secciones.map((s) => s.titulo.trim()))
  const plantillasLibres = PLANTILLAS_SECCION.filter(
    (p) => !titulosUsados.has(p.titulo),
  )
  const lleno = secciones.length >= LIMITES.secciones

  const anadir = (titulo: string) =>
    onCambiar([
      ...secciones,
      { id: nuevoId(), titulo, texto: '', fotoIds: [], visible: true },
    ])

  const cambiar = (id: string, cambios: Partial<SeccionPerfil>) =>
    onCambiar(secciones.map((s) => (s.id === id ? { ...s, ...cambios } : s)))

  const mover = (indice: number, paso: -1 | 1) => {
    const destino = indice + paso
    if (destino < 0 || destino >= secciones.length) return
    const copia = [...secciones]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    onCambiar(copia)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {secciones.map((seccion, indice) => (
        <Paper
          key={seccion.id}
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: seccion.visible ? undefined : 'action.hover',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'flex-start' },
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            <TextField
              label="Título de la sección"
              value={seccion.titulo}
              onChange={(e) => cambiar(seccion.id, { titulo: e.target.value })}
              fullWidth
              slotProps={{ htmlInput: { maxLength: LIMITES.tituloSeccion } }}
            />
            <Box
              sx={{
                display: 'flex',
                flexShrink: 0,
                pt: { sm: 1 },
                justifyContent: 'flex-end',
              }}
            >
              <IconButton
                size="small"
                aria-label="Subir sección"
                disabled={indice === 0}
                onClick={() => mover(indice, -1)}
              >
                <ArrowUpwardRounded />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Bajar sección"
                disabled={indice === secciones.length - 1}
                onClick={() => mover(indice, 1)}
              >
                <ArrowDownwardRounded />
              </IconButton>
              <Tooltip
                title={
                  seccion.visible
                    ? 'Ocultar a tus oyentes'
                    : 'Mostrar a tus oyentes'
                }
              >
                <IconButton
                  size="small"
                  aria-label={
                    seccion.visible ? 'Ocultar sección' : 'Mostrar sección'
                  }
                  aria-pressed={!seccion.visible}
                  onClick={() =>
                    cambiar(seccion.id, { visible: !seccion.visible })
                  }
                >
                  {seccion.visible ? (
                    <VisibilityOutlined />
                  ) : (
                    <VisibilityOffOutlined />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Borrar sección">
                <IconButton
                  size="small"
                  aria-label="Borrar sección"
                  onClick={() =>
                    onCambiar(secciones.filter((s) => s.id !== seccion.id))
                  }
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {!seccion.visible && (
            <Chip
              label="Oculta: tus oyentes no la ven"
              size="small"
              icon={<VisibilityOffOutlined />}
              sx={{ alignSelf: 'flex-start' }}
            />
          )}

          <TextField
            label="Texto"
            value={seccion.texto}
            onChange={(e) => cambiar(seccion.id, { texto: e.target.value })}
            placeholder={ayudaDeSeccion(seccion.titulo)}
            multiline
            minRows={4}
            fullWidth
            helperText="Texto sencillo: los saltos de línea se respetan."
            slotProps={{ htmlInput: { maxLength: LIMITES.textoSeccion } }}
          />

          {fotos.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Fotos de esta sección (opcional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                {fotos.map((foto) => {
                  const elegida = seccion.fotoIds.includes(foto.id)
                  return (
                    <FotoElegible
                      key={foto.id}
                      uid={uid}
                      foto={foto}
                      elegida={elegida}
                      onAlternar={() =>
                        cambiar(seccion.id, {
                          fotoIds: elegida
                            ? seccion.fotoIds.filter((id) => id !== foto.id)
                            : [...seccion.fotoIds, foto.id],
                        })
                      }
                    />
                  )
                })}
              </Box>
            </Box>
          )}
        </Paper>
      ))}

      <Box>
        {secciones.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Las secciones son las páginas de tu perfil. Puedes empezar con una
            de estas o crear la tuya.
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {plantillasLibres.map((plantilla) => (
            <Chip
              key={plantilla.titulo}
              label={plantilla.titulo}
              icon={<AddRounded />}
              variant="outlined"
              onClick={() => anadir(plantilla.titulo)}
              disabled={lleno}
            />
          ))}
          <Button
            size="small"
            startIcon={<AddRounded />}
            onClick={() => anadir('')}
            disabled={lleno}
          >
            Sección en blanco
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default EditorSecciones
