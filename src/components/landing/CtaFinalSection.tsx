import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/landing-cta-final.css'
import { useReveal } from './useReveal'

/**
 * Landing: llamada final antes del pie. Bloque claro con el borde superior
 * curvado hacia dentro y manchas de color estáticas (azul, celeste y lila)
 * detrás; en el centro, un brillo blanco para que el texto se lea.
 */
function CtaFinalSection() {
  const bloque = useReveal<HTMLDivElement>()
  const seccion = useRef<HTMLElement>(null)

  // Las animaciones continuas (manchas y botón) se pausan fuera de pantalla
  // o con la pestaña en segundo plano.
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
    <section
      ref={seccion}
      className="na-cta-final"
      aria-labelledby="na-cta-final-titulo"
    >
      <div
        ref={bloque.ref}
        className={`na-cta-final__bloque ${bloque.className}`}
        style={bloque.style}
      >
        <div className="na-cta-final__manchas" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="na-cta-final__contenido">
          <h2 id="na-cta-final-titulo" className="na-cta-final__titulo">
            Mejora la experiencia de tus clientes con NeuroAudio.
          </h2>
          <p className="na-cta-final__sub">
            Crea tu cuenta gratis y sube tu primer audio
          </p>
          {/* El mismo botón que estaba en el pie (misma clase y estilo). */}
          <Link to="/login" className="na-footer__cta">
            Únete a NeuroAudio gratis
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CtaFinalSection
