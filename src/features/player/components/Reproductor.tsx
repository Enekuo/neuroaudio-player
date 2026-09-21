import { useEffect, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import BarraComprimida from './BarraComprimida'
import PantallaCompletaReproductor from './PantallaCompletaReproductor'

function Reproductor() {
  const { currentTrack, isExpanded } = usePlayer()
  const [showFullScreen, setShowFullScreen] = useState(isExpanded)
  const [isClosing, setIsClosing] = useState(false)

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

  if (!currentTrack) {
    return null
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

  return <BarraComprimida />
}

export default Reproductor
