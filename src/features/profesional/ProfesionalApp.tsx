import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import ProfesionalLayout from './layouts/ProfesionalLayout'
import DashboardProfesionalPage from './pages/DashboardProfesionalPage'
import SeccionProfesionalPage from './pages/SeccionProfesionalPage'
import PerfilPage from './perfil/PerfilPage'
import { SECCIONES_PROFESIONAL } from './data/secciones'
import { profesionalTheme } from './theme/profesionalTheme'
import { EASE_OUT } from './theme/movimiento'

/**
 * Punto de entrada del panel de profesional (/profesional/*). Es el único
 * sitio donde vive Material UI:
 * - App.tsx lo carga bajo demanda (React.lazy), así que MUI y Emotion ni
 *   siquiera se descargan en la parte de usuario.
 * - ThemeProvider aplica el tema solo a este árbol.
 * - ScopedCssBaseline hace el "reset" de Material solo dentro de este árbol
 *   (CssBaseline lo haría en <body> y afectaría a toda la app).
 * - Las reglas globales de global.css que tocan elementos sueltos (button,
 *   :focus-visible) se neutralizan aquí para los componentes de MUI, sin
 *   tocar la hoja de la parte de usuario.
 * - Mientras el panel está montado, GlobalStyles pasa el fondo del <body> y
 *   las barras de scroll a claro (global.css los deja oscuros). Emotion quita
 *   esas reglas al salir del panel, así que la app de usuario no las ve nunca.
 * Auth, Firebase, datos y reproductor siguen siendo los compartidos de main.tsx.
 */
function ProfesionalApp() {
  return (
    <ThemeProvider theme={profesionalTheme}>
      <GlobalStyles
        styles={(theme) => ({
          ':root': {
            colorScheme: 'light',
            scrollbarColor: 'rgba(0, 0, 0, 0.28) transparent',
          },
          body: { backgroundColor: theme.palette.background.default },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.22)',
          },
          '::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.36)',
          },
        })}
      />
      <ScopedCssBaseline
        sx={{
          // global.css encoge todo <button> al pulsar (scale 0.97); en el panel
          // la respuesta al pulsar la da el ripple de Material.
          '& button:active, & [role="button"]:active, & input[type="button"]:active, & input[type="submit"]:active':
            {
              transform: 'none',
            },
          // global.css pinta un contorno azul en :focus-visible; MUI ya marca el
          // foco de teclado con su propio estado (focusVisible + ripple).
          '& .MuiButtonBase-root:focus-visible': {
            outline: 'none',
          },
          // Press propio del panel en botones e iconos: se hunden un pelín
          // (scale 0.97, 160ms ease-out) a la vez que sale el ripple de Material.
          // Más específico que la anulación de arriba, así que gana a ella.
          '& .MuiButton-root, & .MuiIconButton-root': {
            transition: `background-color 200ms ease, border-color 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 160ms ${EASE_OUT}`,
          },
          '& .MuiButton-root:active, & .MuiIconButton-root:active': {
            transform: 'scale(0.97)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& .MuiButton-root:active, & .MuiIconButton-root:active': {
              transform: 'none',
            },
          },
        }}
      >
        <Routes>
          <Route element={<ProfesionalLayout />}>
            <Route index element={<DashboardProfesionalPage />} />
            {SECCIONES_PROFESIONAL.map((seccion) => (
              <Route
                key={seccion.path}
                path={seccion.path}
                element={
                  seccion.path === 'perfil' ? (
                    <PerfilPage />
                  ) : (
                    <SeccionProfesionalPage seccion={seccion} />
                  )
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/profesional" replace />} />
          </Route>
        </Routes>
      </ScopedCssBaseline>
    </ThemeProvider>
  )
}

export default ProfesionalApp
