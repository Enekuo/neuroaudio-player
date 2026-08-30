type LibraryIconProps = {
  name: 'moon' | 'cloud' | 'spark' | 'wave' | 'music' | 'clock' | 'plus' | 'options' | 'options-vertical'
}

function LibraryIcon({ name }: LibraryIconProps) {
  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'moon') {
    return (
      <svg {...baseProps}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    )
  }

  if (name === 'cloud') {
    return (
      <svg {...baseProps}>
        <path d="M7 18a4 4 0 1 1 .5-7.95 5.5 5.5 0 1 1 10.4 1.8A3.5 3.5 0 0 1 17 18Z" />
      </svg>
    )
  }

  if (name === 'spark') {
    return (
      <svg {...baseProps}>
        <path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8L12 3Z" />
      </svg>
    )
  }

  if (name === 'wave') {
    return (
      <svg {...baseProps}>
        <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      </svg>
    )
  }

  if (name === 'music') {
    return (
      <svg {...baseProps}>
        <path d="M9 18V6l10-2v12" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="16" r="2" />
      </svg>
    )
  }

  if (name === 'clock') {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (name === 'options') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="5" cy="12" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="19" cy="12" r="1.7" />
      </svg>
    )
  }

  if (name === 'options-vertical') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="12" cy="19" r="1.7" />
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

export default LibraryIcon
