import { useEffect, useState } from 'react'

// Misma condición que los bloques "@media (max-width: 640px), (hover: none)
// and (pointer: coarse)" de global.css, para que el JSX que cambia de sitio
// en móvil siga exactamente el mismo corte que el CSS.
const MOBILE_QUERY = '(max-width: 640px), (hover: none) and (pointer: coarse)'

export function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    const handleChange = () => setIsMobile(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
