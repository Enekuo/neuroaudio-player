import { useLayoutEffect, useState } from 'react'

function reducirMovimiento() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion')
  )
}

/**
 * Mantiene algo en pantalla un momento después de cerrarlo, para que pueda
 * salir con su animación (clase `is-closing`) en vez de desaparecer de golpe.
 * Con «Reducir animaciones» se quita al instante.
 */
export function useSalidaAnimada(abierto: boolean, duracionMs: number) {
  const [visible, setVisible] = useState(abierto)
  if (abierto && !visible) setVisible(true)
  const saliendo = visible && !abierto

  useLayoutEffect(() => {
    if (!saliendo) return
    if (reducirMovimiento()) {
      setVisible(false)
      return
    }
    const espera = window.setTimeout(() => setVisible(false), duracionMs)
    return () => window.clearTimeout(espera)
  }, [saliendo, duracionMs])

  return { visible, saliendo }
}
