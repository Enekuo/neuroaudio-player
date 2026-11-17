import { useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { crearTemaProfesional } from './profesionalTheme'
import {
  ModoColorContext,
  guardarPreferencia,
  leerPreferenciaGuardada,
  modoContrario,
  modoEfectivo,
  type PreferenciaModo,
} from './modoColor'

/**
 * Tema del panel profesional, en claro (por defecto), oscuro o el del
 * sistema (el del dispositivo, y cambia solo si el dispositivo cambia). Se
 * elige en Ajustes → Apariencia o con el botón de la luna de la barra de
 * utilidades (useModoColor), y se recuerda en este navegador.
 *
 * Mientras el panel está montado, GlobalStyles pasa el fondo del <body>, el
 * color-scheme y las barras de scroll al modo del panel (global.css los deja
 * oscuros para la app de usuario). Emotion quita esas reglas al salir del
 * panel, así que la app de usuario no las ve nunca.
 */
function ProveedorTemaProfesional({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState(leerPreferenciaGuardada)
  const dispositivoOscuro = useMediaQuery('(prefers-color-scheme: dark)', {
    noSsr: true,
  })
  const modo = modoEfectivo(preferencia, dispositivoOscuro)
  const tema = useMemo(() => crearTemaProfesional(modo), [modo])
  const modoColor = useMemo(() => {
    const cambiarPreferencia = (siguiente: PreferenciaModo) => {
      guardarPreferencia(siguiente)
      setPreferencia(siguiente)
    }
    return {
      modo,
      preferencia,
      cambiarPreferencia,
      alternarModo: () => cambiarPreferencia(modoContrario(modo)),
    }
  }, [modo, preferencia])
  // Barras de desplazamiento a juego con el fondo.
  const pulgar = modo === 'dark' ? '255, 255, 255' : '0, 0, 0'

  return (
    <ModoColorContext.Provider value={modoColor}>
      <ThemeProvider theme={tema}>
        <GlobalStyles
          styles={(theme) => ({
            ':root': {
              colorScheme: modo,
              // global.css pinta la raíz casi negra (app de usuario); sin
              // esto, el hueco de la barra de desplazamiento y el rebote del
              // scroll salían oscuros en modo claro.
              backgroundColor: theme.palette.background.default,
              scrollbarColor: `rgba(${pulgar}, 0.28) transparent`,
              // Móvil y tablet: se desplaza la página. Hueco de la barra
              // siempre reservado para que nada salte al cambiar de página.
              // (En escritorio se desplaza el contenido: ver ProfesionalLayout.)
              [theme.breakpoints.down('md')]: { scrollbarGutter: 'stable' },
            },
            body: { backgroundColor: theme.palette.background.default },
            '::-webkit-scrollbar-thumb': {
              backgroundColor: `rgba(${pulgar}, 0.22)`,
            },
            '::-webkit-scrollbar-thumb:hover': {
              backgroundColor: `rgba(${pulgar}, 0.36)`,
            },
          })}
        />
        {children}
      </ThemeProvider>
    </ModoColorContext.Provider>
  )
}

export default ProveedorTemaProfesional
