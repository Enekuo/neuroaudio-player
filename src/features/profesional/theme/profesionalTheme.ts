import { createTheme } from '@mui/material/styles'
import { EASE_OUT } from './movimiento'

// Tema de Material UI del panel de profesional: Material claro con los
// colores de las consolas de Google (Gmail, Analytics): azul #1a73e8, textos
// gris carbón, bordes #dadce0 y fondo de trabajo casi blanco con tarjetas
// blancas. Solo se aplica dentro de ProfesionalApp.
export const profesionalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8',
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
  },
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
  },
})
