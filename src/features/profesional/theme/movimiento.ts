import { keyframes, type CSSObject } from '@mui/material/styles'

// Movimiento del panel de profesional. Sobrio, como una consola de Google:
// entradas cortas (<300ms) con ease-out fuerte, solo transform y opacity.

/** Ease-out fuerte: arranca rápido (respuesta inmediata) y se posa suave. */
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

const REDUCIR_MOVIMIENTO = '@media (prefers-reduced-motion: reduce)'

const entrar = keyframes`
  from {
    opacity: 0;
    transform: translateY(var(--pro-entrada-y, 8px));
  }
  to {
    opacity: 1;
    transform: none;
  }
`

const fundir = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

type OpcionesEntrada = {
  /** Retardo en ms (para el stagger). */
  retardo?: number
  /** Duración en ms. */
  duracion?: number
  /** Desplazamiento vertical inicial en px. */
  distancia?: number
}

/**
 * Entrada "fade + leve subida" para páginas, tarjetas y bloques. Con
 * prefers-reduced-motion se queda en un fundido corto, sin desplazamiento.
 * (El ajuste "Reducir movimiento" de la app ya anula toda animación vía
 * la clase .reduce-motion de <html>; el estado final se mantiene por `both`.)
 */
export function animacionEntrada({
  retardo = 0,
  duracion = 280,
  distancia = 8,
}: OpcionesEntrada = {}): CSSObject {
  return {
    '--pro-entrada-y': `${distancia}px`,
    animation: `${entrar} ${duracion}ms ${EASE_OUT} ${retardo}ms both`,
    [REDUCIR_MOVIMIENTO]: {
      animation: `${fundir} 160ms ease ${Math.min(retardo, 80)}ms both`,
    },
  }
}

/** Fundido corto para cambios de texto (p. ej. el título de la cabecera en móvil). */
export function animacionFundido(duracion = 200): CSSObject {
  return { animation: `${fundir} ${duracion}ms ease both` }
}
