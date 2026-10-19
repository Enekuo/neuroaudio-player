import { useEffect, useState, type CSSProperties } from 'react'
import {
  CUSTOM_TEMPLATE,
  getTemplateById,
} from '../../library/data/plantillasListas'
import {
  adquirirImagenLista,
  soltarImagenLista,
} from '../listaProfesionalService'
import type { ListaProfesional } from '../modelo'

export type ListaConPortada = Pick<
  ListaProfesional,
  'id' | 'profesionalUid' | 'plantillaId' | 'imagen'
>

/**
 * URL local (blob:) de la imagen propia de una lista, descargada de forma
 * privada; al desmontarse, la suelta. null mientras carga, si no tiene
 * imagen propia o si quien mira no tiene permiso.
 */
export function useImagenLista(lista: ListaConPortada | null) {
  const uid = lista?.profesionalUid ?? null
  const listaId = lista?.id ?? null
  const imagenId = lista?.imagen ?? null
  const clave = uid && listaId && imagenId ? `${listaId}/${imagenId}` : null
  const [resultado, setResultado] = useState<{
    clave: string
    url: string | null
  } | null>(null)

  useEffect(() => {
    if (!uid || !listaId || !imagenId || !clave) return
    let vigente = true
    adquirirImagenLista(uid, listaId, imagenId)
      .then((url) => vigente && setResultado({ clave, url }))
      .catch(() => vigente && setResultado({ clave, url: null }))
    return () => {
      vigente = false
      soltarImagenLista(uid, listaId, imagenId)
    }
  }, [uid, listaId, imagenId, clave])

  return resultado && resultado.clave === clave ? resultado.url : null
}

/**
 * Estilo de la portada de una lista: la imagen propia (cubriendo todo) o la
 * ilustración de su plantilla con su ajuste de tamaño y posición.
 * - 'tarjeta' (panel): la ilustración sobre el degradado de la plantilla.
 * - 'app': como las tarjetas de lista de la app (TemplateGrid): solo la
 *   ilustración; el fondo oscuro lo pone la propia tarjeta.
 * - 'detalle': como la cabecera grande de ListaDetalle, sobre negro.
 * Sin imagen ni ilustración: el degradado de la plantilla (o el de las
 * listas personalizadas).
 */
export function estiloPortadaLista(
  plantillaId: string | null,
  imagenUrl: string | null,
  uso: 'tarjeta' | 'app' | 'detalle' = 'tarjeta',
): CSSProperties {
  if (imagenUrl) {
    return {
      backgroundImage: `url(${imagenUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#000000',
    }
  }
  const plantilla = plantillaId ? getTemplateById(plantillaId) : CUSTOM_TEMPLATE
  const degradado = `linear-gradient(160deg, ${plantilla.gradientFrom} 0%, ${plantilla.gradientTo} 100%)`
  if (!plantilla.cardImage) return { background: degradado }
  if (uso === 'app') {
    return {
      backgroundImage: `url(${plantilla.cardImage})`,
      ...(plantilla.cardImageSize
        ? { backgroundSize: `${plantilla.cardImageSize}%` }
        : {}),
      ...(plantilla.cardImagePosition
        ? { backgroundPosition: plantilla.cardImagePosition }
        : {}),
    }
  }
  if (uso === 'detalle') {
    return {
      backgroundImage: `url(${plantilla.cardImage})`,
      backgroundColor: '#000000',
      backgroundRepeat: 'no-repeat',
      backgroundSize: plantilla.detailImageSize ?? 'cover',
      backgroundPosition: plantilla.detailImagePosition ?? 'center',
    }
  }
  return {
    backgroundImage: `url(${plantilla.cardImage}), ${degradado}`,
    backgroundSize: `${plantilla.cardImageSize ? `${plantilla.cardImageSize}%` : 'cover'}, cover`,
    backgroundPosition: `${plantilla.cardImagePosition ?? 'center'}, center`,
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#000000',
  }
}
