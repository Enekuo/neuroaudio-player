import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from './useReveal'

type PlanCardProps = {
  index: number
  highlight?: boolean
  badge?: string
  name: string
  description: string
  price: ReactNode
  ctaLabel: string
  ctaVariant: 'outline' | 'primary' | 'light'
  features: string[]
}

function PlanCard({ index, highlight, badge, name, description, price, ctaLabel, ctaVariant, features }: PlanCardProps) {
  const { ref, className, style } = useReveal<HTMLDivElement>(index * 110)

  return (
    <div
      ref={ref}
      className={`na-plan${highlight ? ' na-plan--highlight' : ''} ${className}`}
      style={style}
    >
      {badge ? <div className="na-plan__badge">{badge}</div> : null}
      <div>
        <div className="na-plan__name">{name}</div>
        <div className="na-plan__desc">{description}</div>
      </div>
      <div className="na-plan__price">{price}</div>
      <Link to="/login" className={`na-plan__cta na-plan__cta--${ctaVariant}`}>
        {ctaLabel}
      </Link>
      <ul className="na-plan__features">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  )
}

function Pricing() {
  const heading = useReveal<HTMLHeadingElement>()
  const lead = useReveal<HTMLParagraphElement>(90)
  const toggle = useReveal<HTMLDivElement>(160)

  return (
    <section className="na-pricing">
      <h2 ref={heading.ref} className={`na-pricing__title ${heading.className}`} style={heading.style}>
        Empieza a guardar tus audios gratis
      </h2>
      <p ref={lead.ref} className={`na-pricing__lead ${lead.className}`} style={lead.style}>
        Elige el plan que mejor se ajuste a ti
      </p>

      <div ref={toggle.ref} className={`na-pricing__toggle ${toggle.className}`} style={toggle.style}>
        <span>Mensual</span>
        <span className="is-active">✓ Anual</span>
        <span className="na-pricing__badge">[Ahorra X%]</span>
      </div>

      <div className="na-pricing__grid">
        <PlanCard
          index={0}
          name="Plan gratuito"
          description="Tu punto de partida."
          price={
            <>
              0&nbsp;€ <span>/mes</span>
            </>
          }
          ctaLabel="Empezar gratis"
          ctaVariant="outline"
          features={['Tu biblioteca personal', 'Sube y organiza tus audios', 'Acceso desde web y móvil']}
        />

        <PlanCard
          index={1}
          highlight
          badge="Más popular"
          name="Plan Pro"
          description="Para tu colección completa."
          price={
            <>
              [Precio]&nbsp;€ <span>/mes</span>
            </>
          }
          ctaLabel="Suscribirse"
          ctaVariant="primary"
          features={[
            'Todo lo del plan gratuito',
            'Recibe audios de tus profesionales',
            'Repetición y programación de inicio',
            'Sin anuncios',
          ]}
        />

        <PlanCard
          index={2}
          name="Plan Premium"
          description="Para profesionales."
          price={
            <>
              [Precio]&nbsp;€ <span>/mes</span>
            </>
          }
          ctaLabel="Suscribirse"
          ctaVariant="light"
          features={['Todo lo del plan Pro', 'Da acceso a tus clientes', 'Panel de profesional', 'Soporte prioritario']}
        />
      </div>
    </section>
  )
}

export default Pricing
