const STORAGE_KEY = 'neuroaudio:reduce-motion'

export function getStoredReducedMotion(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function applyReducedMotion(enabled: boolean) {
  document.documentElement.classList.toggle('reduce-motion', enabled)

  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // localStorage no disponible (modo privado, etc.): la clase igualmente se aplica en esta sesión.
  }
}
