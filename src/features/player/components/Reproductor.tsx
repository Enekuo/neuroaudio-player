import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import BarraComprimida from './BarraComprimida'
import PantallaCompletaReproductor from './PantallaCompletaReproductor'

// Tiempo que se ofrece "Deshacer" tras cerrar el mini-reproductor.
const UNDO_MS = 4000

function Reproductor() {
  const { currentTrack, isExpanded, undoDismissPlayer } = usePlayer()
  const [showFullScreen, setShowFullScreen] = useState(isExpanded)
  const [isClosing, setIsClosing] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const undoTimerRef = useRef<number | null>(null)

  // El reproductor a pantalla completa se desmonta al instante si simplemente
  // dejamos de renderizarlo, así que aquí retrasamos ese desmontaje un ciclo:
  // primero se marca "cerrando" (dispara la animación de salida en CSS) y solo
  // cuando esa animación termina (onCloseAnimationEnd) se vuelve a la barra
  // comprimida. Si isExpanded vuelve a true durante el cierre, se cancela.
  useEffect(() => {
    if (isExpanded) {
      setShowFullScreen(true)
      setIsClosing(false)
    } else if (showFullScreen) {
      setIsClosing(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded])

  useEffect(() => () => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current)
    }
  }, [])

  // Si empieza a sonar otro audio, el aviso de "Deshacer" ya no tiene sentido.
  useEffect(() => {
    if (currentTrack) {
      setShowUndo(false)
    }
  }, [currentTrack])

  function handleDismiss() {
    setShowUndo(true)
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current)
    }
    undoTimerRef.current = window.setTimeout(() => setShowUndo(false), UNDO_MS)
  }

  function handleUndo() {
    setShowUndo(false)
    undoDismissPlayer()
  }

  const undoToast = showUndo ? (
    <div className="player-undo-toast" role="status">
      <span>Reproductor cerrado</span>
      <button type="button" onClick={handleUndo}>
        Deshacer
      </button>
    </div>
  ) : null

  if (!currentTrack) {
    return undoToast
  }

  if (showFullScreen) {
    return (
      <PantallaCompletaReproductor
        isClosing={isClosing}
        onCloseAnimationEnd={() => {
          setShowFullScreen(false)
          setIsClosing(false)
        }}
      />
    )
  }

  return <BarraComprimida onDismiss={handleDismiss} />
}

export default Reproductor
