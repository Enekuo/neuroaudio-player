import { useEffect, useState } from 'react'
import { useFotoPerfil } from '../perfilProfesional/fotos/useFotoPerfil'
import { useProfesionalDePista } from '../perfilProfesional/useProfesionalDePista'
import { escucharAudio } from './audioProfesionalService'
import { carpetaDePortada, type AudioProfesional } from './modelo'
import { useImagenPortadaAudio } from './usePortadaAudio'

/**
 * Portada del audio de un profesional que suena: solo la que él eligió.
 * Devuelve la URL local (blob:) de la imagen («Foto del profesional» u
 * «Otra imagen») o null para «Por defecto» (el orbe en el reproductor
 * grande; el logo en el pequeño y en la pantalla de bloqueo). También null
 * mientras carga, si no tiene foto o si ya no se puede ver.
 *
 * Escucha el audio en vivo: si el profesional cambia la portada, se ve al
 * momento. `profesionalUid` es null si la pista no es de un profesional.
 */
export function usePortadaDePista(
  profesionalUid: string | null,
  audioId: string | null,
): string | null {
  const [estado, setEstado] = useState<{
    id: string
    audio: AudioProfesional | null
  } | null>(null)

  useEffect(() => {
    if (!profesionalUid || !audioId) return
    return escucharAudio(audioId, (audio) => setEstado({ id: audioId, audio }))
  }, [profesionalUid, audioId])

  const audio =
    profesionalUid && audioId && estado?.id === audioId ? estado.audio : null
  const profesional = useProfesionalDePista(
    audio?.portada === 'profesional' ? profesionalUid : null,
  )
  const foto = useFotoPerfil(
    profesional?.uid ?? null,
    audio?.portada === 'profesional'
      ? (profesional?.perfil.fotoPrincipalId ?? null)
      : null,
    'cuadrada',
  )
  // Uno añadido desde Biblioteca usa la imagen de su original.
  const carpeta = audio ? carpetaDePortada(audio) : null
  const propia = useImagenPortadaAudio(
    profesionalUid,
    carpeta?.audioId ?? audioId,
    audio?.portada === 'propia' ? audio.portadaImagen : null,
    carpeta?.biblioteca ?? false,
  )

  if (!audio) return null
  if (audio.portada === 'profesional') return foto
  if (audio.portada === 'propia') return propia
  return null
}
