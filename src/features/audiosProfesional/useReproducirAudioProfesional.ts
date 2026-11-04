import { useCallback } from 'react'
import { usePlayer, type AudioTrack } from '../player/context/PlayerContext'
import { urlAudio } from './audioProfesionalService'
import type { AudioProfesional } from './modelo'

/**
 * Pone a sonar un audio de un profesional, igual desde su página que desde el
 * buscador: el archivo se descarga entonces, de forma privada (getBlob, nunca
 * un enlace público), y la pista lleva quién lo comparte, para que el
 * reproductor muestre su portada, su nombre y la descripción con la «i».
 * Cola de una sola pista: los demás aún no tienen su enlace privado (se
 * descargan al tocarlos). Devuelve false si no se pudo descargar.
 */
export function useReproducirAudioProfesional() {
  const { playTrack } = usePlayer()

  return useCallback(
    async (
      audio: AudioProfesional,
      profesionalUid: string,
      /** Si suena como paso de un programa (para completarlo al terminar). */
      programa?: { id: string; profesionalUid: string },
    ) => {
      try {
        const url = await urlAudio(audio.archivo)
        const pista: AudioTrack = {
          id: audio.id,
          name: audio.titulo,
          url,
          duration: audio.duracionSegundos,
          origen: 'profesional',
          profesionalUid,
          ...(programa ? { programa } : {}),
        }
        playTrack(pista, [pista])
        return true
      } catch {
        return false
      }
    },
    [playTrack],
  )
}
