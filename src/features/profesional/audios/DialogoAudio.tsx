import { useEffect, useRef, useState, type DragEvent } from 'react'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import {
  ACEPTAR_AUDIO,
  ErrorAudio,
  tituloDesdeArchivo,
} from '../../audiosProfesional/archivoAudio'
import {
  actualizarAudio,
  borrarArchivoAudio,
  borrarPortadaAudio,
  crearAudio,
  nuevoIdAudio,
  subirAudio,
  subirPortadaAudio,
  urlAudio,
  type AudioSubido,
  type DatosAudio,
  type SubidaAudio,
} from '../../audiosProfesional/audioProfesionalService'
import {
  LIMITES_AUDIO,
  MAX_TAMANO_AUDIO,
  LIMITES_BIBLIOTECA,
  normalizarEtiqueta,
  normalizarEtiquetas,
  type AudioProfesional,
  type EstadoAudio,
  type TipoPortadaAudio,
} from '../../audiosProfesional/modelo'
import PortadaAudio from '../../audiosProfesional/PortadaAudio'
import type { Encuadre } from '../../perfilProfesional/fotos/encuadre'
import { ErrorFoto } from '../../perfilProfesional/fotos/procesarFoto'
import DialogoAjustarFoto from '../perfil/DialogoAjustarFoto'
import {
  etiquetaOyente,
  type OyenteDelProfesional,
} from '../../perfilProfesional/modelo'

type DialogoAudioProps = {
  uid: string
  /** Audio a editar; sin él, es un audio nuevo. */
  audio?: AudioProfesional
  /** Orden para un audio nuevo (va el primero de la lista). */
  ordenNuevo: number
  onCerrar: (mensaje?: string) => void
  /**
   * «Para una persona»: los oyentes del profesional. Un audio nuevo se
   * dirige a uno con vínculo activo (se elige primero); el de un audio ya
   * creado se muestra, pero no se puede cambiar. Con `destinatarioFijo`
   * (desde la ficha de esa persona), el nuevo ya va para ella.
   */
  personal?: { oyentes: OyenteDelProfesional[]; destinatarioFijo?: string }
  /**
   * «Mis audios»: el audio va a la biblioteca privada del profesional (sin
   * persona ni estado: nadie lo ve hasta que lo envía), con etiquetas por
   * tema. `sugerencias`: las etiquetas que ya usa, para proponerlas.
   */
  biblioteca?: { sugerencias: string[] }
  /** Foto principal del profesional (para la portada «Foto del profesional»). */
  fotoPrincipalId?: string | null
}

type EstadoSubida =
  | { fase: 'sin-archivo' }
  | { fase: 'subiendo'; nombre: string; progreso: number }
  | { fase: 'subido'; nombre: string; subido: AudioSubido }
  | { fase: 'error'; mensaje: string }

const MB = Math.round(MAX_TAMANO_AUDIO / (1024 * 1024))

/**
 * Subir o editar un audio (general; con `personal`, para una persona; con
 * `biblioteca`, para «Mis audios»). Al elegir el archivo se comprueba (tipo
 * real y tamaño) y empieza a subirse enseguida, con barra de progreso y
 * opción de cancelar; mientras, se rellena el formulario y se puede escuchar
 * en la vista previa. Si se cierra sin guardar, el archivo subido se borra.
 */
