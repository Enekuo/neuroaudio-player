import { createTheme, type PaletteMode } from '@mui/material/styles'
import { EASE_OUT } from './movimiento'

// Colores propios del panel que no tienen sitio en la paleta estándar de MUI
// (cambian con el modo claro/oscuro).
declare module '@mui/material/styles' {
  interface Palette {
    pro: {
      /** Iconos de la barra de utilidades (gris casi negro). */
      icono: string
      /** Texto de los elementos del menú izquierdo. */
      navTexto: string
      /** Fondo al pasar el ratón por un elemento del menú o un icono. */
      hover: string
      /** Fondo al pasar el ratón por el elemento seleccionado. */
      activoHover: string
      /** Verde de «Para todos» (misma familia que el azul). */
      verdeFondo: string
      verdeTexto: string
    }
  }
  interface PaletteOptions {
    pro?: Palette['pro']
  }
}

// Paletas: la clara es la de siempre (consolas de Google: azul #1a73e8,
// textos gris carbón, bordes #dadce0, fondo casi blanco con tarjetas blancas).
// La oscura es la de las consolas de Google en oscuro (Firebase, Gmail):
// grises neutros, nada de negro puro, y el azul pasa a su tono claro.
const PALETAS = {
  light: {
    mode: 'light',
    primary: {
      main: '#1a73e8',
      // light/dark: pareja «seleccionado» (fondo azul suave + texto azul).
      light: '#e8f0fe',
      dark: '#1967d2',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
    },
    divider: '#dadce0',
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    pro: {
      icono: '#444746',
      navTexto: '#3c4043',
      hover: 'rgba(60, 64, 67, 0.08)',
      activoHover: '#d2e3fc',
      verdeFondo: '#e6f4ea',
      verdeTexto: '#137333',
    },
  },
  dark: {
    mode: 'dark',
    primary: {
      main: '#a8c7fa',
      light: '#004a77',
      dark: '#c2e7ff',
      contrastText: '#062e6f',
    },
    text: {
      primary: '#e3e3e3',
      secondary: '#c4c7c5',
    },
    divider: '#444746',
    background: {
      default: '#131314',
      paper: '#1e1f20',
    },
    pro: {
      icono: '#e3e3e3',
      navTexto: '#e3e3e3',
      hover: 'rgba(227, 227, 227, 0.08)',
      activoHover: '#0b5a8a',
      verdeFondo: '#0f5223',
      verdeTexto: '#c4eed0',
    },
  },
} as const

/**
 * Tema de Material UI del panel de profesional, en claro u oscuro. Solo se
 * aplica dentro de ProfesionalApp.
 */
export function crearTemaProfesional(modo: PaletteMode) {
  return createTheme({
    palette: PALETAS[modo],
    shape: {
      borderRadius: 8,
    },
    transitions: {
      // Las entradas de MUI (drawer móvil, menús, tooltips) con el mismo
      // ease-out fuerte que el resto del panel; las salidas siguen en "sharp".
      easing: {
        easeOut: EASE_OUT,
      },
    },
    typography: {
      fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif",
      button: {
        // Las consolas de Google usan botones en minúscula normal, no en MAYÚSCULAS.
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    components: {
      MuiAppBar: {
        defaultProps: {
          color: 'inherit',
          elevation: 0,
        },
      },
      // En oscuro, MUI aclara las superficies elevadas con una capa blanca;
      // las consolas de Google usan superficies planas.
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
    },
  })
}

/** Tema claro (el de siempre). */
export const profesionalTheme = crearTemaProfesional('light')
