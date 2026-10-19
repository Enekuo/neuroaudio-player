import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { urlAudio } from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import FilaAudio from '../../library/components/FilaAudio'
import { usePlayer, type AudioTrack } from '../../player/context/PlayerContext'

function IconoInfo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  )
}

/** Descripción de un audio (y su aviso de salud), en una pequeña ventana. */
function DescripcionAudio({
  audio,
  onCerrar,
}: {
  audio: AudioProfesional
  onCerrar: () => void
}) {
  const cerrar = useRef<HTMLButtonElement>(null)
  // Ref: la página se repinta con el reproductor y no debe robar el foco.
  const alCerrar = useRef(onCerrar)
  alCerrar.current = onCerrar
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    cerrar.current?.focus()
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar.current()
    }
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      anterior?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div
        className="modal-card prof-pagina__ficha"
        role="dialog"
        aria-modal="true"
        aria-labelledby="descripcion-audio-titulo"
      >
        <h2 id="descripcion-audio-titulo">{audio.titulo}</h2>
        <p className="prof-pagina__descripcion">
          {audio.descripcion.trim() || 'Este audio no tiene descripción.'}
        </p>
        {audio.contieneSalud && (
          <p className="prof-pagina__salud">
            Este audio trata temas de salud. No sustituye la atención de un
            profesional sanitario; si lo necesitas, acude a uno.
          </p>
        )}
        <div className="modal-actions">
          <button
            ref={cerrar}
            type="button"
            className="modal-actions__submit"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

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
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer()
  const [descripcion, setDescripcion] = useState<AudioProfesional | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reproducir = async (audio: AudioProfesional) => {
    if (currentTrack?.id === audio.id) {
      togglePlay()
      return
    }
    setError(null)
    try {
      const url = await urlAudio(audio.archivo)
      const pista: AudioTrack = {
        id: audio.id,
        name: audio.titulo,
        url,
        duration: audio.duracionSegundos,
        origen: 'profesional',
        profesionalUid,
      }
      // Cola de una sola pista: los demás aún no tienen su enlace privado
      // (se descargan al tocarlos).
      playTrack(pista, [pista])
    } catch {
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
            opciones={[
              {
                etiqueta: 'Ver descripción',
                icono: <IconoInfo />,
                onClick: () => setDescripcion(audio),
              },
            ]}
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
