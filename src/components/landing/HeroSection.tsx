import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/landing-hero.css'
import LogoNeuroAudio from './LogoNeuroAudio'
import { useReveal } from './useReveal'

// Foto de la portada (la pone Eneko). Mientras no esté, se ve un bloque del
// color de la pared de la foto (#e6b18d).
const FOTO_HERO = '/images/hero-persona.jpg'

// Pantalla del móvil de la portada: captura del reproductor de la app.
const IMAGEN_MOVIL = '/images/hero-mobile.png'

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
 * Portada: texto a la izquierda y, a la derecha, la foto a sangre (pegada
 * al borde derecho, de arriba abajo, con la esquina superior izquierda muy
 * redondeada). Delante, un móvil con una pantalla de ejemplo a caballo entre
 * el fondo y la foto, y una tarjeta del profesional sobre la pared. En móvil,
 * una columna: texto y, debajo, la foto con el móvil en su esquina.
 */
function HeroSection() {
  const seccion = useRef<HTMLElement>(null)
  const foto = useReveal<HTMLDivElement>()
  const movil = useReveal<HTMLDivElement>(150)
  // La tarjeta va sobre la pared naranja: sale cuando ya ha entrado.
  const tarjeta = useReveal<HTMLDivElement>(650)
  const [sinFoto, setSinFoto] = useState(false)

  // La landing es clara: barra de desplazamiento clara mientras se ve (la
  // sección oscura del móvil la vuelve oscura con «na-zona-oscura»).
  useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.add('na-portada-clara')
    return () => raiz.classList.remove('na-portada-clara')
  }, [])

  // Fondo «aurora»: se pausa cuando la portada no se ve en pantalla o la
  // pestaña está en segundo plano (atributos que lee landing-hero.css).
  useEffect(() => {
    const nodo = seccion.current
    if (!nodo) return
    const alCambiarPestana = () =>
      nodo.toggleAttribute('data-oculta', document.hidden)
    alCambiarPestana()
    document.addEventListener('visibilitychange', alCambiarPestana)
    let observador: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      observador = new IntersectionObserver(([entrada]) => {
        nodo.toggleAttribute('data-fuera', !entrada.isIntersecting)
      })
      observador.observe(nodo)
    }
    return () => {
      document.removeEventListener('visibilitychange', alCambiarPestana)
      observador?.disconnect()
    }
  }, [])


  return (
    <section ref={seccion} className="na-hero">
      {/* Fondo animado «aurora» detrás del texto (decorativo). */}
      <div className="hero-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <nav className="na-nav">
        {/* El mismo logotipo que el pie («N» + NeuroAudio). */}
        <Link
          to="/"
          className="na-nav__logo na-hero__logo"
          aria-label="NeuroAudio, inicio"
        >
          <LogoNeuroAudio />
        </Link>
        <ul className="na-nav__links">
          <li>Cómo funciona</li>
          <li>
            <a href="#para-profesionales">Profesionales</a>
          </li>
          <li>Precios</li>
          <li>
            <Link to="/contacto">Contacto</Link>
          </li>
        </ul>
        <div className="na-nav__actions">
          <Link to="/login" className="na-login">
            Iniciar sesión
          </Link>
          <Link to="/registro/profesional" className="na-btn-primary">
            Empezar gratis
          </Link>
        </div>
      </nav>

      <div className="na-hero__cuerpo">
        <div className="na-hero__content">
          <h1 className="na-hero__title">
            Plataforma de audios de bienestar
            <br />
            <em>para tus clientes.</em>
          </h1>
          <p className="na-hero__lead">
            Eleva la experiencia de tus clientes: reciben tus audios en un espacio
            propio, cómodo y cuidado, pensado para la meditación y la hipnosis.
          </p>
          <div className="na-hero__ctas">
            <Link to="/registro/profesional" className="na-cta-primary">
              Soy profesional
            </Link>
            <Link to="/registro/oyente" className="na-cta-secondary">
              Soy oyente
            </Link>
          </div>
          <ul className="na-hero__datos">
            <li>
              <IconoCheck />
              Cuenta gratis para empezar
            </li>
            <li>
              <IconoCheck />
              Solo los oyen quienes tú eliges
            </li>
          </ul>
        </div>
      </div>

      {/* Se vigila el contenedor (no el marco): así el naranja aparece en
          cuanto la zona de la derecha está en pantalla, sea cual sea su
          estado inicial (antes empezaba recortado del todo). */}
      <div ref={foto.ref} className="na-hero__visual">
        <div
          className={`na-hero__foto na-hero__aparece ${foto.className}`}
          style={foto.style}
        >
          {!sinFoto && (
            <img
              src={FOTO_HERO}
              alt="Mujer tumbada en un sofá escuchando audios con cascos, relajada"
              width={1152}
              height={928}
              loading="eager"
              // React 18 solo reconoce el atributo en minúsculas.
              {...{ fetchpriority: 'high' }}
              decoding="async"
              onError={() => setSinFoto(true)}
            />
          )}
        </div>

        <div
          ref={tarjeta.ref}
          className={`na-hero__aviso na-hero__sube ${tarjeta.className}`}
          style={tarjeta.style}
          aria-hidden="true"
        >
          <span className="na-hero__aviso-icono">
            <IconoCheck />
          </span>
          <span className="na-hero__aviso-texto">
            <strong>Programa enviado</strong>
            <span>3 audios · para Lucía</span>
          </span>
          <span className="na-hero__aviso-chip">En orden</span>
        </div>

        <div
          ref={movil.ref}
          className={`na-hero__movil na-hero__sube ${movil.className}`}
          style={movil.style}
          aria-hidden="true"
        >
          {/* Captura real de la app (reproductor), dentro del marco. */}
          <div className="na-hero__pantalla">
            <img
              src={IMAGEN_MOVIL}
              alt=""
              width={462}
              height={801}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
