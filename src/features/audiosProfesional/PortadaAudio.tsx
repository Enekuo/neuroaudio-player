import type { CSSProperties } from 'react'
import AudioWave from '../../components/AudioWave'
import { useFotoPerfil } from '../perfilProfesional/fotos/useFotoPerfil'
import type { TipoPortadaAudio } from './modelo'
import { useImagenPortadaAudio } from './usePortadaAudio'

type PortadaAudioProps = {
  profesionalUid: string
  /** Foto principal del profesional, si tiene. */
  fotoPrincipalId: string | null
  /** La portada que eligió para este audio. */
  portada: TipoPortadaAudio
  audioId: string
  /** Id de la imagen propia guardada (con portada 'propia'). */
  portadaImagen: string | null
  /** Imagen propia aún sin guardar (vista previa en el editor). */
  imagenUrl?: string | null
  /** Audio de «Mis audios» (su imagen va en esa carpeta). */
  biblioteca?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Portada de un audio del profesional: solo lo que él eligió. «Por
 * defecto», la onda de los audios de la app (AudioWave, quieta);
 * «Foto del profesional», su foto principal (si no tiene, la onda); «Otra
 * imagen», la que subió (mientras carga o si no se puede ver, la onda).
 */
function PortadaAudio({
  profesionalUid,
  fotoPrincipalId,
  portada,
  audioId,
  portadaImagen,
  imagenUrl,
  biblioteca = false,
  className,
  style,
}: PortadaAudioProps) {
  const foto = useFotoPerfil(
    profesionalUid,
    portada === 'profesional' ? fotoPrincipalId : null,
    'cuadrada',
  )
  const guardada = useImagenPortadaAudio(
    profesionalUid,
    audioId,
    portada === 'propia' && imagenUrl === undefined ? portadaImagen : null,
    biblioteca,
  )
  const propia = imagenUrl === undefined ? guardada : imagenUrl
  const src =
    portada === 'profesional' ? foto : portada === 'propia' ? propia : null
  if (!src) {
    return (
      <span
        className={className}
        // La onda ya es un círculo: sin el marco que lleve la imagen.
        style={{ display: 'block', ...style, border: 'none' }}
        aria-hidden="true"
      >
        <AudioWave variant="small" playing={false} />
      </span>
    )
  }
  return (
    <img
      className={className}
      style={{ objectFit: 'cover', ...style }}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}

export default PortadaAudio