function DialogoAudio({
  uid,
  audio,
  ordenNuevo,
  onCerrar,
  personal,
  biblioteca,
  fotoPrincipalId = null,
}: DialogoAudioProps) {
  const enBiblioteca = Boolean(biblioteca)
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const esNuevo = !audio
  const input = useRef<HTMLInputElement>(null)
  const subidaActual = useRef<SubidaAudio | null>(null)
  const guardado = useRef(false)

  const [subida, setSubida] = useState<EstadoSubida>({ fase: 'sin-archivo' })
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [cargandoVistaPrevia, setCargandoVistaPrevia] = useState(!esNuevo)
  const [arrastrando, setArrastrando] = useState(false)
  const [titulo, setTitulo] = useState(audio?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(audio?.descripcion ?? '')
  const [contieneSalud, setContieneSalud] = useState(
    audio?.contieneSalud ?? false,
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Id del audio: el suyo o, si es nuevo, uno pedido ya (su portada se sube
  // a una ruta con ese id antes de guardar).
  const [audioId] = useState(() => audio?.id ?? nuevoIdAudio())

  // Portada que elige el profesional. Las imágenes subidas en este diálogo y
  // aún sin guardar se borran al guardar otra, al cerrar o al salir.
  const [portada, setPortada] = useState<TipoPortadaAudio>(
    audio?.portada ?? 'defecto',
  )
  const [portadaImagen, setPortadaImagen] = useState<string | null>(
    audio?.portadaImagen ?? null,
  )
  const [vistaPortada, setVistaPortada] = useState<string | null>(null)
  const [ajuste, setAjuste] = useState<{ src: string; file: File } | null>(null)
  const pendientes = useRef(new Set<string>())
  const inputImagen = useRef<HTMLInputElement>(null)

  const [etiquetas, setEtiquetas] = useState<string[]>(audio?.etiquetas ?? [])
  // Lo que se está escribiendo: se vacía al añadir (también si se repite).
  const [textoEtiqueta, setTextoEtiqueta] = useState('')

  const [destinatarioUid, setDestinatarioUid] = useState(
    audio?.destinatarioUid ?? personal?.destinatarioFijo ?? '',
  )

  // Para una persona: a quién (solo se elige al crear, entre los activos).
  const activos = (personal?.oyentes ?? []).filter((o) => o.estado === 'activo')
  const destinatario = personal?.oyentes.find(
    (o) => o.oyenteUid === destinatarioUid,
  )
  const nombreDestinatario = destinatarioUid
    ? etiquetaOyente(destinatario ?? { oyenteUid: destinatarioUid, nombre: '' })
    : ''

  // Vista previa de un audio existente: se descarga de forma privada.
  useEffect(() => {
    if (!audio) return
    let vigente = true
    urlAudio(audio.archivo)
      .then((url) => vigente && setVistaPrevia(url))
      .catch(
        () =>
          vigente && setError('No se pudo cargar el audio para escucharlo.'),
      )
      .finally(() => vigente && setCargandoVistaPrevia(false))
    return () => {
      vigente = false
    }
  }, [audio])

  // La vista previa de un archivo nuevo es una URL local: se libera al cerrar.
  useEffect(() => {
    if (!esNuevo || !vistaPrevia) return
    return () => URL.revokeObjectURL(vistaPrevia)
  }, [esNuevo, vistaPrevia])

  // Si el diálogo se desmonta sin guardar: cancelar la subida o borrar el
  // archivo, y borrar las imágenes de portada subidas aquí.
  useEffect(() => {
    const subidas = pendientes.current
    return () => {
      if (guardado.current) return
      subidaActual.current?.cancelar()
      subidaActual.current?.promesa
        .then((s) => borrarArchivoAudio(s.archivo))
        .catch(() => {})
      subidas.forEach(
        (id) =>
          void borrarPortadaAudio(uid, audioId, id, enBiblioteca).catch(
            () => {},
          ),
      )
    }
  }, [uid, audioId, enBiblioteca])

  useEffect(
    () => () => {
      if (vistaPortada) URL.revokeObjectURL(vistaPortada)
    },
    [vistaPortada],
  )

  const elegirImagen = (archivo: File | undefined) => {
    if (!archivo) return
    setAjuste({ src: URL.createObjectURL(archivo), file: archivo })
  }

  const cerrarAjuste = () => {
    if (ajuste) URL.revokeObjectURL(ajuste.src)
    setAjuste(null)
  }

  const guardarAjuste = async (encuadre: Encuadre) => {
    if (!ajuste) return
    try {
      const { imagenId, imagen } = await subirPortadaAudio(
        uid,
        audioId,
        ajuste.file,
        encuadre,
        enBiblioteca,
      )
      pendientes.current.add(imagenId)
      setPortadaImagen(imagenId)
      setVistaPortada(URL.createObjectURL(imagen))
      setPortada('propia')
      cerrarAjuste()
    } catch (e) {
      throw e instanceof ErrorFoto
        ? e
        : new ErrorFoto('No se pudo subir la imagen. Inténtalo de nuevo.')
    }
  }

  const elegir = (archivo: File | undefined) => {
    if (!archivo) return
    setError(null)
    setVistaPrevia(URL.createObjectURL(archivo))
    setSubida({ fase: 'subiendo', nombre: archivo.name, progreso: 0 })

    const nueva = subirAudio(
      uid,
      archivo,
      (progreso) =>
        setSubida((s) => (s.fase === 'subiendo' ? { ...s, progreso } : s)),
      audioId,
      enBiblioteca,
    )
    subidaActual.current = nueva
    nueva.promesa
      .then((subido) => {
        setSubida({ fase: 'subido', nombre: archivo.name, subido })
        // Título sugerido a partir del nombre, solo si el archivo era válido
        // y aún no se ha escrito ninguno.
        setTitulo((t) => (t.trim() ? t : tituloDesdeArchivo(archivo.name)))
      })
      .catch((e) => {
        subidaActual.current = null
        setVistaPrevia(null)
        setSubida({
          fase: 'error',
          mensaje:
            e instanceof ErrorAudio
              ? e.message
              : 'No se pudo subir el audio. Inténtalo de nuevo.',
        })
      })
  }

  const cancelarSubida = () => {
    subidaActual.current?.cancelar()
  }

  const alSoltar = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault()
    setArrastrando(false)
    elegir(evento.dataTransfer.files[0])
  }

  const tituloValido = titulo.trim().length > 0
  const listoParaGuardar =
    tituloValido &&
    !guardando &&
    (esNuevo ? subida.fase === 'subido' : true) &&
    (!personal || !esNuevo || Boolean(destinatarioUid)) &&
    (portada !== 'propia' || Boolean(portadaImagen))

  const guardar = async (estado: EstadoAudio) => {
    if (!listoParaGuardar) return
    setGuardando(true)
    setError(null)
    const datos: DatosAudio = {
      titulo,
      descripcion,
      contieneSalud,
      estado,
      portada,
      portadaImagen: portada === 'propia' ? portadaImagen : null,
      ...(enBiblioteca ? { etiquetas: normalizarEtiquetas(etiquetas) } : {}),
    }
    try {
      if (esNuevo && subida.fase === 'subido') {
        await crearAudio(
          uid,
          subida.subido,
          datos,
          ordenNuevo,
          personal ? destinatarioUid : null,
          enBiblioteca,
        )
      } else if (audio) {
        await actualizarAudio(audio.id, datos)
      }
      guardado.current = true
      // Guardado: fuera las imágenes de portada que ya no usa.
      const enUso = datos.portadaImagen
      const sobrantes = [...pendientes.current].filter((id) => id !== enUso)
      if (audio?.portadaImagen && audio.portadaImagen !== enUso) {
        sobrantes.push(audio.portadaImagen)
      }
      sobrantes.forEach(
        (id) =>
          void borrarPortadaAudio(uid, audioId, id, enBiblioteca).catch(
            () => {},
          ),
      )
      onCerrar(
        enBiblioteca
          ? esNuevo
            ? 'Guardado en Mis audios. Nadie lo ve hasta que lo envíes.'
            : 'Cambios guardados.'
          : personal
            ? estado === 'publicado'
              ? `Audio publicado. Ya lo ve ${nombreDestinatario}.`
              : `Guardado como borrador. ${nombreDestinatario} no lo ve.`
            : estado === 'publicado'
              ? 'Audio publicado. Ya lo ven tus oyentes con acceso.'
              : 'Guardado como borrador. Tus oyentes no lo ven.',
      )
    } catch {
      setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
      setGuardando(false)
    }
  }

  const cerrar = () => {
    if (!guardando) onCerrar()
  }

  const publicadoAhora = audio?.estado === 'publicado'

  return (
    <Dialog
      open
      onClose={cerrar}
      fullScreen={pantallaCompleta}
      maxWidth="sm"
      fullWidth
      aria-labelledby="dialogo-audio-titulo"
    >
      <DialogTitle id="dialogo-audio-titulo">
        {esNuevo
          ? enBiblioteca
            ? 'Subir a Mis audios'
            : personal
              ? 'Subir audio para una persona'
              : 'Subir audio'
          : 'Editar audio'}
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      >
        {personal &&
          (esNuevo && !personal.destinatarioFijo ? (
            <TextField
              select
              label="¿Para quién es?"
              value={destinatarioUid}
              onChange={(e) => setDestinatarioUid(e.target.value)}
              required
              helperText="Solo esta persona lo verá y lo escuchará. Después no se puede cambiar."
              sx={{ mt: 1 }}
            >
              {activos.map((o) => (
                <MenuItem key={o.oyenteUid} value={o.oyenteUid}>
                  {etiquetaOyente(o)}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
              Para <strong>{nombreDestinatario}</strong>.{' '}
              {esNuevo
                ? 'Solo esta persona lo verá y lo escuchará. Después no se puede cambiar.'
                : 'No se puede cambiar la persona: si te has equivocado, borra este audio y crea otro.'}
            </Alert>
          ))}
        {esNuevo &&
          (subida.fase === 'sin-archivo' || subida.fase === 'error') && (
            <>
              <Box
                role="button"
                tabIndex={0}
                aria-label="Elegir archivo de audio"
                onClick={() => input.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    input.current?.click()
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setArrastrando(true)
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={alSoltar}
                sx={{
                  mt: 1,
                  py: 5,
                  px: 2,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: arrastrando ? 'primary.main' : 'divider',
                  bgcolor: arrastrando ? 'primary.light' : 'background.default',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition:
                    'border-color 160ms ease, background-color 160ms ease',
                  '&:focus-visible': { borderColor: 'primary.main' },
                }}
              >
                <CloudUploadOutlined
                  sx={{ fontSize: 40, color: 'primary.main' }}
                />
                <Typography sx={{ mt: 1, fontWeight: 500 }}>
                  Arrastra aquí tu audio o pulsa para elegirlo
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  MP3, M4A o WAV de hasta {MB} MB
                </Typography>
              </Box>
              <input
                ref={input}
                type="file"
                hidden
                accept={ACEPTAR_AUDIO}
                onChange={(e) => {
                  elegir(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {subida.fase === 'error' && (
                <Alert severity="error">{subida.mensaje}</Alert>
              )}
            </>
          )}

        {esNuevo && subida.fase === 'subiendo' && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                Subiendo {subida.nombre}…
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(subida.progreso)} %
              </Typography>
              <Button size="small" onClick={cancelarSubida}>
                Cancelar subida
              </Button>
            </Box>
            <LinearProgress
              variant="determinate"
              value={subida.progreso}
              aria-label="Progreso de la subida"
            />
          </Box>
        )}

        {esNuevo && subida.fase === 'subido' && (
          <Alert severity="success" variant="outlined">
            {subida.nombre} subido. Rellena los datos y guárdalo.
          </Alert>
        )}

        {(vistaPrevia || cargandoVistaPrevia) && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Vista previa
            </Typography>
            {vistaPrevia ? (
              <Box
                component="audio"
                controls
                src={vistaPrevia}
                sx={{ width: '100%' }}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Cargando el audio…
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {(!esNuevo ||
          subida.fase === 'subiendo' ||
          subida.fase === 'subido') && (
          <>
            <TextField
              label="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              error={!tituloValido && titulo.length > 0}
              helperText={`${titulo.length} de ${LIMITES_AUDIO.titulo}`}
              slotProps={{ htmlInput: { maxLength: LIMITES_AUDIO.titulo } }}
            />
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              multiline
              minRows={3}
              placeholder="Para qué sirve, cuándo escucharlo… (opcional)"
              helperText={`${descripcion.length} de ${LIMITES_AUDIO.descripcion}`}
              slotProps={{
                htmlInput: { maxLength: LIMITES_AUDIO.descripcion },
              }}
            />
            {biblioteca && (
              <Autocomplete
                multiple
                freeSolo
                options={biblioteca.sugerencias.filter(
                  (e) => !etiquetas.includes(e),
                )}
                value={etiquetas}
                onChange={(_, valor) => {
                  setEtiquetas(normalizarEtiquetas(valor))
                  setTextoEtiqueta('')
                }}
                inputValue={textoEtiqueta}
                onInputChange={(_, texto, motivo) => {
                  if (motivo !== 'reset') setTextoEtiqueta(texto)
                }}
                onKeyDown={(e) => {
                  // Ya la tiene: no se añade otra vez, pero el campo se vacía.
                  if (
                    e.key === 'Enter' &&
                    etiquetas.includes(normalizarEtiqueta(textoEtiqueta))
                  ) {
                    e.preventDefault()
                    setTextoEtiqueta('')
                  }
                }}
                renderValue={(valor, getItemProps) =>
                  valor.map((opcion, indice) => {
                    const { key, ...props } = getItemProps({ index: indice })
                    return (
                      <Chip key={key} size="small" label={opcion} {...props} />
                    )
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Etiquetas"
                    placeholder={
                      etiquetas.length < LIMITES_BIBLIOTECA.etiquetas
                        ? 'Escribe un tema y pulsa Intro'
                        : ''
                    }
                    helperText={`Por ejemplo «ansiedad» o «sueño». Hasta ${LIMITES_BIBLIOTECA.etiquetas}.`}
                    slotProps={{
                      ...params.slotProps,
                      htmlInput: {
                        ...params.slotProps.htmlInput,
                        maxLength: LIMITES_BIBLIOTECA.etiqueta,
                        readOnly:
                          etiquetas.length >= LIMITES_BIBLIOTECA.etiquetas,
                      },
                    }}
                  />
                )}
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={contieneSalud}
                  onChange={(e) => setContieneSalud(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography>Contiene contenido de salud</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Por ejemplo, si habla de diagnósticos, tratamientos o
                    medicación. Tus oyentes verán un aviso junto al audio.
                  </Typography>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                '& .MuiCheckbox-root': { pt: 0.25 },
              }}
            />

            <Box>
              <Typography id="portada-audio-etiqueta" sx={{ mb: 1 }}>
                Imagen
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <PortadaAudio
                  profesionalUid={uid}
                  fotoPrincipalId={fotoPrincipalId}
                  portada={portada}
                  audioId={audioId}
                  portadaImagen={portadaImagen}
                  biblioteca={enBiblioteca}
                  imagenUrl={
                    portada === 'propia' &&
                    portadaImagen !== (audio?.portadaImagen ?? null)
                      ? vistaPortada
                      : undefined
                  }
                  style={{
                    width: 88,
                    height: 88,
                    flexShrink: 0,
                    borderRadius: 12,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <RadioGroup
                    aria-labelledby="portada-audio-etiqueta"
                    value={portada}
                    onChange={(e) => {
                      const valor = e.target.value as TipoPortadaAudio
                      if (valor === 'propia' && !portadaImagen) {
                        inputImagen.current?.click()
                        return
                      }
                      setPortada(valor)
                    }}
                  >
                    <FormControlLabel
                      value="defecto"
                      control={<Radio size="small" />}
                      label="Por defecto"
                    />
                    <FormControlLabel
                      value="profesional"
                      control={<Radio size="small" />}
                      label="Foto del profesional"
                    />
                    <FormControlLabel
                      value="propia"
                      control={<Radio size="small" />}
                      label="Otra imagen"
                    />
                  </RadioGroup>
                  {portada === 'profesional' && !fotoPrincipalId && (
                    <Typography variant="body2" color="text.secondary">
                      Aún no tienes foto principal en tu perfil: se verá la
                      imagen de NeuroAudio.
                    </Typography>
                  )}
                  {portada === 'propia' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ImageOutlined />}
                      onClick={() => inputImagen.current?.click()}
                      sx={{ mt: 0.5 }}
                    >
                      Cambiar imagen
                    </Button>
                  )}
                  <input
                    ref={inputImagen}
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      elegirImagen(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={cerrar} disabled={guardando}>
          Cancelar
        </Button>
        <Box sx={{ flex: 1 }} />
        {enBiblioteca ? (
          // En la biblioteca no hay borrador ni publicado: se guarda y, si
          // acaso, se envía después.
          <Button
            variant="contained"
            onClick={() => guardar('publicado')}
            disabled={!listoParaGuardar}
          >
            {esNuevo ? 'Guardar en Mis audios' : 'Guardar cambios'}
          </Button>
        ) : esNuevo || !publicadoAhora ? (
          <>
            <Button
              variant="outlined"
              onClick={() => guardar('borrador')}
              disabled={!listoParaGuardar}
            >
              Guardar borrador
            </Button>
            <Button
              variant="contained"
              onClick={() => guardar('publicado')}
              disabled={!listoParaGuardar}
            >
              Publicar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => guardar('borrador')}
              disabled={!listoParaGuardar}
            >
              Despublicar
            </Button>
            <Button
              variant="contained"
              onClick={() => guardar('publicado')}
              disabled={!listoParaGuardar}
            >
              Guardar cambios
            </Button>
          </>
        )}
      </DialogActions>

      {ajuste && (
        <DialogoAjustarFoto
          src={ajuste.src}
          forma="cuadrado"
          titulo="Ajustar imagen"
          textoGuardar="Guardar imagen"
          ayuda="Lo que queda dentro del cuadrado es la imagen del audio. Arrastra para moverla y usa el zoom para acercarla. Con teclado: flechas para mover, + y − para el zoom."
          onCancelar={cerrarAjuste}
          onGuardar={guardarAjuste}
        />
      )}
    </Dialog>
  )
}

export default DialogoAudio
