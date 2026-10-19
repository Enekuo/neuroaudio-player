import { useEffect, useState } from 'react'
import {
  adquirirPortadaAudio,
  soltarPortadaAudio,
} from './audioProfesionalService'

/**
 * URL local (blob:) de la imagen propia de la portada de un audio,
 * descargada de forma privada; al desmontarse, la suelta. null mientras
 * carga, si no hay imagen o si quien mira no tiene permiso.
 */
export function useImagenPortadaAudio(
  profesionalUid: string | null,
  audioId: string | null,
  imagenId: string | null,
  /** Audio de «Mis audios» (su portada va en esa carpeta). */
  biblioteca = false,
) {
  const clave =
    profesionalUid && audioId && imagenId
      ? `${profesionalUid}/${audioId}/${imagenId}`
      : null
  const [resultado, setResultado] = useState<{
    clave: string
    url: string | null
  } | null>(null)

  useEffect(() => {
    if (!profesionalUid || !audioId || !imagenId || !clave) return
    let vigente = true
    adquirirPortadaAudio(profesionalUid, audioId, imagenId, biblioteca)
      .then((url) => vigente && setResultado({ clave, url }))
      .catch(() => vigente && setResultado({ clave, url: null }))
    return () => {
      vigente = false
      soltarPortadaAudio(profesionalUid, audioId, imagenId, biblioteca)
    }
  }, [profesionalUid, audioId, imagenId, clave, biblioteca])

  return resultado && resultado.clave === clave ? resultado.url : null
}
