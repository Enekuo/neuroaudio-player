import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ZoomInRounded from '@mui/icons-material/ZoomInRounded'
import ZoomOutRounded from '@mui/icons-material/ZoomOutRounded'
import {
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  encuadreInicial,
  ladoRecorte,
  limitarEncuadre,
  moverEncuadre,
  zoomEncuadre,
  type Encuadre,
} from '../../perfilProfesional/fotos/encuadre'
import { ErrorFoto } from '../../perfilProfesional/fotos/procesarFoto'

type DialogoAjustarFotoProps = {
  /** URL de la imagen (blob: del archivo elegido o de su versión normal). */
  src: string | null
  /** Encuadre guardado de esta foto, si ya se había ajustado. */
  encuadreGuardado?: Encuadre
  onCancelar: () => void
  /** Sube o regenera la foto con el encuadre elegido. Si falla, lanza. */
  onGuardar: (encuadre: Encuadre) => Promise<void>
}

/** Parte del lado del escenario que ocupa el círculo. */
const PROPORCION_CIRCULO = 0.8
const PASO_ZOOM = 1.1

/**
 * «Ajustar foto»: la imagen entera detrás y un círculo encima que marca qué
 * se verá como foto de perfil; fuera del círculo, oscurecido. Se mueve
 * arrastrando (ratón o dedo) y se acerca con la barra, la rueda o pellizcando.
 * Con teclado: flechas para mover y + / − para el zoom. El recorte nunca
 * deja hueco dentro del círculo.
 */
