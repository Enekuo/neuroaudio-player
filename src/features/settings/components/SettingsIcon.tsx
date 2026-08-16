export type SettingsIconName = 'settings' | 'cuenta' | 'privacidad' | 'plan' | 'uso' | 'logout' | 'close' | 'warning'

type SettingsIconProps = {
  name: SettingsIconName
}

function SettingsIcon({ name }: SettingsIconProps) {
  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'settings') {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    )
  }

  if (name === 'cuenta') {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      </svg>
    )
  }

  if (name === 'privacidad') {
    return (
      <svg {...baseProps}>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      </svg>
    )
  }

  if (name === 'plan') {
    return (
      <svg {...baseProps}>
        <path d="m12 3 2.4 5.2 5.6.6-4.2 3.8 1.2 5.6-4.8-3-4.8 3 1.2-5.6L4.4 8.8l5.6-.6L12 3Z" />
      </svg>
    )
  }

  if (name === 'uso') {
    return (
      <svg {...baseProps}>
        <path d="M4 20V10" />
        <path d="M12 20V4" />
        <path d="M20 20v-7" />
      </svg>
    )
  }

  if (name === 'logout') {
    return (
      <svg {...baseProps}>
        <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    )
  }

  if (name === 'warning') {
    return (
      <svg {...baseProps}>
        <path d="M12 3.5 21 19H3L12 3.5Z" />
        <path d="M12 10v4" />
        <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return (
    <svg {...baseProps}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

export default SettingsIcon
