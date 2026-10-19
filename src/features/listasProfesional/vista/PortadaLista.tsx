import type { CSSProperties } from 'react'
import {
  estiloPortadaLista,
  useImagenLista,
  type ListaConPortada,
} from './imagenLista'

type PortadaListaProps = {
  lista: ListaConPortada
  /** Imagen propia aún sin guardar (vista previa en el editor). */
  imagenUrl?: string | null
  uso?: 'tarjeta' | 'app' | 'detalle'
  className?: string
  style?: CSSProperties
}

/** Portada de una lista (decorativa: el nombre va siempre al lado). */
function PortadaLista({
  lista,
  imagenUrl,
  uso = 'tarjeta',
  className,
  style,
}: PortadaListaProps) {
  const guardada = useImagenLista(imagenUrl === undefined ? lista : null)
  const url = imagenUrl === undefined ? guardada : imagenUrl
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        ...estiloPortadaLista(lista.plantillaId, url, uso),
        ...style,
      }}
    />
  )
}

export default PortadaLista
