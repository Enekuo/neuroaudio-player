import { Link } from 'react-router-dom'
import type { PerfilProfesional } from '../modelo'
import { AvatarProfesional } from './FotoPerfil'

type ProfesionalCirculoProps = {
  profesionalUid: string
  perfil: PerfilProfesional
  /** Si se pasa, el círculo abre esa ruta (en la vista previa del panel, no). */
  to?: string
}

/**
 * Un profesional en la fila de Inicio: su foto principal en círculo (o sus
 * iniciales) y, debajo y centrado, su nombre. El nombre es texto
 * plano. Accesible: es un enlace con el nombre como etiqueta, y el texto
 * alternativo de la foto es el nombre.
 */
function ProfesionalCirculo({
  profesionalUid,
  perfil,
  to,
}: ProfesionalCirculoProps) {
  const nombre = perfil.nombre.trim()
  const contenido = (
    <>
      <AvatarProfesional
        profesionalUid={profesionalUid}
        nombre={nombre}
        fotos={perfil.fotos}
        fotoPrincipalId={perfil.fotoPrincipalId}
        tamano={104}
        alt={nombre}
        className="prof-circulo__foto"
      />
      <span className="prof-circulo__nombre">{nombre}</span>
    </>
  )

  if (!to) return <div className="prof-circulo">{contenido}</div>
  return (
    <Link
      to={to}
      className="prof-circulo prof-circulo--enlace"
      aria-label={nombre}
    >
      {contenido}
    </Link>
  )
}

/** Hueco gris con la misma forma, mientras carga. */
export function ProfesionalCirculoCargando() {
  return (
    <div className="prof-circulo prof-circulo--cargando" aria-hidden="true">
      <span className="prof-circulo__foto prof-circulo__esqueleto" />
      <span className="prof-circulo__linea" />
    </div>
  )
}

export default ProfesionalCirculo
