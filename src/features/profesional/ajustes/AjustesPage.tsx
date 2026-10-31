import {
  Link as EnlaceRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CuentaAjustes from './CuentaAjustes'
import GeneralAjustes from './GeneralAjustes'
import PlanYUsoAjustes from './PlanYUsoAjustes'
import PrivacidadAjustes from './PrivacidadAjustes'
import { animacionPestana } from '../theme/movimiento'

// Las páginas de Ajustes, en el mismo orden que en el oyente.
const PAGINAS: { path: string; label: string }[] = [
  { path: 'general', label: 'General' },
  { path: 'cuenta', label: 'Cuenta' },
  { path: 'privacidad', label: 'Privacidad' },
  { path: 'plan-y-uso', label: 'Plan y uso' },
]

/**
 * «Ajustes» (/profesional/ajustes/*): las mismas páginas que los ajustes del
 * oyente (General, Cuenta, Privacidad y «Plan y uso»), cada una en su
 * dirección, con el diseño del panel: las cuatro como pestañas arriba (en
 * móvil, deslizables) y la página debajo. General por defecto. Las
 * direcciones antiguas de Plan y de Uso llevan a «Plan y uso».
 */
function AjustesPage() {
  const { pathname } = useLocation()
  const actual =
    PAGINAS.find((p) => pathname.startsWith(`/profesional/ajustes/${p.path}`))
      ?.path ?? 'general'

  return (
    <Box component="section" aria-labelledby="ajustes-titulo">
      <Typography
        id="ajustes-titulo"
        variant="h5"
        component="h1"
        sx={{ fontWeight: 400, mb: 2.5 }}
      >
        Ajustes
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Tabs
          value={actual}
          variant="scrollable"
          scrollButtons={false}
          aria-label="Secciones de ajustes"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '@media (prefers-reduced-motion: reduce)': {
              '& .MuiTabs-indicator': { transition: 'none' },
            },
          }}
        >
          {PAGINAS.map((p) => (
            <Tab
              key={p.path}
              value={p.path}
              label={p.label}
              id={`ajustes-pestana-${p.path}`}
              aria-controls="ajustes-panel"
              component={EnlaceRouter}
              to={`/profesional/ajustes/${p.path}`}
            />
          ))}
        </Tabs>

        <Box
          key={actual}
          id="ajustes-panel"
          role="tabpanel"
          aria-labelledby={`ajustes-pestana-${actual}`}
          sx={[{ minWidth: 0 }, animacionPestana()]}
        >
          <Routes>
            <Route
              index
              element={<Navigate to="/profesional/ajustes/general" replace />}
            />
            <Route path="general" element={<GeneralAjustes />} />
            <Route path="cuenta" element={<CuentaAjustes />} />
            <Route path="privacidad" element={<PrivacidadAjustes />} />
            <Route path="plan-y-uso" element={<PlanYUsoAjustes />} />
            {/* Antes, dos pestañas: sus direcciones llevan a la nueva. */}
            <Route
              path="plan"
              element={
                <Navigate to="/profesional/ajustes/plan-y-uso" replace />
              }
            />
            <Route
              path="uso"
              element={
                <Navigate to="/profesional/ajustes/plan-y-uso" replace />
              }
            />
            <Route
              path="*"
              element={<Navigate to="/profesional/ajustes/general" replace />}
            />
          </Routes>
        </Box>
      </Box>
    </Box>
  )
}

export default AjustesPage
