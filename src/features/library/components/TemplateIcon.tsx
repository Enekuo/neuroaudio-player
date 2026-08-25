export type TemplateIconName =
  | 'yinyang'
  | 'spiral'
  | 'refresh'
  | 'wave-sine'
  | 'om'
  | 'moon'
  | 'wind'
  | 'flame'
  | 'lista'
  | 'plus'

type TemplateIconProps = {
  name: TemplateIconName
}

function TemplateIcon({ name }: TemplateIconProps) {
  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'yinyang') {
    // Loto (Meditación)
    return (
      <svg {...baseProps}>
        <path d="M12 20.5c-2.7-3.2-2.7-9.6 0-16 2.7 6.4 2.7 12.8 0 16z" />
        <path d="M12 20.5C7.6 18.4 5 13.9 5 9.4c3.4 1.6 6 5.9 7 11.1z" />
        <path d="M12 20.5c4.4-2.1 7-6.6 7-11.1-3.4 1.6-6 5.9-7 11.1z" />
        <path d="M12 20.5c-5.3.3-9.7-2.4-11-6.6 4-.5 8.3 2 11 6.6z" />
        <path d="M12 20.5c5.3.3 9.7-2.4 11-6.6-4-.5-8.3 2-11 6.6z" />
      </svg>
    )
  }

  if (name === 'spiral') {
    // Diana (Hipnosis)
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6.4" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (name === 'refresh') {
    // Cerebro (Reprogramación)
    return (
      <svg {...baseProps}>
        <path d="M12 5C10.4 3.2 7.2 3.4 6.3 6 4.3 6.3 3 8 3.4 10c-1.2 1.3-1.1 3.4.4 4.4-.2 2.3 1.6 4 3.7 3.8C8.4 20 10.6 20.6 12 19" />
        <path d="M12 5c1.6-1.8 4.8-1.6 5.7 1 2 .3 3.3 2 2.9 4 1.2 1.3 1.1 3.4-.4 4.4.2 2.3-1.6 4-3.7 3.8C15.6 20 13.4 20.6 12 19" />
        <path d="M12 5v14" />
        <path d="M9 9c1.4.4 2 1.6 1.6 3" />
        <path d="M15 9c-1.4.4-2 1.6-1.6 3" />
      </svg>
    )
  }

  if (name === 'wave-sine') {
    // Pulso (Subliminales)
    return (
      <svg {...baseProps}>
        <path d="M2 12h4.5l1.8-.1L10 4.5l2.6 15L14.9 9l1.6 5.2 1.4-2.2H22" />
      </svg>
    )
  }

  if (name === 'om') {
    // Mantras: glifo tipográfico, no SVG
    return <span className="template-card__om">ॐ</span>
  }

  if (name === 'moon') {
    // Luna (Para dormir)
    return (
      <svg {...baseProps}>
        <path d="M20.6 15.2A9.2 9.2 0 0 1 8.8 3.4a9.4 9.4 0 1 0 11.8 11.8z" />
      </svg>
    )
  }

  if (name === 'wind') {
    // Nube con gota (Ansiedad)
    return (
      <svg {...baseProps}>
        <path d="M7.2 16.2h9.6a3.9 3.9 0 0 0 .4-7.8 6.1 6.1 0 0 0-11.5-.3 4 4 0 0 0 1.5 8.1z" />
        <path d="M12 18.4s-1.7 1.9-1.7 3a1.7 1.7 0 0 0 3.4 0c0-1.1-1.7-3-1.7-3z" />
      </svg>
    )
  }

  if (name === 'flame') {
    // Llama (Motivación)
    return (
      <svg {...baseProps}>
        <path d="M13.6 2.3c.5 2.6 2.1 3.9 3.4 5.4 1.4 1.6 2.2 3.4 2.2 5.6a7.2 7.2 0 0 1-14.4 0c0-2.6 1.3-4.4 2.7-5.7.6.9 1.5 1.5 2.4 1.4C11.9 8.7 12.4 5.7 13.6 2.3z" />
        <path d="M12 21.1c-1.7 0-3-1.2-3-2.8 0-1.6 1.4-2.3 2-3.5.3-.6.4-1.2.3-1.9 1.3.7 2.4 1.8 3.1 3 .4.7.6 1.5.6 2.4 0 1.6-1.3 2.8-3 2.8z" />
      </svg>
    )
  }

  if (name === 'lista') {
    return (
      <svg {...baseProps}>
        <path d="M6 6h12" />
        <path d="M6 12h12" />
        <path d="M6 18h7" />
      </svg>
    )
  }

  return (
    <svg {...baseProps}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export default TemplateIcon
