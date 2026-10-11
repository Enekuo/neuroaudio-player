import {
  OPCIONES_RESPUESTA,
  REDES,
  type PerfilProfesional,
  type Red,
} from '../modelo'
import { AvatarProfesional, FotoPerfil } from './FotoPerfil'

const ETIQUETA_RED: Record<Red, string> = {
  web: 'Web',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

type VistaPerfilOyenteProps = {
  profesionalUid: string
  perfil: PerfilProfesional
  /** Muestra arriba el mensaje de bienvenida (la primera vez que entra). */
  mostrarBienvenida?: boolean
}

/**
 * Perfil completo del profesional tal como lo ve su oyente. Todo el texto es
 * texto plano: React lo escapa y los saltos de línea se respetan con CSS
 * (white-space: pre-line), así que un «<script>» se ve como texto. Si el
 * perfil está a medias, solo se pinta lo que haya. Nunca muestra insignias
 * de verificación: todavía no existe la verificación.
 */
function VistaPerfilOyente({
  profesionalUid,
  perfil,
  mostrarBienvenida = false,
}: VistaPerfilOyenteProps) {
  // Solo enlaces https (las reglas ya lo exigen; esto es una segunda barrera).
  const enlaces = REDES.filter((red) =>
    perfil.enlaces[red]?.startsWith('https://'),
  )
  const respuesta = OPCIONES_RESPUESTA.find((o) => o.valor === perfil.respuesta)
  const galeria = perfil.fotos.filter((f) => f.id !== perfil.fotoPrincipalId)
  const secciones = perfil.secciones.filter(
    (s) =>
      s.visible && (s.titulo.trim() || s.texto.trim() || s.fotoIds.length > 0),
  )
  const fotoPorId = new Map(perfil.fotos.map((f) => [f.id, f]))

  return (
    <article className="perfil-oyente" aria-label={perfil.nombre || 'Perfil'}>
      {mostrarBienvenida && perfil.bienvenida.trim() && (
        <section
          className="perfil-oyente__bienvenida"
          aria-label="Mensaje de bienvenida"
        >
          <p className="perfil-oyente__bienvenida-etiqueta">
            Mensaje de bienvenida
          </p>
          <p className="perfil-oyente__texto">{perfil.bienvenida}</p>
        </section>
      )}

      <header className="perfil-oyente__cabecera">
        <AvatarProfesional
          profesionalUid={profesionalUid}
          nombre={perfil.nombre}
          fotos={perfil.fotos}
          fotoPrincipalId={perfil.fotoPrincipalId}
          tamano={112}
        />
        {perfil.nombre && (
          <h1 className="perfil-oyente__nombre">{perfil.nombre}</h1>
        )}
        {perfil.frase && <p className="perfil-oyente__frase">{perfil.frase}</p>}
        {respuesta && (
          <p className="perfil-oyente__respuesta">
            Suele responder {respuesta.etiqueta.toLowerCase()}
          </p>
        )}
        {enlaces.length > 0 && (
          <ul className="perfil-oyente__enlaces" aria-label="Enlaces">
            {enlaces.map((red) => (
              <li key={red}>
                <a
                  className="perfil-oyente__enlace"
                  href={perfil.enlaces[red]}
                  target="_blank"
                  rel="noopener nofollow"
                >
                  {ETIQUETA_RED[red]}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      {perfil.dedicacion.trim() && (
        <section className="perfil-oyente__bloque">
          <h2 className="perfil-oyente__titulo">A qué me dedico</h2>
          <p className="perfil-oyente__texto">{perfil.dedicacion}</p>
        </section>
      )}

      {galeria.length > 0 && (
        <section className="perfil-oyente__bloque" aria-label="Fotos">
          <div className="perfil-oyente__galeria">
            {galeria.map((foto) => (
              <FotoPerfil
                key={foto.id}
                profesionalUid={profesionalUid}
                foto={foto}
                variante="normal"
                className="perfil-oyente__foto"
              />
            ))}
          </div>
        </section>
      )}

      {secciones.map((seccion) => {
        const fotos = seccion.fotoIds
          .map((id) => fotoPorId.get(id))
          .filter((f): f is NonNullable<typeof f> => Boolean(f))
        return (
          <section key={seccion.id} className="perfil-oyente__bloque">
            {seccion.titulo.trim() && (
              <h2 className="perfil-oyente__titulo">{seccion.titulo}</h2>
            )}
            {seccion.texto.trim() && (
              <p className="perfil-oyente__texto">{seccion.texto}</p>
            )}
            {fotos.length > 0 && (
              <div className="perfil-oyente__galeria">
                {fotos.map((foto) => (
                  <FotoPerfil
                    key={foto.id}
                    profesionalUid={profesionalUid}
                    foto={foto}
                    variante="normal"
                    className="perfil-oyente__foto"
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </article>
  )
}

export default VistaPerfilOyente
