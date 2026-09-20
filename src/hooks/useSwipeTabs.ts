import { useRef, type TouchEvent } from 'react'

const MIN_SWIPE_DISTANCE = 50
const HORIZONTAL_DOMINANCE_RATIO = 1.5

type SwipeTabHandlers = {
  onTouchStart: (event: TouchEvent) => void
  onTouchMove: () => void
  onTouchEnd: (event: TouchEvent) => void
}

/**
 * Navegación por swipe horizontal entre pestañas: deslizar a la izquierda pasa a
 * la siguiente pestaña, a la derecha a la anterior. En los extremos no hace nada.
 *
 * Solo cambia de pestaña si el gesto es claramente horizontal (distancia mínima +
 * predominio sobre el desplazamiento vertical); todo se decide en touchend y nunca
 * se llama a preventDefault, así que el scroll vertical nativo no se ve afectado.
 */
export function useSwipeTabs<TTab extends string>(
  tabs: readonly TTab[],
  activeTab: TTab,
  onChangeTab: (tab: TTab) => void,
): SwipeTabHandlers {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchMove() {
    // Nada que hacer: se decide todo en touchend para no interferir con el scroll.
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStartRef.current
    touchStartRef.current = null

    if (!start) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX < MIN_SWIPE_DISTANCE || absX < absY * HORIZONTAL_DOMINANCE_RATIO) {
      return
    }

    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex === -1) {
      return
    }

    const targetIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
    if (targetIndex >= 0 && targetIndex < tabs.length) {
      onChangeTab(tabs[targetIndex])
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
