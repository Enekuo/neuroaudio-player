import { useState } from 'react'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import { useReproducirAudioProfesional } from '../../audiosProfesional/useReproducirAudioProfesional'
import FilaAudio from '../../library/components/FilaAudio'
import { usePlayer } from '../../player/context/PlayerContext'
import { DescripcionAudio, IconoInfo } from './DescripcionAudio'

type FilasAudioProfesionalProps = {
  profesionalUid: string
  audios: AudioProfesional[]
}

/**
 * Audios de un profesional en las filas de la app (FilaAudio): «duración ·
 * Contenido de salud» y un menú con «Ver descripción». Se toca una fila y
 * suena ese audio (sin «Reproducir todo» ni «Aleatorio»); el archivo se
 * descarga entonces, de forma privada.
 */
function FilasAudioProfesional({
  profesionalUid,
  audios,
}: FilasAudioProfesionalProps) {
  const { currentTrack, isPlaying, togglePlay } = usePlayer()
  const reproducirAudio = useReproducirAudioProfesional()
  const [descripcion, setDescripcion] = useState<AudioProfesional | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reproducir = async (audio: AudioProfesional) => {
    if (currentTrack?.id === audio.id) {
      togglePlay()
      return
    }
    setError(null)
    if (!(await reproducirAudio(audio, profesionalUid))) {
      setError(`No se pudo cargar «${audio.titulo}». Inténtalo de nuevo.`)
    }
  }

  return (
    <>
      {error && <p className="lista-detalle__error">{error}</p>}
      <div className="library-section__list library-section__list--plana">
        {audios.map((audio) => (
          <FilaAudio
            key={audio.id}
            name={audio.titulo}
            duration={audio.duracionSegundos}
            detalle={audio.contieneSalud ? 'Contenido de salud' : undefined}
            isDeleting={false}
            isPlaying={currentTrack?.id === audio.id && isPlaying}
            onPlay={() => void reproducir(audio)}
            // Sin descripción, sin «Ver descripción» (ni menú).
            opciones={
              audio.descripcion.trim()
                ? [
                    {
                      etiqueta: 'Ver descripción',
                      icono: <IconoInfo />,
                      onClick: () => setDescripcion(audio),
                    },
                  ]
                : []
            }
          />
        ))}
      </div>
      {descripcion && (
        <DescripcionAudio
          audio={descripcion}
          onCerrar={() => setDescripcion(null)}
        />
      )}
    </>
  )
}

export default FilasAudioProfesional
