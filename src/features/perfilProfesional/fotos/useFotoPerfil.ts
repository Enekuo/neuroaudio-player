import { useEffect, useState } from 'react'
import { urlFoto } from './fotoService'
import type { VarianteFoto } from './procesarFoto'

/**
 * URL lista para <img src> de una foto del perfil, descargada de forma
 * privada (ver urlFoto). Devuelve null mientras carga, si no hay foto o si
 * quien mira no tiene permiso; quien la usa muestra entonces las iniciales.
 */
export function useFotoPerfil(
  profesionalUid: string | null,
  fotoId: string | null,
  variante: VarianteFoto,
) {
  const clave =
    profesionalUid && fotoId ? `${profesionalUid}/${fotoId}/${variante}` : null
  const [resultado, setResultado] = useState<{
    clave: string
    url: string | null
  } | null>(null)

  useEffect(() => {
    if (!profesionalUid || !fotoId || !clave) return
    let vigente = true
    urlFoto(profesionalUid, fotoId, variante)
      .then((url) => vigente && setResultado({ clave, url }))
      .catch(() => vigente && setResultado({ clave, url: null }))
    return () => {
      vigente = false
    }
  }, [profesionalUid, fotoId, variante, clave])

  // Si cambia la foto pedida, no se enseña la anterior mientras llega la nueva.
  return resultado && resultado.clave === clave ? resultado.url : null
}
