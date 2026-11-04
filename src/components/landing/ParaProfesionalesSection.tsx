import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

type Punto = { titulo: string; texto: string; icono: ReactNode }

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const PUNTOS: Punto[] = [
  {
    titulo: 'Biblioteca de audios',
    texto: 'Sube cada audio una sola vez y úsalo donde quieras.',
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M10 15.5v-4l4-1v4" />
      </svg>
    ),
  },
  {
    titulo: 'Audios generales y personales',
    texto: 'Para todos tus oyentes o solo para una persona.',
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.5a3 3 0 0 1 0 5.5M18 19a5.5 5.5 0 0 0-2.5-4.6" />
      </svg>
    ),
  },
  {
    titulo: 'Programas paso a paso',
    texto:
      'Ordena audios y elige cómo se abren: libre, en orden o por calendario.',
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="m3.5 6.5 1.5 1.5 3-3" />
        <path d="M11 6.5h9.5M11 12.5h9.5M11 18.5h9.5" />
        <circle cx="5.5" cy="12.5" r="1.6" />
        <circle cx="5.5" cy="18.5" r="1.6" />
      </svg>
    ),
  },
  {
    titulo: 'Tus oyentes',
    texto: 'Quién tiene acceso, a qué, y tus notas privadas de cada persona.',
    icono: (
      <svg viewBox="0 0 24 24" {...trazo}>
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M14 4v4h4" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
]

/** Ilustración del panel (HTML/CSS, textos genéricos; sin datos reales). */
function IlustracionPanel() {
  return (
    <div className="na-pro__panel" aria-hidden="true">
      <div className="na-pro__panel-barra">
        <span />
        <span />
        <span />
      </div>
      <div className="na-pro__panel-cuerpo">
        <div className="na-pro__panel-lateral">
          <span className="is-activo" />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="na-pro__panel-tarjeta">
          <p className="na-pro__panel-titulo">Nombre del programa</p>
          <div className="na-pro__panel-chips">
            <span className="na-pro__chip">Borrador</span>
            <span className="na-pro__chip na-pro__chip--verde">
              Para todos mis oyentes
            </span>
            <span className="na-pro__chip">1 audio a la semana</span>
          </div>
          <ol className="na-pro__panel-pasos">
            {[1, 2, 3].map((n) => (
              <li key={n}>
                <span className="na-pro__panel-num">{n}</span>
                <span className="na-pro__panel-audio">
                  Audio de la Biblioteca
                </span>
                <span className="na-pro__panel-flechas">
                  <svg viewBox="0 0 24 24" {...trazo}>
                    <path d="M12 19V5M6 11l6-6 6 6" />
                  </svg>
                  <svg viewBox="0 0 24 24" {...trazo}>
                    <path d="M12 5v14M6 13l6 6 6-6" />
                  </svg>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

/**
 * Landing: «Para profesionales», bajo la franja de confianza. Explica que
 * NeuroAudio también es un software para gestionar sus audios y a las
 * personas que los escuchan, con una ilustración clara del panel.
 */
function ParaProfesionalesSection() {
  const texto = useReveal<HTMLDivElement>()
  const ilustracion = useReveal<HTMLElement>(120)

  return (
    <section
      id="para-profesionales"
      className="na-pro"
      aria-labelledby="na-pro-titulo"
    >
      <div className="na-pro__inner">
        <div
          ref={texto.ref}
          className={`na-pro__texto ${texto.className}`}
          style={texto.style}
        >
          <p className="na-pro__eyebrow">
            <span className="na-pro__eyebrow-dot" aria-hidden="true" />
            ¿Eres profesional?
          </p>
          <h2 id="na-pro-titulo" className="na-pro__titulo">
            NeuroAudio es más que <em>un reproductor</em>
          </h2>
          <p className="na-pro__lead">
            Es un software para gestionar tus audios y a las personas que los
            escuchan. Tú creas una vez; NeuroAudio se ocupa del resto.
          </p>
          <ul className="na-pro__puntos">
            {PUNTOS.map((p) => (
              <li key={p.titulo}>
                <span className="na-pro__icono" aria-hidden="true">
                  {p.icono}
                </span>
                <span>
                  <strong>{p.titulo}</strong>
                  <span className="na-pro__punto-texto">{p.texto}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link to="/profesional" className="na-cta-primary na-pro__cta">
            Conocer el panel profesional
          </Link>
        </div>
        <figure
          ref={ilustracion.ref}
          className={`na-pro__ilustracion ${ilustracion.className}`}
          style={ilustracion.style}
        >
          <IlustracionPanel />
          <figcaption className="na-pro__nota">
            Imagen de ejemplo del panel
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

export default ParaProfesionalesSection
