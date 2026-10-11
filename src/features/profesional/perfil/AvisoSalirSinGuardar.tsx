import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

type AvisoSalirSinGuardarProps = {
  /** Hay cambios sin guardar. */
  activo: boolean
  /** Se llama justo antes de salir sin guardar (p. ej. para limpiar fotos). */
  onDescartar: () => void
  /**
   * Para pedir el aviso desde dentro de la página (p. ej. «Cancelar»):
   * se pone a true, y `onCerrarPeticion` lo devuelve a false.
   */
  pedirSalida?: { accion: () => void } | null
  onCerrarPeticion?: () => void
}

function esEnlaceInterno(destino: HTMLAnchorElement) {
  return (
    destino.origin === window.location.origin &&
    !destino.target &&
    !destino.hasAttribute('download')
  )
}

/**
 * Aviso de «cambios sin guardar». La app usa BrowserRouter (sin useBlocker),
 * así que:
 * - Al cerrar o recargar la pestaña, el navegador pregunta (beforeunload).
 * - Al pulsar cualquier enlace interno (menú, «Volver a la app»…), se para
 *   el clic y se pregunta con un diálogo antes de navegar.
 * El botón «atrás» del navegador no se puede parar sin cambiar el router.
 */
function AvisoSalirSinGuardar({
  activo,
  onDescartar,
  pedirSalida,
  onCerrarPeticion,
}: AvisoSalirSinGuardarProps) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [destino, setDestino] = useState<string | null>(null)

  useEffect(() => {
    if (!activo) return

    const antesDeCerrar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      // Algunos navegadores aún lo necesitan para mostrar el aviso.
      evento.returnValue = ''
    }

    const alPulsar = (evento: MouseEvent) => {
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return
      }
      const enlace = (evento.target as Element | null)?.closest?.('a[href]')
      if (!(enlace instanceof HTMLAnchorElement) || !esEnlaceInterno(enlace)) {
        return
      }
      const ruta = enlace.pathname + enlace.search + enlace.hash
      if (ruta === pathname + search) return

      evento.preventDefault()
      evento.stopPropagation()
      setDestino(ruta)
    }

    window.addEventListener('beforeunload', antesDeCerrar)
    // En captura: llega antes que el clic del propio enlace de React Router.
    document.addEventListener('click', alPulsar, true)
    return () => {
      window.removeEventListener('beforeunload', antesDeCerrar)
      document.removeEventListener('click', alPulsar, true)
    }
  }, [activo, pathname, search])

  const abierto = destino !== null || Boolean(pedirSalida)

  const cerrar = () => {
    setDestino(null)
    onCerrarPeticion?.()
  }

  const salir = () => {
    const ir = destino
    const accion = pedirSalida?.accion
    cerrar()
    onDescartar()
    if (ir) navigate(ir)
    else accion?.()
  }

  return (
    <Dialog
      open={abierto}
      onClose={cerrar}
      aria-labelledby="aviso-salir-titulo"
    >
      <DialogTitle id="aviso-salir-titulo">¿Salir sin guardar?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tienes cambios en tu perfil que todavía no has guardado. Si sales
          ahora, se perderán.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={salir} color="error">
          Salir sin guardar
        </Button>
        <Button onClick={cerrar} variant="contained" autoFocus>
          Seguir editando
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AvisoSalirSinGuardar
