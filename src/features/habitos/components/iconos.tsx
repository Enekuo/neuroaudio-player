import type { ReactNode } from 'react'

// Iconos del calendario de Hábitos: trazo de 1.8 y puntas redondas, como el
// resto de iconos de contorno de la app.

function Icono({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** Onda de audio: tres barras. Es el «mini icono» de los días con audio. */
export function IconoOnda({ className }: { className?: string }) {
  return (
    <Icono className={className}>
      <path d="M7 9v6" />
      <path d="M12 5v14" />
      <path d="M17 9v6" />
    </Icono>
  )
}

export function IconoChevron({
  direccion,
  className,
}: {
  direccion: 'izquierda' | 'derecha'
  className?: string
}) {
  return (
    <Icono className={className}>
      <path d={direccion === 'izquierda' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
    </Icono>
  )
}

export function IconoCerrar({ className }: { className?: string }) {
  return (
    <Icono className={className}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Icono>
  )
}

export function IconoPapelera({ className }: { className?: string }) {
  return (
    <Icono className={className}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </Icono>
  )
}

export function IconoCampana({ className }: { className?: string }) {
  return (
    <Icono className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icono>
  )
}

export function IconoReproducir({ className }: { className?: string }) {
  return (
    <Icono className={className}>
      <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
    </Icono>
  )
}

export function IconoMas({ className }: { className?: string }) {
  return (
    <Icono className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icono>
  )
}
