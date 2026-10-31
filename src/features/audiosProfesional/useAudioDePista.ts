import { useEffect, useState } from 'react'
import { escucharAudio } from './audioProfesionalService'
import type { AudioProfesional } from './modelo'

/**
 * El audio de un profesional que suena, en vivo (para su descripción en el
 * reproductor). undefined: cargando; null: no es de un profesional o ya no
 * se puede leer. `profesionalUid` es null si la pista no es de un profesional.
 */
export function useAudioDePista(
  profesionalUid: string | null,
  audioId: string | null,
): AudioProfesional | null | undefined {
  const [estado, setEstado] = useState<{
    id: string
    audio: AudioProfesional | null
  } | null>(null)

  useEffect(() => {
    if (!profesionalUid || !audioId) return
    return escucharAudio(audioId, (audio) => setEstado({ id: audioId, audio }))
  }, [profesionalUid, audioId])

  if (!profesionalUid || !audioId) return null
  return estado?.id === audioId ? estado.audio : undefined
}