function DialogoAjustarFoto({
  src,
  encuadreGuardado,
  onCancelar,
  onGuardar,
}: DialogoAjustarFotoProps) {
  const theme = useTheme()
  const pantallaCompleta = useMediaQuery(theme.breakpoints.down('sm'))
  const idAyuda = useId()

  const escenario = useRef<HTMLDivElement>(null)
  const [lienzo, setLienzo] = useState(0)
  const [imagen, setImagen] = useState<{
    src: string
    ancho: number
    alto: number
  } | null>(null)
  const [encuadre, setEncuadre] = useState<Encuadre | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const punteros = useRef(new Map<number, { x: number; y: number }>())

  // Tamaño real de la imagen (con su orientación) y encuadre de partida.
  useEffect(() => {
    if (!src) return
    let vigente = true
    const img = new Image()
    img.onload = () => {
      if (!vigente) return
      const { naturalWidth: ancho, naturalHeight: alto } = img
      setImagen({ src, ancho, alto })
      setEncuadre(
        encuadreGuardado
          ? limitarEncuadre(ancho, alto, encuadreGuardado)
          : encuadreInicial(ancho, alto),
      )
    }
    img.onerror = () => vigente && setError('No se pudo abrir la foto.')
    img.src = src
    return () => {
      vigente = false
    }
  }, [src, encuadreGuardado])

  // El escenario es cuadrado y se adapta al ancho disponible.
  useEffect(() => {
    const nodo = escenario.current
    if (!nodo) return
    const observador = new ResizeObserver(([entrada]) =>
      setLienzo(entrada.contentRect.width),
    )
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [imagen])

  // Rueda del ratón: zoom (listener nativo para poder cancelar el scroll).
  useEffect(() => {
    const nodo = escenario.current
    if (!nodo || !imagen) return
    const alGirar = (evento: WheelEvent) => {
      evento.preventDefault()
      const factor = Math.exp(-evento.deltaY * 0.002)
      setEncuadre((e) =>
        e ? zoomEncuadre(imagen.ancho, imagen.alto, e, e.zoom * factor) : e,
      )
    }
    nodo.addEventListener('wheel', alGirar, { passive: false })
    return () => nodo.removeEventListener('wheel', alGirar)
  }, [imagen])

  const listo = imagen && encuadre && lienzo > 0
  // Píxeles de pantalla por píxel de imagen: el recorte llena el círculo.
  const escala = listo
    ? (lienzo * PROPORCION_CIRCULO) /
      ladoRecorte(imagen.ancho, imagen.alto, encuadre.zoom)
    : 1

  const mover = (dxPantalla: number, dyPantalla: number) => {
    if (!imagen) return
    // Arrastrar la imagen hacia un lado lleva el recorte hacia el contrario.
    setEncuadre((e) =>
      e
        ? moverEncuadre(
            imagen.ancho,
            imagen.alto,
            e,
            -dxPantalla / escala,
            -dyPantalla / escala,
          )
        : e,
    )
  }

  const cambiarZoom = (zoom: number) => {
    if (!imagen) return
    setEncuadre((e) =>
      e ? zoomEncuadre(imagen.ancho, imagen.alto, e, zoom) : e,
    )
  }

  const alBajarPuntero = (evento: PointerEvent<HTMLDivElement>) => {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    punteros.current.set(evento.pointerId, {
      x: evento.clientX,
      y: evento.clientY,
    })
  }

  const alMoverPuntero = (evento: PointerEvent<HTMLDivElement>) => {
    const anterior = punteros.current.get(evento.pointerId)
    if (!anterior || !imagen) return
    const actual = { x: evento.clientX, y: evento.clientY }

    if (punteros.current.size >= 2) {
      // Pellizco: el zoom sigue la distancia entre los dos dedos.
      const [a, b] = [...punteros.current.entries()]
      const otro = a[0] === evento.pointerId ? b[1] : a[1]
      const antes = Math.hypot(anterior.x - otro.x, anterior.y - otro.y)
      const ahora = Math.hypot(actual.x - otro.x, actual.y - otro.y)
      if (antes > 0) {
        setEncuadre((e) =>
          e
            ? zoomEncuadre(
                imagen.ancho,
                imagen.alto,
                e,
                (e.zoom * ahora) / antes,
              )
            : e,
        )
      }
    } else {
      mover(actual.x - anterior.x, actual.y - anterior.y)
    }
    punteros.current.set(evento.pointerId, actual)
  }

  const alSoltarPuntero = (evento: PointerEvent<HTMLDivElement>) => {
    punteros.current.delete(evento.pointerId)
  }

  const alPulsarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (!encuadre) return
    const paso = evento.shiftKey ? 40 : 10 // píxeles de pantalla
    const acciones: Record<string, () => void> = {
      ArrowLeft: () => mover(-paso, 0),
      ArrowRight: () => mover(paso, 0),
      ArrowUp: () => mover(0, -paso),
      ArrowDown: () => mover(0, paso),
      '+': () => cambiarZoom(encuadre.zoom * PASO_ZOOM),
      '=': () => cambiarZoom(encuadre.zoom * PASO_ZOOM),
      '-': () => cambiarZoom(encuadre.zoom / PASO_ZOOM),
      _: () => cambiarZoom(encuadre.zoom / PASO_ZOOM),
    }
    const accion = acciones[evento.key]
    if (!accion) return
    evento.preventDefault()
    accion()
  }

  const guardar = async () => {
    if (!encuadre) return
    setGuardando(true)
    setError(null)
    try {
      await onGuardar(encuadre)
    } catch (e) {
      setError(
        e instanceof ErrorFoto
          ? e.message
          : 'No se pudo guardar la foto. Inténtalo de nuevo.',
      )
      setGuardando(false)
    }
  }

  const cancelar = () => {
    if (!guardando) onCancelar()
  }

  return (
    <Dialog
      open={Boolean(src)}
      onClose={cancelar}
      fullScreen={pantallaCompleta}
      maxWidth="xs"
      fullWidth
      aria-labelledby="ajustar-foto-titulo"
    >
      <DialogTitle id="ajustar-foto-titulo">Ajustar foto</DialogTitle>
      <DialogContent>
        <Typography
          id={idAyuda}
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Lo que queda dentro del círculo es tu foto de perfil. Arrastra para
          moverla y usa el zoom para acercarla. Con teclado: flechas para mover,
          + y − para el zoom.
        </Typography>

        <Box
          ref={escenario}
          role="group"
          aria-label="Encuadre de la foto"
          aria-describedby={idAyuda}
          tabIndex={0}
          onKeyDown={alPulsarTecla}
          onPointerDown={alBajarPuntero}
          onPointerMove={alMoverPuntero}
          onPointerUp={alSoltarPuntero}
          onPointerCancel={alSoltarPuntero}
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#111',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            outline: 'none',
            '&:active': { cursor: 'grabbing' },
            '&:focus-visible': {
              boxShadow: (t) => `0 0 0 3px ${t.palette.primary.main}`,
            },
          }}
        >
          {listo ? (
            <>
              <Box
                component="img"
                src={imagen.src}
                alt=""
                draggable={false}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: imagen.ancho * escala,
                  height: imagen.alto * escala,
                  maxWidth: 'none',
                  transformOrigin: '0 0',
                  transform: `translate(${lienzo / 2 - encuadre.cx * imagen.ancho * escala}px, ${
                    lienzo / 2 - encuadre.cy * imagen.alto * escala
                  }px)`,
                  pointerEvents: 'none',
                }}
              />
              {/* Círculo: todo lo de fuera queda oscurecido con su sombra. */}
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${PROPORCION_CIRCULO * 100}%`,
                  aspectRatio: '1',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.62)',
                  outline: '2px solid rgba(255, 255, 255, 0.9)',
                  pointerEvents: 'none',
                }}
              />
            </>
          ) : (
            !error && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CircularProgress size={32} aria-label="Cargando foto" />
              </Box>
            )
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <IconButton
            aria-label="Alejar"
            onClick={() => encuadre && cambiarZoom(encuadre.zoom / PASO_ZOOM)}
            disabled={!encuadre || encuadre.zoom <= ZOOM_MINIMO}
          >
            <ZoomOutRounded />
          </IconButton>
          <Slider
            aria-label="Zoom"
            min={ZOOM_MINIMO}
            max={ZOOM_MAXIMO}
            step={0.01}
            value={encuadre?.zoom ?? ZOOM_MINIMO}
            onChange={(_, valor) => cambiarZoom(valor as number)}
            disabled={!encuadre}
            valueLabelDisplay="off"
            getAriaValueText={(v) => `${Math.round(v * 100)} %`}
          />
          <IconButton
            aria-label="Acercar"
            onClick={() => encuadre && cambiarZoom(encuadre.zoom * PASO_ZOOM)}
            disabled={!encuadre || encuadre.zoom >= ZOOM_MAXIMO}
          >
            <ZoomInRounded />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={cancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={guardar}
          disabled={!encuadre || guardando}
          startIcon={
            guardando ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          Guardar foto
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogoAjustarFoto
