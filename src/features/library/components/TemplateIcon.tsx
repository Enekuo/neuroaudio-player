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
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'yinyang') {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9 9 9 0 0 1 0-18Z" />
        <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (name === 'spiral') {
    return (
      <svg {...baseProps}>
        <path d="M12 12.5a2 2 0 1 0 -2 -2" />
        <path d="M12 12.5a4.2 4.2 0 1 1 -4.2 -4.2" />
        <path d="M12 12.5a6.4 6.4 0 1 0 -6.4 -6.4" />
        <path d="M12 12.5a8.6 8.6 0 1 1 -8.6 -8.6" />
      </svg>
    )
  }

  if (name === 'refresh') {
    return (
      <svg {...baseProps}>
        <path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6" />
        <path d="M4 4v4.6h4.6" />
        <path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.4" />
        <path d="M20 20v-4.6h-4.6" />
      </svg>
    )
  }

  if (name === 'wave-sine') {
    return (
      <svg {...baseProps}>
        <path d="M2 12c1.2-5 3.3-5 4.5 0s3.3 5 4.5 0 3.3-5 4.5 0 3.3 5 4.5 0" />
      </svg>
    )
  }

  if (name === 'om') {
    return (
      <svg {...baseProps}>
        <path d="M4 15a3.2 3.2 0 1 1 3.6 -3.2A3 3 0 1 1 11 15c0 2-2 3-4 3" />
        <path d="M14 15a3 3 0 1 0 3-4.5c-1.5 0-2.2-1-1.6-2.2" />
        <path d="M17.5 5.2a1 1 0 1 0 1 -1" />
        <path d="M19.5 8c-1.3 0-2-1-1.5-2.3" />
      </svg>
    )
  }

  if (name === 'moon') {
    return (
      <svg {...baseProps}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    )
  }

  if (name === 'wind') {
    return (
      <svg {...baseProps}>
        <path d="M2 8h11a2.5 2.5 0 1 0-2-4" />
        <path d="M2 13h15a2.5 2.5 0 1 1-2 4" />
        <path d="M2 18h9" />
      </svg>
    )
  }

  if (name === 'flame') {
    return (
      <svg {...baseProps}>
        <path d="M12 3c1.2 2.8-1.6 4.3-1.6 7.2a3.6 3.6 0 0 0 7.2 0c0-1.4-.6-2.2-.6-2.2s.6 3-1.6 3a1.6 1.6 0 0 1-1.6-1.6c0-1.8 1.6-2.6 1.6-5.4-2.4 1-4.8 3.6-4.8 6.8a5.4 5.4 0 0 0 10.8 0C21.4 6.6 15.6 4.6 12 3Z" />
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
