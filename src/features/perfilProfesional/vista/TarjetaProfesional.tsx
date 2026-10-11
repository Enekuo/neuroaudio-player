import { Link } from 'react-router-dom'
import type { PerfilProfesional } from '../modelo'
import { AvatarProfesional } from './FotoPerfil'

type TarjetaProfesionalProps = {
  profesionalUid: string
  perfil: PerfilProfesional
  /** Si se pasa, la tarjeta abre el perfil completo. */
  to?: string
}

/**
 * Tarjeta del Inicio del oyente: foto principal, nombre y frase de su
 * profesional. Solo pinta lo que haya.
 */
function TarjetaProfesional({
  profesionalUid,
  perfil,
  to,
}: TarjetaProfesionalProps) {
  const contenido = (
    <>
      <AvatarProfesional
        profesionalUid={profesionalUid}
        nombre={perfil.nombre}
        fotos={perfil.fotos}
        fotoPrincipalId={perfil.fotoPrincipalId}
        tamano={56}
      />
      <span className="perfil-tarjeta__texto">
        <span className="perfil-tarjeta__etiqueta">Tu profesional</span>
        {perfil.nombre && (
          <span className="perfil-tarjeta__nombre">{perfil.nombre}</span>
        )}
        {perfil.frase && (
          <span className="perfil-tarjeta__frase">{perfil.frase}</span>
        )}
      </span>
      {to && (
        <svg
          className="perfil-tarjeta__flecha"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className="perfil-tarjeta perfil-tarjeta--enlace">
        {contenido}
      </Link>
    )
  }
  return <div className="perfil-tarjeta">{contenido}</div>
}

export default TarjetaProfesional
