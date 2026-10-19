import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import {
  Link as EnlaceRouter,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { formatTime } from '../../library/utils/formatTime'
import {
  ErrorLista,
  actualizarLista,
  borrarImagenLista,
  borrarLista,
  crearListaDePlantilla,
  crearListaPropia,
  subirImagenLista,
} from '../../listasProfesional/listaProfesionalService'
import {
  LIMITES_LISTA,
  PLANTILLAS_LISTA,
  huecoListaPropia,
  idListaPlantilla,
  nombreLista,
  validarLista,
  type EstadoLista,
  type ListaProfesional,
} from '../../listasProfesional/modelo'
import PortadaLista from '../../listasProfesional/vista/PortadaLista'
import type { Encuadre } from '../../perfilProfesional/fotos/encuadre'
import { ErrorFoto } from '../../perfilProfesional/fotos/procesarFoto'
import AvisoSalirSinGuardar from '../perfil/AvisoSalirSinGuardar'
import DialogoAjustarFoto from '../perfil/DialogoAjustarFoto'
import { animacionEntrada } from '../theme/movimiento'
import DialogoAnadirAudios from './DialogoAnadirAudios'
import type { DatosListas } from './ListasPage'

type Borrador = {
  titulo: string
  descripcion: string
  imagen: string | null
  audios: string[]
}

const iguales = (a: Borrador, b: Borrador) =>
  a.titulo === b.titulo &&
  a.descripcion === b.descripcion &&
  a.imagen === b.imagen &&
  a.audios.length === b.audios.length &&
  a.audios.every((id, i) => id === b.audios[i])

/**
 * Editor de una lista del profesional (nueva o existente). Decide qué lista
 * es por la ruta y, cuando ya están cargadas sus listas, pinta el editor.
 */
function EditorLista({ datos }: { datos: DatosListas }) {
  const { listaId } = useParams()
  const [parametros] = useSearchParams()
  const { uid, listas, audios, error } = datos

  // El id de una lista propia nueva se fija una vez (su imagen se sube a
  // una ruta con ese id antes de crear el documento).
  const idNuevaPropia = useRef<string | null>(null)
  // Si la plantilla ya estaba usada al abrir, se edita la que existe. Se
  // decide una vez: al crearla aquí mismo no hay que redirigir (el editor
  // ya lo hace, con su aviso).
  const plantillaYaUsada = useRef<boolean | null>(null)

  if (error) {
    return (
      <Alert severity="error">
        No se pudieron cargar tus listas. Revisa tu conexión y vuelve a entrar.
      </Alert>
    )
  }
  if (!listas || !audios) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando lista" />
      </Box>
    )
  }

  if (listaId) {
    const lista = listas.find((l) => l.id === listaId)
    if (!lista) {
      return (
        <Box>
          <Volver />
          <Alert severity="info">Esta lista no existe o se ha borrado.</Alert>
        </Box>
      )
    }
    return <Formulario key={lista.id} datos={datos} lista={lista} />
  }

  const plantillaId = parametros.get('plantilla')
  if (plantillaId) {
    if (!PLANTILLAS_LISTA.includes(plantillaId)) {
      return <Navigate to="/profesional/listas" replace />
    }
    const id = idListaPlantilla(uid, plantillaId)
    // Ya la tiene: se edita la que existe (una por plantilla).
    plantillaYaUsada.current ??= listas.some((l) => l.id === id)
    if (plantillaYaUsada.current) {
      return <Navigate to={`/profesional/listas/${id}`} replace />
    }
    return <Formulario key={id} datos={datos} nueva={{ id, plantillaId }} />
  }

  idNuevaPropia.current ??= huecoListaPropia(uid, listas)
  if (!idNuevaPropia.current) {
    return (
      <Box>
        <Volver />
        <Alert severity="info">
          Has llegado al máximo de listas propias. Borra alguna para crear otra.
        </Alert>
      </Box>
    )
  }
  return (
    <Formulario
      key={idNuevaPropia.current}
      datos={datos}
      nueva={{ id: idNuevaPropia.current, plantillaId: null }}
    />
  )
}

function Volver() {
  return (
    <Button
      component={EnlaceRouter}
      to="/profesional/listas"
      startIcon={<ArrowBackRounded />}
      sx={{ mb: 2 }}
    >
      Listas
    </Button>
  )
}

