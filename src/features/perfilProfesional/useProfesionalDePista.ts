import { useEffect, useState } from 'react'
import type { PerfilProfesional } from './modelo'
import { escucharPerfil } from './perfilService'

export type ProfesionalDePista = { uid: string; perfil: PerfilProfesional }

/**
 * Perfil (en vivo) del profesional que comparte el audio que suena. `uid` es
 * el `profesionalUid` de la pista, o null si la pista es del propio oyente.
 * Devuelve null mientras carga, si no hay perfil o si ya no hay permiso
 * (vínculo pausado): el reproductor vuelve entonces a su texto de siempre.
 */
export function useProfesionalDePista(
  uid: string | null,
): ProfesionalDePista | null {
  const [estado, setEstado] = useState<{
    uid: string
    perfil: PerfilProfesional | null
  } | null>(null)

  useEffect(() => {
    if (!uid) return
    return escucharPerfil(
      uid,
      (perfil) => setEstado({ uid, perfil }),
      () => setEstado({ uid, perfil: null }),
    )
  }, [uid])

  if (!uid || estado?.uid !== uid || !estado.perfil) return null
  return { uid, perfil: estado.perfil }
}

/**
 * La misma imagen como `data:` URL (para la pantalla de bloqueo), a partir
 * de su enlace local `blob:`. null mientras se convierte o si falla.
 */
export function useDataUrl(blobUrl: string | null) {
  const [arte, setArte] = useState<{ de: string; url: string } | null>(null)

  useEffect(() => {
    if (!blobUrl) return
    let vigente = true
    fetch(blobUrl)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolver, rechazar) => {
            const lector = new FileReader()
            lector.onload = () => resolver(String(lector.result))
            lector.onerror = () => rechazar(lector.error)
            lector.readAsDataURL(blob)
          }),
      )
      .then((url) => {
        if (vigente) setArte({ de: blobUrl, url })
      })
      .catch(() => {
        // Sin arte propio: se queda el siguiente de la regla.
      })
    return () => {
      vigente = false
    }
  }, [blobUrl])

  return blobUrl && arte?.de === blobUrl ? arte.url : null
}
