import { useReveal } from './useReveal'

// Cifra mostrada en la frase. Debe ser real: cámbiala aquí si varía.
const PROFESIONALES = '1.000'

/**
 * Franja de confianza justo debajo del hero: una sola frase corta con la
 * cifra de profesionales y una línea mínima de apoyo debajo.
 */
function ProfessionalsSection() {
  const reveal = useReveal<HTMLDivElement>()

  return (
    <section className="na-proof" aria-label="Profesionales que usan NeuroAudio">
      <div ref={reveal.ref} className={`na-proof__inner ${reveal.className}`} style={reveal.style}>
        <p className="na-proof__title">
          Más de <strong>{PROFESIONALES} profesionales</strong> usan NeuroAudio
        </p>
        <p className="na-proof__lead">para dar a sus clientes la mejor experiencia posible con sus audios</p>
      </div>
    </section>
  )
}

export default ProfessionalsSection
