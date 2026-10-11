import { iniciales, type FotoPerfil as Foto } from '../modelo'
import type { VarianteFoto } from '../fotos/procesarFoto'
import { useFotoPerfil } from '../fotos/useFotoPerfil'

type FotoPerfilProps = {
  profesionalUid: string
  foto: Foto
  variante: VarianteFoto
  className?: string
}

/**
 * Una foto del perfil, descargada de forma privada. Mientras llega (o si no
 * se puede ver) deja un hueco del mismo tamaño, sin icono de imagen rota.
 */
export function FotoPerfil({
  profesionalUid,
  foto,
  variante,
  className,
}: FotoPerfilProps) {
  const url = useFotoPerfil(profesionalUid, foto.id, variante)
  if (!url) {
    return (
      <span
        className={`${className ?? ''} perfil-foto--cargando`}
        aria-hidden="true"
      />
    )
  }
  return (
    <img
      className={className}
      src={url}
      alt={foto.alt}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  )
}

type AvatarProfesionalProps = {
  profesionalUid: string
  nombre: string
  fotos: Foto[]
  fotoPrincipalId: string | null
  /** Lado en píxeles. */
  tamano: number
  className?: string
}

/**
 * Foto principal del profesional (recorte cuadrado) en círculo. Sin foto
 * principal, o mientras no se puede ver, muestra sus iniciales.
 */
export function AvatarProfesional({
  profesionalUid,
  nombre,
  fotos,
  fotoPrincipalId,
  tamano,
  className,
}: AvatarProfesionalProps) {
  const principal = fotos.find((f) => f.id === fotoPrincipalId) ?? null
  const url = useFotoPerfil(profesionalUid, principal?.id ?? null, 'cuadrada')
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.36 }
  const clase = `perfil-avatar ${className ?? ''}`

  if (url) {
    return (
      <img
        className={clase}
        src={url}
        alt={principal?.alt || nombre}
        style={estilo}
        draggable={false}
      />
    )
  }
  return (
    <span
      className={`${clase} perfil-avatar--iniciales`}
      style={estilo}
      role="img"
      aria-label={nombre || 'Profesional'}
    >
      {iniciales(nombre)}
    </span>
  )
}
