import { useState } from 'react'
import '../../styles/landing-cliente.css'
import { useReveal } from './useReveal'

// Captura de la pantalla de la app, sin marco: recortada de
// public/images/img_interfaz_movil.jfif (484 × 947). Sin ella, pantalla negra.
const IMAGEN_MOVIL = '/landing/movil-inicio.webp'

const LINEAS = [
  'Tu cliente toca y escucha. Sin descargas.',
  'Cada persona con su camino: audios personales y programas paso a paso.',
  'Tú lo gestionas todo desde un solo panel.',
]

function IconoCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

/**
 * Landing: lo que recibe el cliente del profesional en la app. Entre la
 * franja de confianza y «Para profesionales». A la izquierda el móvil, a la
 * derecha el texto; en móvil, el texto arriba. Sin botón.
 */
function ClienteAppSection() {
  const movil = useReveal<HTMLDivElement>()
  const texto = useReveal<HTMLDivElement>(120)
  const [sinImagen, setSinImagen] = useState(false)

  return (
    <section className="na-cliente" aria-labelledby="na-cliente-titulo">
      <div className="na-cliente__inner">
        <div
          ref={movil.ref}
          className={`na-cliente__movil ${movil.className}`}
          style={movil.style}
        >
          <span className="na-cliente__brillo" aria-hidden="true" />
          {/* Marco del móvil en HTML/CSS; la captura va dentro de la pantalla. */}
          <div className="na-cliente__telefono">
            <span className="na-cliente__boton na-cliente__boton--vol1" aria-hidden="true" />
            <span className="na-cliente__boton na-cliente__boton--vol2" aria-hidden="true" />
            <span className="na-cliente__boton na-cliente__boton--encendido" aria-hidden="true" />
            <div className="na-cliente__pantalla">
              {!sinImagen && (
                <img
                  className="na-cliente__captura"
                  src={IMAGEN_MOVIL}
                  alt="Pantalla de inicio de NeuroAudio en un móvil"
                  width={484}
                  height={947}
                  loading="lazy"
                  decoding="async"
                  onError={() => setSinImagen(true)}
                />
              )}
              <span className="na-cliente__isla" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div
          ref={texto.ref}
          className={`na-cliente__texto ${texto.className}`}
          style={texto.style}
        >
          <h2 id="na-cliente-titulo" className="na-cliente__titulo">
            Tus audios, directos al móvil de tu cliente.
          </h2>
          <p className="na-cliente__lead">
            Olvídate de WhatsApp, Drive y enlaces que caducan. Una app hecha
            para escuchar hipnosis, reprogramación y meditación.
          </p>
          <ul className="na-cliente__lineas">
            {LINEAS.map((linea) => (
              <li key={linea}>
                <span className="na-cliente__check">
                  <IconoCheck />
                </span>
                <span>{linea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ClienteAppSection
