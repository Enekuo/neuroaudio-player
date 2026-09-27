// Detecta si la app se está ejecutando empaquetada con Capacitor (app nativa
// iOS/Android) en vez de en un navegador web normal. El runtime de Capacitor
// inyecta un objeto global `window.Capacitor` tanto si el paquete
// @capacitor/core está instalado como dependencia como si no, así que este
// chequeo ya funciona hoy (Capacitor todavía no está en el proyecto) y
// seguirá funcionando el día que se empaquete, sin tocar nada más.
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return capacitor?.isNativePlatform?.() ?? false
}
