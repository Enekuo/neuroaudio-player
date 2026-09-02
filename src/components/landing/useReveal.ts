import { useEffect, useRef, useState } from 'react'

/**
 * Da un ref + una clase para animar la entrada de un elemento cuando aparece en pantalla al
 * hacer scroll (fade + desplazamiento hacia arriba). Se dispara una sola vez (no se vuelve a
 * ocultar si sales del viewport). Usar junto con la clase CSS `na-reveal` / `is-visible`.
 */
export function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const className = `na-reveal${isVisible ? ' is-visible' : ''}`
  const style = delay ? { '--reveal-delay': `${delay}ms` } : undefined

  return { ref, isVisible, className, style }
}
