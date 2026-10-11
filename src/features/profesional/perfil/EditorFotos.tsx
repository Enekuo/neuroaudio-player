import { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import CropRounded from '@mui/icons-material/CropRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import StarRounded from '@mui/icons-material/StarRounded'
import StarOutlineRounded from '@mui/icons-material/StarOutlineRounded'
import {
  LIMITES,
  MAX_FOTOS,
  type FotoPerfil,
} from '../../perfilProfesional/modelo'
import {
  reencuadrarFoto,
  subirFoto,
  urlFoto,
} from '../../perfilProfesional/fotos/fotoService'
import type { Encuadre } from '../../perfilProfesional/fotos/encuadre'
import {
  ErrorFoto,
  FORMATOS_FOTO,
  comprobarArchivoFoto,
} from '../../perfilProfesional/fotos/procesarFoto'
import { useFotoPerfil } from '../../perfilProfesional/fotos/useFotoPerfil'
import DialogoAjustarFoto from './DialogoAjustarFoto'

type EditorFotosProps = {
  uid: string
  fotos: FotoPerfil[]
  fotoPrincipalId: string | null
  onCambiar: (fotos: FotoPerfil[], fotoPrincipalId: string | null) => void
  /** Avisa de cada foto subida en esta edición (para borrarla si se descarta). */
  onSubida: (fotoId: string) => void
  /** Una foto se ha sustituido por otra (nuevo encuadre): actualizar referencias. */
  onReemplazar: (anteriorId: string, nuevaId: string) => void
}

type Subida = { clave: string; nombre: string }

/** Lo que se está ajustando en «Ajustar foto». */
type Ajuste =
  | { tipo: 'nueva'; archivo: File; src: string }
  | { tipo: 'existente'; foto: FotoPerfil; src: string }

/**
 * Vista de una foto en el editor: la principal, en círculo y con su
 * encuadre (versión cuadrada); el resto, con su proporción original.
 */
function Miniatura({
  uid,
  foto,
  principal,
}: {
  uid: string
  foto: FotoPerfil
  principal: boolean
}) {
  const url = useFotoPerfil(uid, foto.id, principal ? 'cuadrada' : 'miniatura')
  return (
    <Box
      sx={{
        aspectRatio: '1',
        bgcolor: 'action.hover',
        borderRadius: 1.5,
        overflow: 'hidden',
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
    </Box>
  )
}

/**
 * Fotos del perfil: subir, ordenar con las flechas, elegir la principal (con
 * su recorte circular en «Ajustar foto»), texto alternativo y borrar. Lo que
 * cambia aquí no llega a los oyentes hasta «Guardar cambios».
 */
function EditorFotos({
  uid,
  fotos,
  fotoPrincipalId,
  onCambiar,
  onSubida,
  onReemplazar,
}: EditorFotosProps) {
  const input = useRef<HTMLInputElement>(null)
  const [subidas, setSubidas] = useState<Subida[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [ajuste, setAjuste] = useState<Ajuste | null>(null)
  // Copia viva de las fotos para encadenar varias subidas sin perder ninguna.
  const actuales = useRef({ fotos, fotoPrincipalId })
  actuales.current = { fotos, fotoPrincipalId }

  const huecos =
    MAX_FOTOS -
    fotos.length -
    subidas.length -
    (ajuste?.tipo === 'nueva' ? 1 : 0)

  // La URL local del archivo elegido se libera al cerrar «Ajustar foto».
  useEffect(() => {
    if (ajuste?.tipo !== 'nueva') return
    return () => URL.revokeObjectURL(ajuste.src)
  }, [ajuste])

  const anotarError = (nombre: string, error: unknown) => {
    const motivo =
      error instanceof ErrorFoto
        ? error.message
        : 'No se pudo subir. Inténtalo de nuevo.'
    setErrores((e) => [...e, `${nombre}: ${motivo}`])
  }

  const elegirArchivos = async (lista: FileList | null) => {
    if (!lista || lista.length === 0) return
    const archivos = Array.from(lista)
    const nuevosErrores: string[] = []
    let aSubir = archivos.slice(0, Math.max(0, huecos))
    if (archivos.length > aSubir.length) {
      nuevosErrores.push(
        `Solo caben ${MAX_FOTOS} fotos (la principal y ${MAX_FOTOS - 1} más). Algunas no se han subido.`,
      )
    }
    setErrores(nuevosErrores)

    // Sin foto principal, la primera que valga pasa antes por «Ajustar foto»
    // (si se cancela, no se sube nada).
    if (!actuales.current.fotoPrincipalId && !ajuste) {
      let elegida = false
      for (const [indice, archivo] of aSubir.entries()) {
        try {
          await comprobarArchivoFoto(archivo)
        } catch (error) {
          anotarError(archivo.name, error)
          continue
        }
        setAjuste({ tipo: 'nueva', archivo, src: URL.createObjectURL(archivo) })
        // Las anteriores ya se han descartado por no ser válidas: el resto
        // del lote se sube como fotos adicionales.
        aSubir = aSubir.slice(indice + 1)
        elegida = true
        break
      }
      // Ninguna valía: sus errores ya están anotados, no se reintentan.
      if (!elegida) aSubir = []
    }

    const pendientes = aSubir.map((archivo, i) => ({
      archivo,
      clave: `${Date.now()}-${i}`,
    }))
    setSubidas((s) => [
      ...s,
      ...pendientes.map((p) => ({ clave: p.clave, nombre: p.archivo.name })),
    ])

    // Una a una: cada foto pasa por el límite de subidas por minuto.
    for (const { archivo, clave } of pendientes) {
      try {
        const foto = await subirFoto(uid, archivo)
        onSubida(foto.id)
        const { fotos: ahora, fotoPrincipalId: principal } = actuales.current
        onCambiar([...ahora, foto], principal)
      } catch (error) {
        anotarError(archivo.name, error)
      } finally {
        setSubidas((s) => s.filter((x) => x.clave !== clave))
      }
    }
  }

  /** Abre «Ajustar foto» con la versión normal de una foto ya subida. */
  const ajustarExistente = async (foto: FotoPerfil) => {
    try {
      const src = await urlFoto(uid, foto.id, 'normal')
      setAjuste({ tipo: 'existente', foto, src })
    } catch {
      setErrores((e) => [
        ...e,
        'No se pudo abrir la foto para ajustarla. Inténtalo de nuevo.',
      ])
    }
  }

  const guardarAjuste = async (encuadre: Encuadre) => {
    if (!ajuste) return
    if (ajuste.tipo === 'nueva') {
      const foto = await subirFoto(uid, ajuste.archivo, encuadre)
      onSubida(foto.id)
      onCambiar([...actuales.current.fotos, foto], foto.id)
    } else {
      const nueva = await reencuadrarFoto(uid, ajuste.foto, encuadre)
      onSubida(nueva.id)
      const ahora = actuales.current.fotos
      onCambiar(
        ahora.map((f) => (f.id === ajuste.foto.id ? nueva : f)),
        nueva.id,
      )
      onReemplazar(ajuste.foto.id, nueva.id)
    }
    setAjuste(null)
  }

  const mover = (indice: number, paso: -1 | 1) => {
    const destino = indice + paso
    if (destino < 0 || destino >= fotos.length) return
    const copia = [...fotos]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    onCambiar(copia, fotoPrincipalId)
  }

  // Si se quita la principal, no se elige otra sola: la nueva principal
  // siempre pasa por «Ajustar foto».
  const borrar = (id: string) =>
    onCambiar(
      fotos.filter((f) => f.id !== id),
      fotoPrincipalId === id ? null : fotoPrincipalId,
    )

  const cambiarAlt = (id: string, alt: string) =>
    onCambiar(
      fotos.map((f) => (f.id === id ? { ...f, alt } : f)),
      fotoPrincipalId,
    )

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flex: 1, minWidth: 220 }}
        >
          La foto principal es la que ven tus oyentes en su inicio, junto a sus
          audios y en las listas, recortada en círculo. JPG, PNG o WebP de hasta
          5 MB.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {fotos.length} de {MAX_FOTOS}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddPhotoAlternateOutlined />}
          onClick={() => input.current?.click()}
          disabled={huecos <= 0}
        >
          Subir fotos
        </Button>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={FORMATOS_FOTO.join(',')}
          onChange={(e) => {
            void elegirArchivos(e.target.files)
            e.target.value = ''
          }}
        />
      </Box>

      {errores.length > 0 && (
        <Alert severity="warning" onClose={() => setErrores([])} sx={{ mb: 2 }}>
          {errores.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </Alert>
      )}

      {fotos.length > 0 && !fotoPrincipalId && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          Elige tu foto principal con la estrella. Sin ella, tus oyentes verán
          tus iniciales.
        </Alert>
      )}

      {fotos.length === 0 && subidas.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            py: 4,
            px: 2,
            textAlign: 'center',
            borderStyle: 'dashed',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">
            Aún no has subido fotos. Sin foto principal, tus oyentes verán tus
            iniciales.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(auto-fill, minmax(168px, 1fr))',
            },
          }}
        >
          {fotos.map((foto, indice) => {
            const esPrincipal = foto.id === fotoPrincipalId
            return (
              <Paper
                key={foto.id}
                variant="outlined"
                sx={{
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  borderColor: esPrincipal ? 'primary.main' : undefined,
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Miniatura uid={uid} foto={foto} principal={esPrincipal} />
                  {esPrincipal && (
                    <Chip
                      label="Principal"
                      size="small"
                      color="primary"
                      sx={{ position: 'absolute', top: 6, left: 6 }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {esPrincipal ? (
                    <Tooltip title="Ajustar encuadre">
                      <IconButton
                        size="small"
                        color="primary"
                        aria-label="Ajustar el encuadre de la foto principal"
                        onClick={() => void ajustarExistente(foto)}
                      >
                        <CropRounded />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Usar como principal">
                      <IconButton
                        size="small"
                        aria-label="Usar como foto principal"
                        onClick={() => void ajustarExistente(foto)}
                      >
                        <StarOutlineRounded />
                      </IconButton>
                    </Tooltip>
                  )}
                  {esPrincipal && (
                    <StarRounded
                      color="primary"
                      fontSize="small"
                      titleAccess="Es la foto principal"
                      sx={{ ml: 0.5 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }} />
                  <IconButton
                    size="small"
                    aria-label="Mover antes"
                    disabled={indice === 0}
                    onClick={() => mover(indice, -1)}
                  >
                    <ChevronLeftRounded />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Mover después"
                    disabled={indice === fotos.length - 1}
                    onClick={() => mover(indice, 1)}
                  >
                    <ChevronRightRounded />
                  </IconButton>
                  <Tooltip title="Quitar foto">
                    <IconButton
                      size="small"
                      aria-label="Quitar foto"
                      onClick={() => borrar(foto.id)}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  size="small"
                  label="Texto alternativo"
                  placeholder="Opcional"
                  value={foto.alt}
                  onChange={(e) => cambiarAlt(foto.id, e.target.value)}
                  slotProps={{ htmlInput: { maxLength: LIMITES.altFoto } }}
                />
              </Paper>
            )
          })}

          {subidas.map((subida) => (
            <Paper
              key={subida.clave}
              variant="outlined"
              sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              <Box
                sx={{
                  aspectRatio: '1',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: 1.5,
                }}
              >
                <CircularProgress size={28} aria-label="Subiendo foto" />
              </Box>
              <Typography variant="caption" color="text.secondary" noWrap>
                Subiendo {subida.nombre}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {ajuste && (
        <DialogoAjustarFoto
          key={ajuste.src}
          src={ajuste.src}
          encuadreGuardado={
            ajuste.tipo === 'existente' ? ajuste.foto.encuadre : undefined
          }
          onCancelar={() => setAjuste(null)}
          onGuardar={guardarAjuste}
        />
      )}
    </Box>
  )
}

export default EditorFotos
