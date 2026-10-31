import { useEffect, useMemo, useState } from 'react'
import { Link as EnlaceRouter, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import PauseCircleOutlineRounded from '@mui/icons-material/PauseCircleOutlineRounded'
import PlayCircleOutlineRounded from '@mui/icons-material/PlayCircleOutlineRounded'
import SendOutlined from '@mui/icons-material/SendOutlined'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import {
  enviarAudiosA,
  escucharMiBiblioteca,
  escucharMisEnvios,
  retirarEnvio,
} from '../../audiosProfesional/audioProfesionalService'
import type {
  AudioProfesional,
  EnvioAudio,
} from '../../audiosProfesional/modelo'
import PortadaAudio from '../../audiosProfesional/PortadaAudio'
import {
  etiquetaOyente,
  type OyenteDelProfesional,
} from '../../perfilProfesional/modelo'
import {
  cambiarEstadoVinculo,
  escucharMisOyentes,
  escucharPerfil,
} from '../../perfilProfesional/perfilService'
import AvisoSalirSinGuardar from '../perfil/AvisoSalirSinGuardar'
import { animacionEntrada } from '../theme/movimiento'
import AudiosParaLaPersona from './AudiosParaLaPersona'
import DialogoElegirAudios from './DialogoElegirAudios'
import NotaPrivadaOyente from './NotaPrivadaOyente'
import { formatoFecha, inicialOyente } from './formato'

const listaTitulos = (titulos: string[]) =>
  titulos.length === 1
    ? `«${titulos[0]}»`
    : `${titulos
        .slice(0, -1)
        .map((t) => `«${t}»`)
        .join(', ')} y «${titulos[titulos.length - 1]}»`

type Recibido = { audio: AudioProfesional; envio: EnvioAudio }

type Eleccion =
  { modo: 'enviar' } | { modo: 'cambiar'; audio: AudioProfesional }

/**
 * Ficha de una persona (/profesional/oyentes/{oyenteUid}): sus datos, la
 * nota privada del profesional y los audios de «Mis audios» que tiene, con
 * «Retirar», «Cambiar por…» y «Enviar audio». Lo mismo que «Mis audios»
 * pero visto desde la persona: los cambios se ven en las dos páginas.
 */
function FichaOyente({ uid }: { uid: string }) {
  const { oyenteUid = '' } = useParams()
  const navigate = useNavigate()
  const [intento, setIntento] = useState(0)
  const [oyentes, setOyentes] = useState<OyenteDelProfesional[] | null>(null)
  const [biblioteca, setBiblioteca] = useState<AudioProfesional[] | null>(null)
  const [envios, setEnvios] = useState<EnvioAudio[] | null>(null)
  const [error, setError] = useState(false)
  const [fotoPrincipalId, setFotoPrincipalId] = useState<string | null>(null)
  const [eleccion, setEleccion] = useState<Eleccion | null>(null)
  const [retirando, setRetirando] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [notaSinGuardar, setNotaSinGuardar] = useState(false)
  const [confirmarPausa, setConfirmarPausa] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [pedirSalida, setPedirSalida] = useState<{
    accion: () => void
  } | null>(null)

  useEffect(() => {
    setError(false)
    return escucharMisOyentes(uid, setOyentes, () => setError(true))
  }, [uid, intento])
  useEffect(
    () => escucharMiBiblioteca(uid, setBiblioteca, () => setError(true)),
    [uid, intento],
  )
  useEffect(
    () => escucharMisEnvios(uid, setEnvios, () => setError(true)),
    [uid, intento],
  )
  // Para la portada «Foto del profesional».
  useEffect(
    () =>
      escucharPerfil(uid, (perfil) =>
        setFotoPrincipalId(perfil?.fotoPrincipalId ?? null),
      ),
    [uid],
  )

  const oyente = oyentes?.find((o) => o.oyenteUid === oyenteUid) ?? null

  // Los audios de «Mis audios» que tiene, del último enviado al primero.
  const recibidos = useMemo<Recibido[]>(() => {
    const porId = new Map((biblioteca ?? []).map((a) => [a.id, a]))
    return (envios ?? [])
      .filter((e) => e.oyenteUid === oyenteUid)
      .flatMap((envio) => {
        const audio = porId.get(envio.audioId)
        return audio ? [{ audio, envio }] : []
      })
      .sort(
        (a, b) =>
          (b.envio.creadoEn?.getTime() ?? 0) -
          (a.envio.creadoEn?.getTime() ?? 0),
      )
  }, [biblioteca, envios, oyenteUid])
  const yaLoTiene = useMemo(
    () => new Set(recibidos.map((r) => r.audio.id)),
    [recibidos],
  )

  const volver = () => {
    const ir = () => navigate('/profesional/oyentes')
    if (notaSinGuardar) setPedirSalida({ accion: ir })
    else ir()
  }

  if (error) {
    return (
      <Box>
        <BotonVolver />
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setIntento((n) => n + 1)}
            >
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar los datos de esta persona. Revisa tu conexión.
        </Alert>
      </Box>
    )
  }
  if (!oyentes || !biblioteca || !envios) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Cargando la ficha" />
      </Box>
    )
  }
  if (!oyente) {
    return (
      <Box>
        <BotonVolver />
        <Alert severity="info">Esta persona no está entre tus oyentes.</Alert>
      </Box>
    )
  }

  const nombre = etiquetaOyente(oyente)
  const activo = oyente.estado === 'activo'

  const retirar = async ({ audio }: Recibido) => {
    setRetirando(audio.id)
    try {
      await retirarEnvio(audio.id, oyenteUid)
      setAviso(`Le has retirado «${audio.titulo}». Ya no lo ve.`)
    } catch {
      setAviso('No se pudo retirar. Inténtalo de nuevo.')
    } finally {
      setRetirando(null)
    }
  }

  const titulo = (id: string) =>
    biblioteca.find((a) => a.id === id)?.titulo ?? 'un audio'

  const enviar = async (ids: string[]) => {
    try {
      const fallidos = await enviarAudiosA(uid, oyenteUid, ids)
      const enviados = ids.filter((id) => !fallidos.includes(id))
      if (enviados.length > 0) {
        setAviso(
          enviados.length === 1
            ? `Le has enviado ${listaTitulos(enviados.map(titulo))}. Ya lo tiene en «Para ti».`
            : `Le has enviado ${enviados.length} audios. Ya los tiene en «Para ti».`,
        )
      }
      return fallidos.length > 0
        ? `No se pudo enviar ${listaTitulos(fallidos.map(titulo))}. Comprueba que su vínculo sigue activo e inténtalo de nuevo.`
        : null
    } catch {
      return 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.'
    }
  }

  // Primero se envía el nuevo y después se retira el viejo: si algo falla,
  // la persona no se queda sin ninguno.
  const cambiar = async (viejo: AudioProfesional, ids: string[]) => {
    const nuevo = titulo(ids[0])
    try {
      const fallidos = await enviarAudiosA(uid, oyenteUid, ids)
      if (fallidos.length > 0) {
        return `No se pudo enviar «${nuevo}», así que sigue teniendo «${viejo.titulo}». Comprueba que su vínculo sigue activo e inténtalo de nuevo.`
      }
    } catch {
      return `No se pudo enviar «${nuevo}», así que sigue teniendo «${viejo.titulo}». Revisa tu conexión.`
    }
    try {
      await retirarEnvio(viejo.id, oyenteUid)
      setAviso(
        `Cambiado: ahora tiene «${nuevo}» en lugar de «${viejo.titulo}».`,
      )
    } catch {
      setAviso(
        `Le has enviado «${nuevo}», pero no se pudo retirar «${viejo.titulo}». Retíralo de nuevo.`,
      )
    }
    return null
  }

  const avisoPausa = 'Está en pausa: reanuda su vínculo para enviarle audios.'

  // Pausar (con confirmación) o reanudar: solo cambia el estado del vínculo;
  // no se borra nada.
  const cambiarEstado = async (estado: 'activo' | 'pausado') => {
    setCambiandoEstado(true)
    try {
      await cambiarEstadoVinculo(uid, oyenteUid, estado)
      setConfirmarPausa(false)
      setAviso(
        estado === 'pausado'
          ? `${nombre} está en pausa. Ya no ve tus audios.`
          : `El vínculo con ${nombre} vuelve a estar activo. Ya ve tus audios otra vez.`,
      )
    } catch {
      setAviso('No se pudo cambiar el estado. Inténtalo de nuevo.')
    } finally {
      setCambiandoEstado(false)
    }
  }

  return (
    <Box component="section" aria-labelledby="ficha-oyente-titulo">
      {/* Cabecera: volver, nombre y estado. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2.5,
          flexWrap: 'wrap',
        }}
      >
        <Tooltip title="Volver a tus oyentes">
          <IconButton aria-label="Volver a tus oyentes" onClick={volver}>
            <ArrowBackRounded />
          </IconButton>
        </Tooltip>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'primary.light',
            color: 'primary.main',
            fontSize: 16,
          }}
        >
          {inicialOyente(oyente)}
        </Avatar>
        <Typography
          id="ficha-oyente-titulo"
          variant="h5"
          component="h1"
          sx={{ fontWeight: 400, minWidth: 0 }}
          noWrap
        >
          {nombre}
        </Typography>
        <Chip
          size="small"
          label={activo ? 'Activo' : 'En pausa'}
          color={activo ? 'success' : 'warning'}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        {activo ? (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<PauseCircleOutlineRounded />}
            onClick={() => setConfirmarPausa(true)}
            disabled={cambiandoEstado}
          >
            Pausar
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={
              cambiandoEstado ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PlayCircleOutlineRounded />
              )
            }
            onClick={() => void cambiarEstado('activo')}
            disabled={cambiandoEstado}
          >
            Reanudar
          </Button>
        )}
      </Box>

      {/* Datos. */}
      <Paper
        variant="outlined"
        component="dl"
        sx={[
          {
            m: 0,
            mb: 3,
            p: { xs: 2, sm: 3 },
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2.5,
          },
          animacionEntrada({ retardo: 40 }),
        ]}
      >
        <Dato titulo="Gmail" valor={oyente.email || '—'} />
        <Dato
          titulo="Fecha de entrada"
          valor={oyente.creadoEn ? formatoFecha.format(oyente.creadoEn) : '—'}
        />
        <Dato
          titulo="Estado"
          valor={
            activo
              ? 'Activo'
              : oyente.estadoCambiadoEn
                ? `En pausa desde ${formatoFecha.format(oyente.estadoCambiadoEn)}`
                : 'En pausa'
          }
        />
      </Paper>

      {/* Audios de «Mis audios» que tiene. */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          id="recibidos-titulo"
          variant="h6"
          component="h2"
          sx={{ fontWeight: 400 }}
        >
          Audios de Biblioteca
        </Typography>
        <Typography color="text.secondary">({recibidos.length})</Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={activo ? '' : avisoPausa}>
          <span>
            <Button
              variant="outlined"
              startIcon={<SendOutlined />}
              onClick={() => setEleccion({ modo: 'enviar' })}
              disabled={!activo}
            >
              Enviar desde Biblioteca
            </Button>
          </span>
        </Tooltip>
      </Box>

      {!activo && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Está en pausa: ahora no ve estos audios. Los volverá a ver cuando
          reanudes su vínculo.
        </Alert>
      )}

      {recibidos.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ py: 5, px: 2, textAlign: 'center', mb: 3 }}
        >
          <Typography color="text.secondary">
            Todavía no le has enviado ningún audio de Biblioteca.
          </Typography>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          component="ul"
          aria-labelledby="recibidos-titulo"
          sx={{ listStyle: 'none', m: 0, mb: 3, p: 0, overflow: 'hidden' }}
        >
          {recibidos.map((recibido, indice) => {
            const { audio, envio } = recibido
            return (
              <Box
                component="li"
                key={audio.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '44px minmax(0, 1fr)',
                    sm: '48px minmax(0, 1fr) auto',
                  },
                  alignItems: 'center',
                  columnGap: { xs: 1.25, sm: 2 },
                  rowGap: 1,
                  px: { xs: 1.5, sm: 2 },
                  py: 1.5,
                  borderTop: indice === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <PortadaAudio
                  profesionalUid={uid}
                  fotoPrincipalId={fotoPrincipalId}
                  portada={audio.portada}
                  audioId={audio.id}
                  portadaImagen={audio.portadaImagen}
                  biblioteca
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 10,
                    display: 'block',
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 500 }} noWrap>
                    {audio.titulo}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.75,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {envio.creadoEn
                        ? `Enviado el ${formatoFecha.format(envio.creadoEn)}`
                        : 'Enviado'}
                    </Typography>
                    {audio.etiquetas.map((e) => (
                      <Chip key={e} size="small" label={e} />
                    ))}
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'flex-end',
                    gridColumn: { xs: '1 / -1', sm: 'auto' },
                  }}
                >
                  <Tooltip title={activo ? '' : avisoPausa}>
                    <span>
                      <Button
                        size="small"
                        startIcon={<SwapHorizRounded />}
                        onClick={() => setEleccion({ modo: 'cambiar', audio })}
                        disabled={!activo || retirando !== null}
                        aria-label={`Cambiar «${audio.titulo}» por otro audio`}
                      >
                        Cambiar por…
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => void retirar(recibido)}
                    disabled={retirando !== null}
                    aria-label={`Retirar «${audio.titulo}»`}
                  >
                    {retirando === audio.id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      'Retirar'
                    )}
                  </Button>
                </Box>
              </Box>
            )
          })}
        </Paper>
      )}

      <AudiosParaLaPersona
        uid={uid}
        oyente={oyente}
        oyentes={oyentes}
        fotoPrincipalId={fotoPrincipalId}
        onAviso={setAviso}
      />

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          color: 'text.secondary',
          mb: 3,
        }}
      >
        <InfoOutlined fontSize="small" />
        <Typography variant="body2">
          Los audios generales los ve mientras el vínculo esté activo.
        </Typography>
      </Box>

      <NotaPrivadaOyente
        uid={uid}
        oyenteUid={oyenteUid}
        onAviso={setAviso}
        onCambios={setNotaSinGuardar}
      />

      {eleccion?.modo === 'enviar' && (
        <DialogoElegirAudios
          titulo={`Enviar audios a ${nombre}`}
          audios={biblioteca}
          yaLoTiene={yaLoTiene}
          varios
          accion="Enviar"
          onConfirmar={enviar}
          onCerrar={() => setEleccion(null)}
        />
      )}
      {eleccion?.modo === 'cambiar' && (
        <DialogoElegirAudios
          titulo={`Cambiar «${eleccion.audio.titulo}»`}
          explicacion={`Elige el audio que tendrá ${nombre} en su lugar. Primero se le envía el nuevo y después se le retira «${eleccion.audio.titulo}».`}
          audios={biblioteca}
          yaLoTiene={yaLoTiene}
          varios={false}
          accion="Cambiar"
          onConfirmar={(ids) => cambiar(eleccion.audio, ids)}
          onCerrar={() => setEleccion(null)}
        />
      )}

      <Dialog
        open={confirmarPausa}
        onClose={() => !cambiandoEstado && setConfirmarPausa(false)}
        aria-labelledby="pausar-titulo"
      >
        <DialogTitle id="pausar-titulo">¿Pausar a {nombre}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Dejará de ver tus audios (los generales, los de Biblioteca y los
            hechos para esta persona) hasta que reanudes su vínculo. No se borra
            nada: al reanudar, lo vuelve a ver todo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmarPausa(false)}
            disabled={cambiandoEstado}
          >
            Cancelar
          </Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => void cambiarEstado('pausado')}
            disabled={cambiandoEstado}
            startIcon={
              cambiandoEstado ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            Pausar
          </Button>
        </DialogActions>
      </Dialog>

      <AvisoSalirSinGuardar
        activo={notaSinGuardar}
        onDescartar={() => {}}
        pedirSalida={pedirSalida}
        onCerrarPeticion={() => setPedirSalida(null)}
        texto="Tienes cambios en la nota privada que todavía no has guardado. Si sales ahora, se perderán."
      />

      <Snackbar
        open={aviso !== null}
        autoHideDuration={4000}
        onClose={() => setAviso(null)}
        message={aviso}
      />
    </Box>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="dt"
        variant="body2"
        color="text.secondary"
        sx={{ mb: 0.25 }}
      >
        {titulo}
      </Typography>
      <Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>
        {valor}
      </Typography>
    </Box>
  )
}

function BotonVolver() {
  return (
    <Button
      component={EnlaceRouter}
      to="/profesional/oyentes"
      startIcon={<ArrowBackRounded />}
      sx={{ mb: 2 }}
    >
      Oyentes
    </Button>
  )
}

export default FichaOyente
