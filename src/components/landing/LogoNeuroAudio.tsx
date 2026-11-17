import { useId } from 'react'
// Su fuente, alojada en el proyecto: así se ve igual también en el panel.
import '@fontsource/poppins/600.css'
import '../../styles/logo.css'

/**
 * Logotipo de NeuroAudio: la «N» como una cinta doblada (barras en azul
 * claro con luz desde arriba; la diagonal, en azul intenso, pasa por encima
 * y proyecta una sombra suave sobre las barras) y, a su derecha,
 * «NeuroAudio». El tamaño se ajusta con --logo-n y --logo-texto desde quien
 * lo usa; el texto toma el color del enlace que lo contiene.
 */
function LogoNeuroAudio() {
  // Ids únicos: el logotipo aparece varias veces en la página.
  const id = useId().replace(/:/g, '')
  const barra = `${id}-barra`
  const diagonal = `${id}-diagonal`
  const recorte = `${id}-recorte`
  const sombra = `${id}-sombra`

  return (
    <span className="na-logo">
      <svg className="na-logo__n" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id={barra} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cbcff" />
            <stop offset="1" stopColor="#3f86fe" />
          </linearGradient>
          <linearGradient id={diagonal} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2a2ff2" />
            <stop offset="1" stopColor="#4c63ff" />
          </linearGradient>
          <clipPath id={recorte}>
            <rect x="3" y="3" width="11" height="34" rx="5.5" />
            <rect x="26" y="3" width="11" height="34" rx="5.5" />
          </clipPath>
          <filter id={sombra} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.3" />
          </filter>
        </defs>

        {/* Barras verticales. */}
        <rect
          x="3"
          y="3"
          width="11"
          height="34"
          rx="5.5"
          fill={`url(#${barra})`}
        />
        <rect
          x="26"
          y="3"
          width="11"
          height="34"
          rx="5.5"
          fill={`url(#${barra})`}
        />

        {/* Pliegue: sombra de la diagonal, solo sobre las barras. */}
        <g clipPath={`url(#${recorte})`}>
          <path
            d="M8.5 8.5 31.5 31.5"
            stroke="#0b1460"
            strokeOpacity="0.7"
            strokeWidth="11"
            strokeLinecap="round"
            transform="translate(1.8 2.6)"
            filter={`url(#${sombra})`}
          />
        </g>

        {/* Diagonal por encima, con un brillo fino en su borde superior. */}
        <path
          d="M8.5 8.5 31.5 31.5"
          stroke={`url(#${diagonal})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M7.2 11.6 28.4 32.8"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="na-logo__texto">NeuroAudio</span>
    </span>
  )
}

export default LogoNeuroAudio
