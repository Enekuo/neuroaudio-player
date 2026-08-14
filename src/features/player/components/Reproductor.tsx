import { usePlayer } from '../context/PlayerContext'
import BarraComprimida from './BarraComprimida'
import PantallaCompletaReproductor from './PantallaCompletaReproductor'

function Reproductor() {
  const { currentTrack, isExpanded } = usePlayer()

  if (!currentTrack) {
    return null
  }

  return isExpanded ? <PantallaCompletaReproductor /> : <BarraComprimida />
}

export default Reproductor
