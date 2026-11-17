import { useEffect, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useAuth } from '../../auth/context/AuthContext'
import { useUserProfile } from '../../auth/hooks/useUserProfile'
import { updateDisplayNamePref } from '../../auth/services/userProfileService'
import {
  applyReducedMotion,
  getStoredReducedMotion,
} from '../../settings/utils/reducedMotion'
import { animacionFundido } from '../theme/movimiento'
import { useModoColor, type PreferenciaModo } from '../theme/modoColor'
import {
  continuarActivado,
  guardarContinuarActivado,
} from '../../player/continuar/posiciones'
import { Apartado, CabeceraAjustes, Fila } from './comunes'

/**
 * Ajustes → General: lo mismo que en el oyente (perfil, preferencias y lo que
 * está por llegar), con la misma lógica: el nombre preferido se guarda en
 * users/{uid} (el mismo dato que usa la app para saludar) y «Reducir
 * animaciones» en este dispositivo (vale para la app y el panel). Única
 * diferencia: «Apariencia» es la del panel (claro, oscuro o la del sistema),
 * la misma que cambia el botón de la luna de la barra de utilidades.
 */
function GeneralAjustes() {
  const { user } = useAuth()
  const { profile, isLoading: cargandoPerfil } = useUserProfile()

  const [nombrePreferido, setNombrePreferido] = useState('')
  const [nombreTocado, setNombreTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [reducirAnimaciones, setReducirAnimaciones] = useState(() =>
    getStoredReducedMotion(),
  )
  const { modo, preferencia, cambiarPreferencia } = useModoColor()
  // «Continuar donde lo dejaste»: en este dispositivo, como «Reducir
  // animaciones» (vale para la app y el panel). Desactivado por defecto.
  const [continuar, setContinuar] = useState(() => continuarActivado())
  const ayudaApariencia =
    preferencia === 'sistema'
      ? `Sigue el modo de tu dispositivo: ahora, ${modo === 'dark' ? 'oscuro' : 'claro'}.`
      : 'También puedes cambiarlo con el botón de la luna, a la derecha.'

  useEffect(() => {
    if (!nombreTocado && profile?.displayNamePref !== undefined) {
      setNombrePreferido(profile.displayNamePref)
    }
  }, [profile?.displayNamePref, nombreTocado])

  const nombreGuardado = profile?.displayNamePref ?? ''
  const hayCambios =
    nombreTocado && nombrePreferido.trim() !== nombreGuardado.trim()

  const guardarNombre = async () => {
    if (!user || !hayCambios) return
    setGuardando(true)
    setErrorGuardar(null)
    try {
      await updateDisplayNamePref(user.uid, nombrePreferido.trim())
      setNombreTocado(false)
      setGuardado(true)
    } catch {
      setErrorGuardar('No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const nombre = user?.displayName ?? user?.email ?? 'Mi cuenta'
  const inicial = (user?.displayName ?? user?.email ?? '?')
    .charAt(0)
    .toUpperCase()

  return (
    <Box component="section" aria-labelledby="ajustes-general">
      <CabeceraAjustes
        id="ajustes-general"
        titulo="General"
        intro="Tu perfil y las preferencias generales de NeuroAudio."
      />

      <Apartado id="ajustes-general-perfil" titulo="Perfil">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1.5 }}>
          <Avatar
            src={user?.photoURL ?? undefined}
            alt={nombre}
            slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
            sx={{
              width: 56,
              height: 56,
              fontSize: 22,
              bgcolor: 'primary.light',
              color: 'primary.dark',
            }}
          >
            {inicial}
          </Avatar>
          <Box>
            <Typography>Foto de perfil</Typography>
            <Typography variant="body2" color="text.secondary">
              Se toma de tu cuenta de Google.
            </Typography>
          </Box>
        </Box>

        <TextField
          label="Nombre completo"
          value={user?.displayName ?? ''}
          disabled
          fullWidth
          helperText="Viene de tu cuenta de Google y no se puede editar aquí."
          sx={{ mt: 1.5 }}
        />

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
            mt: 2.5,
          }}
        >
          <TextField
            label="¿Cómo quieres que te llamemos?"
            value={nombrePreferido}
            onChange={(e) => {
              setNombreTocado(true)
              setGuardado(false)
              setNombrePreferido(e.target.value)
            }}
            placeholder={user?.displayName ?? 'Tu nombre'}
            fullWidth
            error={Boolean(errorGuardar)}
            helperText={
              // Cambia de texto (ayuda → guardado/error): se funde, no salta.
              <Box
                component="span"
                key={errorGuardar ? 'error' : guardado ? 'guardado' : 'ayuda'}
                sx={[{ display: 'block' }, animacionFundido(180)]}
              >
                {errorGuardar ??
                  (guardado
                    ? 'Guardado. Así te saludaremos a partir de ahora.'
                    : 'Lo usaremos para saludarte, por ejemplo en la pantalla de Inicio.')}
              </Box>
            }
            slotProps={{
              // Siempre arriba: se lee entera y deja ver el ejemplo.
              inputLabel: { shrink: true },
              // Mientras llega el nombre guardado: de solo lectura, pero con
              // su aspecto normal (desactivado se veía gris y cambiaba de
              // tono a mitad de la entrada de la pestaña).
              htmlInput: { readOnly: cargandoPerfil },
              formHelperText: {
                sx: guardado && !errorGuardar ? { color: 'success.main' } : {},
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => void guardarNombre()}
            disabled={!hayCambios || guardando}
            sx={{ mt: 1, flexShrink: 0 }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </Apartado>

      <Apartado id="ajustes-general-preferencias" titulo="Preferencias">
        <Fila etiqueta="Apariencia" ayuda={ayudaApariencia}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={preferencia}
            onChange={(_, valor: PreferenciaModo | null) =>
              // Pulsar la opción ya elegida no la deja sin ninguna.
              valor && cambiarPreferencia(valor)
            }
            aria-label="Apariencia"
            sx={{
              // La elegida, con el resaltado del elemento activo del menú.
              '& .MuiToggleButton-root': { color: 'text.secondary', px: 1.5 },
              '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover':
                {
                  bgcolor: 'primary.light',
                  color: 'primary.dark',
                  fontWeight: 500,
                },
            }}
          >
            <ToggleButton value="sistema">Sistema</ToggleButton>
            <ToggleButton value="light">Claro</ToggleButton>
            <ToggleButton value="dark">Oscuro</ToggleButton>
          </ToggleButtonGroup>
        </Fila>
        <Fila
          etiqueta="Reducir animaciones"
          ayuda="Minimiza las transiciones y animaciones de la interfaz."
        >
          <Switch
            checked={reducirAnimaciones}
            onChange={(e) => {
              setReducirAnimaciones(e.target.checked)
              applyReducedMotion(e.target.checked)
            }}
            slotProps={{
              input: { 'aria-label': 'Reducir las animaciones de la interfaz' },
            }}
          />
        </Fila>
        <Fila
          etiqueta="Idioma"
          ayuda="Preparado para más idiomas en el futuro."
        >
          <TextField
            select
            size="small"
            defaultValue="es"
            sx={{ minWidth: 140 }}
            slotProps={{ htmlInput: { 'aria-label': 'Idioma' } }}
          >
            <MenuItem value="es">Español</MenuItem>
          </TextField>
        </Fila>
      </Apartado>

      <Apartado id="ajustes-general-reproduccion" titulo="Reproducción">
        <Fila
          etiqueta="Continuar donde lo dejaste"
          ayuda="Al volver a un audio que dejaste a medias, te preguntamos si quieres continuar o empezar de nuevo."
        >
          <Switch
            checked={continuar}
            onChange={(e) => {
              setContinuar(e.target.checked)
              guardarContinuarActivado(e.target.checked)
            }}
            slotProps={{
              input: { 'aria-label': 'Continuar donde lo dejaste' },
            }}
          />
        </Fila>
      </Apartado>

      <Apartado
        id="ajustes-general-notificaciones"
        titulo="Notificaciones"
        proximamente
      >
        <Fila
          etiqueta="Avisos por email"
          ayuda="Recibe novedades y recordatorios en tu correo."
        >
          <Switch
            checked={false}
            disabled
            slotProps={{ input: { 'aria-label': 'Avisos por email' } }}
          />
        </Fila>
      </Apartado>
    </Box>
  )
}

export default GeneralAjustes