type FormularioProps = {
  datos: DatosListas
  /** La lista que se edita… */
  lista?: ListaProfesional
  /** …o la que se va a crear. */
  nueva?: { id: string; plantillaId: string | null }
}

function Formulario({ datos, lista, nueva }: FormularioProps) {
  const { uid } = datos
  const audios = datos.audios as AudioProfesional[]
  const navigate = useNavigate()
  const location = useLocation()
  const listaId = (lista?.id ?? nueva?.id) as string
  const plantillaId = lista ? lista.plantillaId : (nueva?.plantillaId ?? null)
  const dePlantilla = Boolean(plantillaId)
  const estado: EstadoLista = lista?.estado ?? 'borrador'
  const publicada = estado === 'publicado'

  const porId = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios])

  const inicialDe = (l?: ListaProfesional): Borrador => ({
    titulo: l?.titulo ?? '',
    descripcion: l?.descripcion ?? '',
    imagen: l?.imagen ?? null,
    audios: l?.audios ?? [],
  })
  const [inicial, setInicial] = useState<Borrador>(() => inicialDe(lista))
  const [borrador, setBorrador] = useState<Borrador>(() => inicialDe(lista))

  // Imágenes subidas en esta edición que aún no se han guardado: se borran
  // al guardar otra, al descartar o al salir.
  const pendientes = useRef(new Set<string>())
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [ajuste, setAjuste] = useState<{ src: string; file: File } | null>(null)
  const archivo = useRef<HTMLInputElement>(null)

  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])
  // Al crear una lista se vuelve a abrir con su id: el aviso llega con la ruta.
  const [aviso, setAviso] = useState<string | null>(
    () => (location.state as { aviso?: string } | null)?.aviso ?? null,
  )
  const [anadiendo, setAnadiendo] = useState(false)
  const [confirmar, setConfirmar] = useState<'despublicar' | 'borrar' | null>(
    null,
  )
  const [avisoCancelar, setAvisoCancelar] = useState<{
    accion: () => void
  } | null>(null)

  // El que se arrastra (estado para pintarlo, referencia para leerlo al soltar).
  const [arrastrado, setArrastrado] = useState<string | null>(null)
  const arrastradoRef = useRef<string | null>(null)
  const empezarArrastre = (id: string | null) => {
    arrastradoRef.current = id
    setArrastrado(id)
  }

  // Solo los audios que siguen existiendo (uno borrado desaparece solo).
  const enLista = borrador.audios.filter((id) => porId.has(id))
  const enBorrador = enLista
    .map((id) => porId.get(id) as AudioProfesional)
    .filter((a) => a.estado === 'borrador')
  const hayCambios = !lista || !iguales(borrador, inicial)

  // Al salir de la página, fuera las imágenes subidas y no guardadas.
  useEffect(() => {
    const subidas = pendientes.current
    return () => {
      subidas.forEach((id) => void borrarImagenLista(uid, listaId, id))
    }
  }, [uid, listaId])

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia)
    },
    [vistaPrevia],
  )

  const cambiar = (cambios: Partial<Borrador>) =>
    setBorrador((b) => ({ ...b, ...cambios }))

  // ---------- Imagen propia ----------
  const elegirArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAjuste({ src: URL.createObjectURL(file), file })
  }

  const cerrarAjuste = () => {
    if (ajuste) URL.revokeObjectURL(ajuste.src)
    setAjuste(null)
  }

  const guardarAjuste = async (encuadre: Encuadre) => {
    if (!ajuste) return
    const { imagenId, imagen } = await subirImagenLista(
      uid,
      listaId,
      ajuste.file,
      encuadre,
    )
    pendientes.current.add(imagenId)
    setVistaPrevia(URL.createObjectURL(imagen))
    cambiar({ imagen: imagenId })
    cerrarAjuste()
  }

  // ---------- Audios ----------
  const mover = (id: string, paso: -1 | 1) => {
    const ids = [...enLista]
    const i = ids.indexOf(id)
    const j = i + paso
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    cambiar({ audios: ids })
  }

  const soltarSobre = (destinoId: string) => (evento: DragEvent) => {
    evento.preventDefault()
    const origen = arrastradoRef.current
    empezarArrastre(null)
    if (!origen || origen === destinoId) return
    const ids = enLista.filter((id) => id !== origen)
    ids.splice(ids.indexOf(destinoId), 0, origen)
    cambiar({ audios: ids })
  }

  // ---------- Guardar ----------
  const guardar = async (nuevoEstado: EstadoLista) => {
    const datosLista = {
      titulo: dePlantilla ? '' : borrador.titulo.trim(),
      descripcion: borrador.descripcion.trim(),
      estado: nuevoEstado,
      imagen: dePlantilla ? null : borrador.imagen,
      audios: enLista,
    }
    const problemas = validarLista({ ...datosLista, plantillaId })
    if (nuevoEstado === 'publicado' && enLista.length === 0) {
      problemas.push('Añade al menos un audio para publicar la lista.')
    }
    setErrores(problemas)
    if (problemas.length > 0) return

    setGuardando(true)
    try {
      if (lista) await actualizarLista(lista, datosLista)
      else if (plantillaId)
        await crearListaDePlantilla(uid, plantillaId, datosLista)
      else await crearListaPropia(uid, listaId, datosLista)

      // Guardada: fuera las imágenes que ya no se usan.
      const sobrantes = [...pendientes.current].filter(
        (id) => id !== datosLista.imagen,
      )
      if (inicial.imagen && inicial.imagen !== datosLista.imagen) {
        sobrantes.push(inicial.imagen)
      }
      pendientes.current.clear()
      sobrantes.forEach((id) => void borrarImagenLista(uid, listaId, id))

      const guardado = { ...borrador, audios: enLista }
      setInicial(guardado)
      setBorrador(guardado)
      const mensaje =
        nuevoEstado === 'publicado'
          ? publicada
            ? 'Cambios guardados. Tus oyentes ya los ven.'
            : 'Lista publicada. Ya la ven tus oyentes con acceso.'
          : publicada
            ? 'Lista despublicada. Tus oyentes ya no la ven.'
            : 'Borrador guardado.'
      if (lista) setAviso(mensaje)
      else {
        navigate(`/profesional/listas/${listaId}`, {
          replace: true,
          state: { aviso: mensaje },
        })
      }
    } catch (error) {
      setErrores([
        error instanceof ErrorLista
          ? error.message
          : 'No se pudo guardar la lista. Inténtalo de nuevo.',
      ])
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async () => {
    if (!lista) return
    setGuardando(true)
    try {
      await borrarLista(lista)
      pendientes.current.forEach(
        (id) => void borrarImagenLista(uid, listaId, id),
      )
      pendientes.current.clear()
      navigate('/profesional/listas', { replace: true })
    } catch {
      setErrores(['No se pudo borrar la lista. Inténtalo de nuevo.'])
      setGuardando(false)
      setConfirmar(null)
    }
  }

  const descartar = () => {
    pendientes.current.forEach((id) => void borrarImagenLista(uid, listaId, id))
    pendientes.current.clear()
  }

  const nombre = dePlantilla
    ? nombreLista({ plantillaId, titulo: '' })
    : borrador.titulo.trim() || 'Nueva lista'
  const imagenCambiada = borrador.imagen !== inicial.imagen
  const portada = {
    id: listaId,
    profesionalUid: uid,
    plantillaId,
    imagen: inicial.imagen,
  }

  return (
    <Box component="section" aria-labelledby="editor-lista-titulo">
      {/* Cabecera: volver, nombre y estado. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Tooltip title="Volver a tus listas">
          <IconButton
            aria-label="Volver a tus listas"
            onClick={() => {
              const ir = () => navigate('/profesional/listas')
              if (hayCambios) setAvisoCancelar({ accion: ir })
              else ir()
            }}
          >
            <ArrowBackRounded />
          </IconButton>
        </Tooltip>
        <Typography
          id="editor-lista-titulo"
          variant="h5"
          component="h1"
          sx={{ fontWeight: 400, minWidth: 0 }}
          noWrap
        >
          {nombre}
        </Typography>
        {lista && (
          <Chip
            size="small"
            label={publicada ? 'Publicada' : 'Borrador'}
            color={publicada ? 'success' : 'default'}
            variant={publicada ? 'filled' : 'outlined'}
          />
        )}
      </Box>

      {/* Datos de la lista. */}
      <Paper
        variant="outlined"
        sx={[
          {
            p: { xs: 2, sm: 3 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '200px minmax(0, 1fr)' },
            gap: 3,
            mb: 3,
          },
          animacionEntrada({ retardo: 40 }),
        ]}
      >
        <Box>
          <PortadaLista
            lista={portada}
            imagenUrl={imagenCambiada ? vistaPrevia : undefined}
            style={{
              width: '100%',
              maxWidth: 200,
              aspectRatio: '1',
              borderRadius: 12,
            }}
          />
          {!dePlantilla && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ImageOutlined />}
                onClick={() => archivo.current?.click()}
              >
                {borrador.imagen ? 'Cambiar imagen' : 'Subir imagen'}
              </Button>
              {borrador.imagen && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => cambiar({ imagen: null })}
                >
                  Quitar
                </Button>
              )}
              <input
                ref={archivo}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={elegirArchivo}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5, alignContent: 'start' }}>
          {dePlantilla ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Nombre
              </Typography>
              <Typography sx={{ fontWeight: 500 }}>{nombre}</Typography>
              <Typography variant="caption" color="text.secondary">
                El nombre y la imagen son los de esta lista de NeuroAudio.
              </Typography>
            </Box>
          ) : (
            <TextField
              label="Nombre"
              value={borrador.titulo}
              onChange={(e) => cambiar({ titulo: e.target.value })}
              required
              slotProps={{ htmlInput: { maxLength: LIMITES_LISTA.titulo } }}
              helperText={`${borrador.titulo.length}/${LIMITES_LISTA.titulo}`}
            />
          )}
          <TextField
            label="Descripción (opcional)"
            value={borrador.descripcion}
            onChange={(e) => cambiar({ descripcion: e.target.value })}
            multiline
            minRows={3}
            placeholder="Para quién es y para quién no es esta lista."
            slotProps={{
              htmlInput: { maxLength: LIMITES_LISTA.descripcion },
            }}
            helperText={`${borrador.descripcion.length}/${LIMITES_LISTA.descripcion}`}
          />
        </Box>
      </Paper>

      {/* Audios de la lista. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 400 }}>
          Audios
        </Typography>
        <Typography color="text.secondary">({enLista.length})</Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<AddRounded />}
          onClick={() => setAnadiendo(true)}
          disabled={enLista.length >= LIMITES_LISTA.audios}
        >
          Añadir audios
        </Button>
      </Box>

      {enBorrador.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {enBorrador.length === 1
            ? `«${enBorrador[0].titulo}» está en borrador: tus oyentes no lo verán en la lista hasta que lo publiques.`
            : `${enBorrador
                .slice(0, -1)
                .map((a) => `«${a.titulo}»`)
                .join(
                  ', ',
                )} y «${enBorrador[enBorrador.length - 1].titulo}» están en borrador: tus oyentes no los verán en la lista hasta que los publiques.`}
        </Alert>
      )}

      {enLista.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 5, px: 2, textAlign: 'center', mb: 3 }}
        >
          <Typography color="text.secondary">
            Aún no hay audios en esta lista.
          </Typography>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          component="ol"
          aria-label="Audios de la lista, en orden"
          sx={{ listStyle: 'none', m: 0, mb: 3, p: 0, overflow: 'hidden' }}
        >
          {enLista.map((id, indice) => {
            const audio = porId.get(id) as AudioProfesional
            return (
              <Box
                component="li"
                key={id}
                draggable={enLista.length > 1}
                onDragStart={() => empezarArrastre(id)}
                onDragEnd={() => empezarArrastre(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={soltarSobre(id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  py: 1,
                  borderTop: indice === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                  bgcolor:
                    arrastrado === id ? 'action.selected' : 'background.paper',
                  opacity: arrastrado === id ? 0.6 : 1,
                  transition: 'background-color 160ms ease, opacity 160ms ease',
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    display: 'flex',
                    color: 'text.secondary',
                    cursor: enLista.length > 1 ? 'grab' : 'default',
                  }}
                >
                  <DragIndicatorRounded fontSize="small" />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ minWidth: 20, fontVariantNumeric: 'tabular-nums' }}
                >
                  {indice + 1}
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 500 }} noWrap>
                    {audio.titulo}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.75,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      mt: 0.25,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(audio.duracionSegundos)}
                    </Typography>
                    {audio.estado === 'borrador' && (
                      <Chip size="small" variant="outlined" label="Borrador" />
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex' }}>
                  <Tooltip title="Subir">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Subir «${audio.titulo}»`}
                        disabled={indice === 0}
                        onClick={() => mover(id, -1)}
                      >
                        <ArrowUpwardRounded fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Bajar">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Bajar «${audio.titulo}»`}
                        disabled={indice === enLista.length - 1}
                        onClick={() => mover(id, 1)}
                      >
                        <ArrowDownwardRounded fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Quitar de la lista">
                    <IconButton
                      size="small"
                      aria-label={`Quitar «${audio.titulo}» de la lista`}
                      onClick={() =>
                        setBorrador((b) => ({
                          ...b,
                          audios: b.audios.filter((a) => a !== id),
                        }))
                      }
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )
          })}
        </Paper>
      )}

      {errores.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errores.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </Alert>
      )}

      {/* Acciones. */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {lista && (
          <Button
            color="error"
            startIcon={<DeleteOutlineRounded />}
            onClick={() => setConfirmar('borrar')}
            disabled={guardando}
          >
            Borrar lista
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {publicada ? (
          <>
            <Button
              variant="outlined"
              onClick={() => setConfirmar('despublicar')}
              disabled={guardando}
            >
              Despublicar
            </Button>
            <Button
              variant="contained"
              onClick={() => void guardar('publicado')}
              disabled={guardando || !hayCambios}
            >
              Guardar cambios
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => void guardar('borrador')}
              disabled={guardando || (Boolean(lista) && !hayCambios)}
            >
              Guardar borrador
            </Button>
            <Button
              variant="contained"
              onClick={() => void guardar('publicado')}
              disabled={guardando}
            >
              Publicar
            </Button>
          </>
        )}
      </Box>

      {anadiendo && (
        <DialogoAnadirAudios
          audios={audios}
          enLista={enLista}
          hueco={LIMITES_LISTA.audios - enLista.length}
          onCerrar={() => setAnadiendo(false)}
          onAnadir={(ids) => {
            cambiar({ audios: [...enLista, ...ids] })
            setAnadiendo(false)
          }}
        />
      )}

      {ajuste && (
        <DialogoAjustarFoto
          src={ajuste.src}
          forma="cuadrado"
          titulo="Ajustar imagen"
          textoGuardar="Guardar imagen"
          ayuda="Lo que queda dentro del cuadrado es la imagen de la lista. Arrastra para moverla y usa el zoom para acercarla. Con teclado: flechas para mover, + y − para el zoom."
          onCancelar={cerrarAjuste}
          onGuardar={async (encuadre) => {
            try {
              await guardarAjuste(encuadre)
            } catch (error) {
              throw error instanceof ErrorFoto
                ? error
                : new ErrorFoto(
                    'No se pudo subir la imagen. Inténtalo de nuevo.',
                  )
            }
          }}
        />
      )}

      <Dialog
        open={confirmar !== null}
        onClose={() => !guardando && setConfirmar(null)}
        aria-labelledby="confirmar-lista-titulo"
      >
        <DialogTitle id="confirmar-lista-titulo">
          {confirmar === 'borrar'
            ? '¿Borrar esta lista?'
            : '¿Despublicar esta lista?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmar === 'borrar'
              ? `Vas a borrar «${nombre}». Sus audios no se borran, pero tus oyentes dejarán de ver la lista y no se puede deshacer.`
              : `Tus oyentes dejarán de ver «${nombre}». Podrás volver a publicarla cuando quieras.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(null)} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            color={confirmar === 'borrar' ? 'error' : 'primary'}
            variant="contained"
            disabled={guardando}
            onClick={() => {
              if (confirmar === 'borrar') void borrar()
              else {
                setConfirmar(null)
                void guardar('borrador')
              }
            }}
          >
            {confirmar === 'borrar' ? 'Borrar' : 'Despublicar'}
          </Button>
        </DialogActions>
      </Dialog>

      <AvisoSalirSinGuardar
        activo={hayCambios && !guardando}
        onDescartar={descartar}
        pedirSalida={avisoCancelar}
        onCerrarPeticion={() => setAvisoCancelar(null)}
        texto="Tienes cambios en esta lista que todavía no has guardado. Si sales ahora, se perderán."
      />

      <Snackbar
        open={aviso !== null}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
      />
    </Box>
  )
}

export default EditorLista
