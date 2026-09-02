import { useReveal } from './useReveal'

const FAQ_ITEMS = [
  '¿Qué es NeuroAudio?',
  '¿Puedo subir mis propios audios?',
  '¿Necesito ser profesional para usar NeuroAudio?',
  '¿Cómo funciona el acceso de un profesional a mis audios?',
  '¿Tiene anuncios NeuroAudio?',
]

type FaqItemProps = {
  question: string
  index: number
}

function FaqItem({ question, index }: FaqItemProps) {
  const { ref, className, style } = useReveal<HTMLButtonElement>(index * 70)

  return (
    <button ref={ref} type="button" className={`na-faq__item ${className}`} style={style}>
      <span className="na-faq__q">{question}</span>
      <span className="na-faq__plus" aria-hidden="true">
        +
      </span>
    </button>
  )
}

function Faq() {
  const heading = useReveal<HTMLHeadingElement>()
  const lead = useReveal<HTMLParagraphElement>(90)
  const more = useReveal<HTMLAnchorElement>(FAQ_ITEMS.length * 70 + 60)

  return (
    <section className="na-faq">
      <h2 ref={heading.ref} className={`na-faq__title ${heading.className}`} style={heading.style}>
        Preguntas frecuentes
      </h2>
      <p ref={lead.ref} className={`na-faq__lead ${lead.className}`} style={lead.style}>
        Todo lo que necesitas saber sobre cómo guardar y escuchar tus audios de bienestar con NeuroAudio.
      </p>

      <div className="na-faq__list">
        {FAQ_ITEMS.map((question, index) => (
          <FaqItem key={question} question={question} index={index} />
        ))}
      </div>

      <a ref={more.ref} href="#" className={`na-faq__more ${more.className}`} style={more.style}>
        Ver todas las preguntas
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </a>
    </section>
  )
}

export default Faq
