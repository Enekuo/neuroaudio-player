import { createContext, useContext } from 'react'
import type { PaletteMode } from '@mui/material/styles'

/** Clave de localStorage donde se recuerda la apariencia del panel (por navegador). */
export const CLAVE_MODO_PANEL = 'na-panel-profesional-modo'

/**
 * Apariencia elegida: claro, oscuro, o «sistema» (la del dispositivo, que
 * cambia sola si el dispositivo cambia).
 */
export type PreferenciaModo = 'sistema' | PaletteMode

/**
 * Valor guardado → apariencia elegida. Lo que no sea uno de los tres valores
 * (nada guardado, un valor viejo o roto) cae en claro, el aspecto de siempre.
 */
export function preferenciaDesdeGuardado(valor: string | null): PreferenciaModo {
  return valor === 'dark' || valor === 'sistema' ? valor : 'light'
}

/** Modo que se ve: el elegido o, con «sistema», el del dispositivo. */
export function modoEfectivo(
  preferencia: PreferenciaModo,
  dispositivoOscuro: boolean,
): PaletteMode {
  if (preferencia === 'sistema') return dispositivoOscuro ? 'dark' : 'light'
  return preferencia
}

/** El otro modo. */
export function modoContrario(modo: PaletteMode): PaletteMode {
  return modo === 'dark' ? 'light' : 'dark'
}

export function leerPreferenciaGuardada(): PreferenciaModo {
  try {
    return preferenciaDesdeGuardado(
      window.localStorage.getItem(CLAVE_MODO_PANEL),
    )
  } catch {
    // Navegación privada o almacenamiento bloqueado: claro, sin recordar.
    return 'light'
  }
}

export function guardarPreferencia(preferencia: PreferenciaModo) {
  try {
    window.localStorage.setItem(CLAVE_MODO_PANEL, preferencia)
  } catch {
    // Sin almacenamiento: el cambio vale para esta visita.
  }
}

type ModoColor = {
  /** Modo que se ve ahora. */
  modo: PaletteMode
  /** Lo elegido en Ajustes → Apariencia (o con el botón de la luna). */
  preferencia: PreferenciaModo
  cambiarPreferencia: (preferencia: PreferenciaModo) => void
  /** Botón de la luna: pasa al otro modo (y deja de seguir al sistema). */
  alternarModo: () => void
}

export const ModoColorContext = createContext<ModoColor>({
  modo: 'light',
  preferencia: 'light',
  cambiarPreferencia: () => {},
  alternarModo: () => {},
})

/** Modo claro/oscuro del panel profesional y cómo cambiarlo. */
export function useModoColor() {
  return useContext(ModoColorContext)
}
