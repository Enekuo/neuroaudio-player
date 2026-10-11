import { useEffect, useRef, useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import { useAuth } from '../../auth/context/AuthContext'
import {
  LIMITES,
  OPCIONES_RESPUESTA,
  REDES,
  perfilVacio,
  type PerfilProfesional,
  type Red,
  type TiempoRespuesta,
} from '../../perfilProfesional/modelo'
import {
  escucharPerfil,
  guardarPerfil,
} from '../../perfilProfesional/perfilService'
import { borrarFoto } from '../../perfilProfesional/fotos/fotoService'
import {
  enlacesParaEditar,
  normalizarEnlace,
  usuarioDeRed,
  validarPerfil,
  type ErroresPerfil,
} from '../../perfilProfesional/validacion'
import { animacionEntrada } from '../theme/movimiento'
import AvisoSalirSinGuardar from './AvisoSalirSinGuardar'
import DialogoVistaPrevia from './DialogoVistaPrevia'
import EditorFotos from './EditorFotos'
import EditorSecciones from './EditorSecciones'
import ResumenPerfil from './ResumenPerfil'
import { EJEMPLO_RED, ETIQUETA_RED, ICONO_RED } from './redes'

function BloqueFormulario({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 500 }}>
        {titulo}
      </Typography>
      {descripcion && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {descripcion}
        </Typography>
      )}
      <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {children}
      </Box>
    </Paper>
  )
}

/** Deja el perfil coherente antes de guardarlo (fotos que ya no existen, etc.). */
function limpiarParaGuardar(
  perfil: PerfilProfesional,
  enlaces: PerfilProfesional['enlaces'],
) {
  const ids = new Set(perfil.fotos.map((f) => f.id))
  return {
    ...perfil,
    enlaces,
    // La principal solo la elige el profesional (pasando por «Ajustar foto»).
    fotoPrincipalId:
      perfil.fotoPrincipalId && ids.has(perfil.fotoPrincipalId)
        ? perfil.fotoPrincipalId
        : null,
    secciones: perfil.secciones.map((s) => ({
      ...s,
      fotoIds: s.fotoIds.filter((id) => ids.has(id)),
    })),
  }
}

/**
 * Página Perfil del panel (/profesional/perfil). Muestra el perfil guardado
 * con «Editar perfil» y «Vista previa»; al editar, todo se cambia en un
 * borrador que solo llega a los oyentes con «Guardar cambios».
 */
function PerfilPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const [guardado, setGuardado] = useState<PerfilProfesional | null>(null)
  const [errorCarga, setErrorCarga] = useState(false)

  // Edición: `base` es el perfil al empezar a editar; `borrador`, lo editado.
  const [base, setBase] = useState<PerfilProfesional | null>(null)
  const [borrador, setBorrador] = useState<PerfilProfesional | null>(null)
  const [errores, setErrores] = useState<ErroresPerfil>({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState(false)
  const [avisoCancelar, setAvisoCancelar] = useState<{
    accion: () => void
  } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Fotos subidas en esta edición: si se descarta, se borran de Storage.
  const subidasSinGuardar = useRef(new Set<string>())

  useEffect(() => {
    if (!uid) return
    return escucharPerfil(
      uid,
      (perfil) => {
        setGuardado(perfil ?? perfilVacio())
        setErrorCarga(false)
      },
      () => setErrorCarga(true),
    )
  }, [uid])

  const editando = borrador !== null && base !== null
  const hayCambios =
    editando && JSON.stringify(borrador) !== JSON.stringify(base)

  const empezarEdicion = () => {
    const guardadoActual = guardado ?? perfilVacio()
    // En el formulario, las redes se editan como nombre de usuario; al
    // guardar se vuelve a construir el enlace completo.
    const actual = {
      ...guardadoActual,
      enlaces: enlacesParaEditar(guardadoActual.enlaces),
    }
    setBase(actual)
    setBorrador(actual)
    setErrores({})
    setErrorGuardar(null)
  }

  const salirDeEdicion = () => {
    setBase(null)
    setBorrador(null)
    setErrores({})
    setErrorGuardar(null)
  }

  const descartar = () => {
    if (uid) {
      for (const id of subidasSinGuardar.current) {
        borrarFoto(uid, id).catch(() => {})
      }
    }
    subidasSinGuardar.current.clear()
    salirDeEdicion()
  }

  const cancelar = () => {
    if (hayCambios) setAvisoCancelar({ accion: salirDeEdicion })
    else descartar()
  }

  const cambiar = (cambios: Partial<PerfilProfesional>) =>
    setBorrador((b) => (b ? { ...b, ...cambios } : b))

  const comprobarEnlace = (red: Red) => {
    if (!borrador) return
    const valor = borrador.enlaces[red] ?? ''
    const resultado = normalizarEnlace(red, valor)
    setErrores((e) => ({
      ...e,
      [red]: resultado && 'error' in resultado ? resultado.error : undefined,
    }))
    // En las redes, el campo se queda solo con el nombre de usuario (aunque
    // hayan escrito «@usuario» o pegado el enlace completo).
    if (red !== 'web') {
      const usuario = usuarioDeRed(red, valor)
      if (usuario && 'usuario' in usuario && usuario.usuario !== valor) {
        // Siempre sobre el borrador más reciente (no el de este render).
        setBorrador((b) =>
          b ? { ...b, enlaces: { ...b.enlaces, [red]: usuario.usuario } } : b,
        )
      }
    }
  }

  const guardar = async () => {
    if (!uid || !borrador || !base) return
    const { errores: encontrados, enlaces } = validarPerfil(borrador)
    setErrores(encontrados)
    if (Object.values(encontrados).some(Boolean)) {
      setErrorGuardar('Revisa los campos marcados en rojo.')
      return
    }

    const final = limpiarParaGuardar(borrador, enlaces)
    setGuardando(true)
    setErrorGuardar(null)
    try {
      await guardarPerfil(uid, final)
    } catch {
      setErrorGuardar(
        'No se pudieron guardar los cambios. Revisa tu conexión e inténtalo de nuevo.',
      )
      setGuardando(false)
      return
    }

    // Con el perfil ya guardado, se borran los archivos de las fotos quitadas
    // (las que había antes y las subidas en esta edición que no se quedaron).
    const quedan = new Set(final.fotos.map((f) => f.id))
    const quitadas = new Set([
      ...base.fotos.map((f) => f.id),
      ...subidasSinGuardar.current,
    ])
    for (const id of quitadas) {
      if (!quedan.has(id)) borrarFoto(uid, id).catch(() => {})
    }
    subidasSinGuardar.current.clear()

    setGuardando(false)
    salirDeEdicion()
    setAviso('Cambios guardados. Tus oyentes ya los ven.')
  }

  if (!uid) {
    return (
      <Alert severity="warning">Inicia sesión para editar tu perfil.</Alert>
    )
  }

  const cabecera = (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'stretch', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 400 }}>
          {editando ? 'Editar perfil' : 'Perfil'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Solo lo ven las personas que tú invitas a NeuroAudio.
        </Typography>
      </Box>
      {editando && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            startIcon={<VisibilityOutlined />}
            onClick={() => setVistaPrevia(true)}
          >
            Vista previa
          </Button>
          <Button variant="outlined" onClick={cancelar} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={guardar}
            disabled={!hayCambios || guardando}
            startIcon={
              guardando ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            Guardar cambios
          </Button>
        </Box>
      )}
    </Box>
  )

  let contenido: ReactNode
  if (errorCarga) {
    contenido = (
      <Alert severity="error">
        No se pudo cargar tu perfil. Revisa tu conexión y vuelve a entrar en la
        página.
      </Alert>
    )
  } else if (!guardado) {
    contenido = (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando perfil" />
      </Box>
    )
  } else if (!editando || !borrador) {
    contenido = (
      <ResumenPerfil
        uid={uid}
        perfil={guardado}
        onEditar={empezarEdicion}
        onVistaPrevia={() => setVistaPrevia(true)}
      />
    )
  } else {
    contenido = (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {errorGuardar && <Alert severity="error">{errorGuardar}</Alert>}

        <BloqueFormulario
          titulo="Cabecera"
          descripcion="Lo primero que ven tus oyentes de ti."
        >
          <TextField
            label="Nombre"
            value={borrador.nombre}
            onChange={(e) => cambiar({ nombre: e.target.value })}
            placeholder={user?.displayName ?? 'Tu nombre'}
            error={Boolean(errores.nombre)}
            helperText={errores.nombre}
            slotProps={{ htmlInput: { maxLength: LIMITES.nombre } }}
          />
          <TextField
            label="Frase corta"
            value={borrador.frase}
            onChange={(e) => cambiar({ frase: e.target.value })}
            placeholder="Por ejemplo: Te acompaño a dormir mejor y vivir con más calma."
            error={Boolean(errores.frase)}
            helperText={
              errores.frase ??
              `${borrador.frase.length} de ${LIMITES.frase} caracteres`
            }
            slotProps={{ htmlInput: { maxLength: LIMITES.frase } }}
          />
          <TextField
            label="A qué me dedico"
            value={borrador.dedicacion}
            onChange={(e) => cambiar({ dedicacion: e.target.value })}
            placeholder="Cuéntalo con tus palabras."
            multiline
            minRows={3}
            error={Boolean(errores.dedicacion)}
            helperText={errores.dedicacion}
            slotProps={{ htmlInput: { maxLength: LIMITES.dedicacion } }}
          />
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            {REDES.map((red) => (
              <TextField
                key={red}
                label={ETIQUETA_RED[red]}
                value={borrador.enlaces[red] ?? ''}
                onChange={(e) => {
                  const valor = e.target.value
                  setBorrador((b) =>
                    b ? { ...b, enlaces: { ...b.enlaces, [red]: valor } } : b,
                  )
                }}
                onBlur={() => comprobarEnlace(red)}
                placeholder={EJEMPLO_RED[red]}
                error={Boolean(errores[red])}
                helperText={
                  errores[red] ??
                  (red === 'web' ? undefined : 'Solo tu nombre de usuario')
                }
                slotProps={{
                  htmlInput: {
                    maxLength: LIMITES.enlace,
                    inputMode: red === 'web' ? 'url' : 'text',
                    autoCapitalize: 'none',
                    autoCorrect: 'off',
                    spellCheck: false,
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        sx={{ color: 'text.secondary', gap: 0.75 }}
                      >
                        {ICONO_RED[red]}
                        {red !== 'web' && (
                          <Box component="span" aria-hidden="true">
                            @
                          </Box>
                        )}
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ))}
          </Box>
        </BloqueFormulario>

        <BloqueFormulario titulo="Fotos">
          <EditorFotos
            uid={uid}
            fotos={borrador.fotos}
            fotoPrincipalId={borrador.fotoPrincipalId}
            onCambiar={(fotos, fotoPrincipalId) =>
              cambiar({ fotos, fotoPrincipalId })
            }
            onSubida={(id) => subidasSinGuardar.current.add(id)}
            onReemplazar={(anteriorId, nuevaId) =>
              setBorrador((b) =>
                b
                  ? {
                      ...b,
                      secciones: b.secciones.map((sec) => ({
                        ...sec,
                        fotoIds: sec.fotoIds.map((id) =>
                          id === anteriorId ? nuevaId : id,
                        ),
                      })),
                    }
                  : b,
              )
            }
          />
          {errores.fotos && <Alert severity="error">{errores.fotos}</Alert>}
        </BloqueFormulario>

        <BloqueFormulario
          titulo="Secciones"
          descripcion="Las páginas de tu perfil: lo que quieras contar a tus oyentes."
        >
          <EditorSecciones
            uid={uid}
            secciones={borrador.secciones}
            fotos={borrador.fotos}
            onCambiar={(secciones) => cambiar({ secciones })}
          />
          {errores.secciones && (
            <Alert severity="error">{errores.secciones}</Alert>
          )}
        </BloqueFormulario>

        <BloqueFormulario titulo="Para tus oyentes">
          <TextField
            label="Mensaje de bienvenida"
            value={borrador.bienvenida}
            onChange={(e) => cambiar({ bienvenida: e.target.value })}
            placeholder="Lo que quieres que lea la primera vez que entra."
            multiline
            minRows={3}
            error={Boolean(errores.bienvenida)}
            helperText={
              errores.bienvenida ?? 'Lo ve el oyente la primera vez que entra.'
            }
            slotProps={{ htmlInput: { maxLength: LIMITES.bienvenida } }}
          />
          <TextField
            select
            label="Cuándo suelo responder"
            value={borrador.respuesta ?? ''}
            onChange={(e) =>
              cambiar({
                respuesta: (e.target.value || null) as TiempoRespuesta | null,
              })
            }
            helperText="Se muestra en tu perfil para que sepan qué esperar."
            sx={{ maxWidth: { sm: 320 } }}
          >
            <MenuItem value="">Sin indicar</MenuItem>
            {OPCIONES_RESPUESTA.map((opcion) => (
              <MenuItem key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </MenuItem>
            ))}
          </TextField>
        </BloqueFormulario>

        {/* Barra fija abajo mientras hay cambios sin guardar. */}
        {hayCambios && (
          <Paper
            elevation={6}
            sx={[
              {
                position: 'sticky',
                bottom: 16,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                px: 2.5,
                py: 1.5,
                borderRadius: 3,
              },
              animacionEntrada({ distancia: 12, duracion: 220 }),
            ]}
          >
            <Typography variant="body2" sx={{ flex: 1, minWidth: 160 }}>
              Tienes cambios sin guardar.
            </Typography>
            <Button onClick={cancelar} disabled={guardando}>
              Descartar
            </Button>
            <Button variant="contained" onClick={guardar} disabled={guardando}>
              Guardar cambios
            </Button>
          </Paper>
        )}
      </Box>
    )
  }

  // En la vista previa de un borrador, los enlaces se muestran ya
  // normalizados (y los que aún no son válidos, no se muestran).
  const perfilVista = borrador
    ? { ...borrador, enlaces: validarPerfil(borrador).enlaces }
    : (guardado ?? perfilVacio())

  return (
    <Box component="section" aria-label="Perfil">
      {cabecera}
      {contenido}

      <DialogoVistaPrevia
        abierto={vistaPrevia}
        onCerrar={() => setVistaPrevia(false)}
        uid={uid}
        perfil={perfilVista}
        conCambiosSinGuardar={hayCambios}
      />

      <AvisoSalirSinGuardar
        activo={hayCambios}
        onDescartar={descartar}
        pedirSalida={avisoCancelar}
        onCerrarPeticion={() => setAvisoCancelar(null)}
      />

      <Snackbar
        open={aviso !== null}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}

export default PerfilPage
