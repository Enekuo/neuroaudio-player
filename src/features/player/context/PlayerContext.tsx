import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { deleteAudioSchedule, getAudioSchedule, saveAudioSchedule } from '../services/audioScheduleService'

export type AudioTrack = {
  id: string
  name: string
  url: string
  duration?: number
}

export type RepeatMode = 'off' | 'infinite' | 'times'

type PlayerContextValue = {
  queue: AudioTrack[]
  currentTrack: AudioTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isExpanded: boolean
  repeatMode: RepeatMode
  repeatTimes: number
  repeatCount: number
  startDelayEnabled: boolean
  startDelaySeconds: number
  // Segundos restantes de la cuenta atrás de arranque, o null si no hay
  // ninguna en curso (el audio ya suena, o el retardo está desactivado).
  delayCountdown: number | null
  // Si la pista actual tiene una programación guardada (repeticiones, volumen
  // y retardo) asociada a este usuario en Firestore.
  hasSavedSchedule: boolean
  isSavingSchedule: boolean
  playTrack: (track: AudioTrack, queue?: AudioTrack[], options?: { autoAdvance?: boolean }) => void
  togglePlay: () => void
  seek: (time: number) => void
  skip: (seconds: number) => void
  setVolume: (volume: number) => void
  playNext: () => void
  playPrevious: () => void
  expand: () => void
  collapse: () => void
  setRepeatOff: () => void
  setRepeatInfinite: () => void
  applyRepeatTimes: (times: number) => void
  applyStartDelay: (enabled: boolean, seconds: number) => void
  toggleSavedSchedule: () => void
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  const audioRef = useRef<HTMLAudioElement>(null)
  const queueRef = useRef<AudioTrack[]>([])
  const loadedTrackIdRef = useRef<string | null>(null)

  const [queue, setQueue] = useState<AudioTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')
  const [repeatTimes, setRepeatTimes] = useState(5)
  const [repeatCount, setRepeatCount] = useState(0)
  const [startDelayEnabled, setStartDelayEnabled] = useState(false)
  const [startDelaySeconds, setStartDelaySeconds] = useState(30)
  const [delayCountdown, setDelayCountdown] = useState<number | null>(null)
  // Si la pista actual tiene programación guardada en Firestore, y si hay un
  // guardado/borrado en curso (para no dejar pulsar el botón dos veces).
  const [hasSavedSchedule, setHasSavedSchedule] = useState(false)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)

  const repeatModeRef = useRef<RepeatMode>('off')
  const repeatTimesRef = useRef(5)
  const currentIndexRef = useRef<number | null>(null)
  const startDelayEnabledRef = useRef(false)
  const startDelaySecondsRef = useRef(30)
  const volumeRef = useRef(1)
  // Marca de tiempo real (Date.now()) a la que debe llegar el reloj del
  // sistema para que el retardo de inicio termine, o null si no hay ninguno
  // en curso. Se compara contra Date.now() en vez de contar "1000ms, 1000ms,
  // ..." para que un tick retrasado (pantalla apagada) se autocorrija solo,
  // en lugar de arrastrar el retraso. Ver startDelayCountdown.
  const delayTargetTimestampRef = useRef<number | null>(null)
  const delayIntervalRef = useRef<number | null>(null)
  // Si el <audio> "debería" estar sonando según la app (se acaba de llamar a
  // play(), tanto al terminar el retardo como al reanudar tras pausa manual o
  // al reiniciar una repetición). Cuando el sistema corta la reproducción con
  // la pantalla apagada (evento 'pause' nativo que no hemos pedido nosotros)
  // NO se reintenta — se deja en pausa limpia — pero esta ref sigue en true,
  // así que el listener de visibilitychange sabe que debe reanudar (una sola
  // vez) en cuanto la app vuelva a primer plano: la única reanudación
  // automática que queda es esa "oportunidad real", nunca un reintento a
  // ciegas con la pantalla todavía apagada (eso causaba arranques cortados y
  // el bucle empieza/para).
  const expectedPlayingRef = useRef(false)
  // Se pone a true justo antes de cada audioEl.pause() que hace la propia
  // app, y se consume (vuelve a false) en el siguiente evento 'pause'. Si el
  // evento 'pause' llega SIN haber pasado por aquí, es que no lo hemos pedido
  // nosotros (lo ha cortado el sistema).
  const intentionalPauseRef = useRef(false)
  // Solo true cuando la cola activa es una playlist (Audios conjuntos >
  // Playlists). Es el ÚNICO caso de toda la web en el que, al terminar un
  // audio, debe empezar a sonar directamente el siguiente de la cola.
  const autoAdvanceRef = useRef(false)
  // Se incrementa en cada cambio de pista: si la programación guardada de una
  // pista tarda en llegar de Firestore y mientras tanto se cambia otra vez de
  // pista, la respuesta tardía se descarta comparando este número.
  const scheduleRequestIdRef = useRef(0)

  const currentTrack = currentIndex !== null ? (queue[currentIndex] ?? null) : null

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    repeatTimesRef.current = repeatTimes
  }, [repeatTimes])

  useEffect(() => {
    startDelayEnabledRef.current = startDelayEnabled
  }, [startDelayEnabled])

  useEffect(() => {
    startDelaySecondsRef.current = startDelaySeconds
  }, [startDelaySeconds])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    setRepeatCount(0)
  }, [currentTrack?.id])

  // Cuenta atrás de "Retardo de inicio". El audio se queda en pausa de
  // verdad durante toda la espera (nada de reproducirlo silenciado: un
  // <audio> "reproduciendo" aunque esté muted es justo lo que los
  // navegadores móviles vigilan más de cerca para suspenderlo en segundo
  // plano, y probarlo dejó el audio cortándose entero al salir de la web).
  //
  // Lo que sí puede fallar con la pantalla apagada es el propio temporizador
  // de JS: un setInterval se congela en segundo plano, así que en vez de
  // restar "1000ms, 1000ms..." se guarda la marca de tiempo real a la que
  // debe llegar el reloj del sistema (Date.now() + segundos). Cada vez que
  // el intervalo consigue ejecutarse — o en cuanto la pestaña vuelve a
  // primer plano, ver el listener de visibilitychange más abajo — se
  // compara contra Date.now(): si ya se ha cumplido, se reproduce entonces
  // (aunque haya llegado tarde); si no, se corrige el número mostrado sin
  // arrastrar el retraso acumulado.
  const clearDelayTimer = useCallback(() => {
    if (delayIntervalRef.current !== null) {
      window.clearInterval(delayIntervalRef.current)
      delayIntervalRef.current = null
    }
  }, [])

  // Punto único para arrancar reproducción "de verdad" (fin de retardo,
  // reanudar tras pausa manual, reiniciar una repetición, volver a primer
  // plano...). Un solo intento: si el navegador lo permite, suena; si no (o
  // si el sistema lo corta después), se queda en pausa limpia — nada de
  // reintentos automáticos aquí, ver expectedPlayingRef/handlePause más abajo.
  const playRobust = useCallback(() => {
    expectedPlayingRef.current = true
    audioRef.current?.play().catch(() => setIsPlaying(false))
  }, [])

  const cancelStartDelay = useCallback(() => {
    clearDelayTimer()
    delayTargetTimestampRef.current = null
    setDelayCountdown(null)
  }, [clearDelayTimer])

  const startDelayCountdown = useCallback(
    (seconds: number) => {
      clearDelayTimer()

      if (seconds <= 0) {
        delayTargetTimestampRef.current = null
        setDelayCountdown(null)
        playRobust()
        return
      }

      const targetTimestamp = Date.now() + seconds * 1000
      delayTargetTimestampRef.current = targetTimestamp
      setDelayCountdown(seconds)

      delayIntervalRef.current = window.setInterval(() => {
        const target = delayTargetTimestampRef.current
        if (target === null) {
          return
        }

        const remainingMs = target - Date.now()
        if (remainingMs <= 0) {
          clearDelayTimer()
          delayTargetTimestampRef.current = null
          setDelayCountdown(null)
          playRobust()
          return
        }

        setDelayCountdown(Math.ceil(remainingMs / 1000))
      }, 1000)
    },
    [clearDelayTimer, playRobust],
  )

  useEffect(() => clearDelayTimer, [clearDelayTimer])

  // Red de seguridad para cuando el setInterval de arriba sí se congela con
  // la pantalla apagada: en cuanto la pestaña vuelve a primer plano (se
  // desbloquea el móvil, se cambia de vuelta a la web...), se comprueba de
  // inmediato si el retardo ya se había cumplido mientras tanto. También es
  // el momento en el que de verdad merece la pena reanudar si el sistema
  // había cortado la reproducción con la pantalla apagada (en vez de
  // reintentar a ciegas mientras seguía apagada, que es lo que provocaba el
  // bucle empieza/para).
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        return
      }

      const target = delayTargetTimestampRef.current
      if (target !== null) {
        const remainingMs = target - Date.now()
        if (remainingMs <= 0) {
          clearDelayTimer()
          delayTargetTimestampRef.current = null
          setDelayCountdown(null)
          playRobust()
        } else {
          setDelayCountdown(Math.ceil(remainingMs / 1000))
        }
        return
      }

      const audioEl = audioRef.current
      if (!expectedPlayingRef.current || !audioEl || !audioEl.paused) {
        return
      }

      const nearEnd =
        Number.isFinite(audioEl.duration) && audioEl.duration > 0 && audioEl.duration - audioEl.currentTime < 0.35

      if (nearEnd) {
        expectedPlayingRef.current = false
        return
      }

      // Única reanudación automática que queda: una vez, al volver a primer
      // plano, nunca mientras la pantalla sigue apagada.
      playRobust()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [clearDelayTimer, playRobust])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audioEl.currentTime)

      if ('mediaSession' in navigator && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audioEl.duration,
            position: Math.min(audioEl.currentTime, audioEl.duration),
            playbackRate: audioEl.playbackRate,
          })
        } catch {
          // el navegador puede rechazar valores no soportados; no es crítico
        }
      }
    }
    const handleLoadedMetadata = () => setDuration(audioEl.duration || 0)
    const handlePlay = () => {
      setIsPlaying(true)
    }
    const handlePause = () => {
      setIsPlaying(false)

      if (intentionalPauseRef.current) {
        // Pausa pedida por la propia app (togglePlay, fin de repeticiones,
        // activar retardo...): ya no se espera que suene hasta que se pida
        // explícitamente otra vez.
        intentionalPauseRef.current = false
        expectedPlayingRef.current = false
        return
      }

      // Pausa que NO hemos pedido nosotros (el sistema la ha cortado por su
      // cuenta, típico con la pantalla apagada). Sin reintentos aquí: se
      // queda en pausa limpia, sin más. expectedPlayingRef se deja tal cual
      // esté, para que si seguía en true, el listener de visibilitychange
      // reanude una sola vez al volver a primer plano.
    }

    const handleEnded = () => {
      const mode = repeatModeRef.current

      // TEMPORAL: log de depuración para el bug de repeticiones cortadas al
      // bloquear pantalla en móvil. Quitar cuando se resuelva.
      console.log(
        `[NeuroAudio][ended] mode=${mode} visibility=${document.visibilityState} at=${new Date().toISOString()}`,
      )

      if (mode === 'infinite') {
        audioEl.currentTime = 0
        playRobust()
        return
      }

      if (mode === 'times') {
        setRepeatCount((prevCount) => {
          const nextCount = prevCount + 1

          // TEMPORAL: mismo log de depuración, aquí con el número de repetición.
          console.log(`[NeuroAudio][ended] repetición ${nextCount} de ${repeatTimesRef.current}`)

          if (nextCount < repeatTimesRef.current) {
            audioEl.currentTime = 0
            playRobust()
            return nextCount
          }
          // Terminadas todas las repeticiones: se limpia todo. El audio sale de
          // la pantalla (deja de haber pista actual) y la repetición se apaga,
          // así el número de repeticiones desaparece.
          intentionalPauseRef.current = true
          expectedPlayingRef.current = false
          audioEl.pause()
          audioEl.currentTime = 0
          loadedTrackIdRef.current = null
          setIsPlaying(false)
          setRepeatMode('off')
          setCurrentIndex(null)
          setIsExpanded(false)

          // Se actualiza Media Session aquí mismo, de forma síncrona: si se
          // dejara solo en manos del efecto que observa `isPlaying`, en este
          // punto (justo al recibir "ended") el estado previo seguía siendo
          // 'playing' y el cambio a false podía llegar demasiado tarde (o no
          // producir un re-render, si ya estaba en false por una pausa nativa
          // previa). Sin esto, la notificación se queda "colgada" en play.
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none'
            navigator.mediaSession.setPositionState()
          }

          return 0
        })
        return
      }

      // Sin repetición: por defecto se para, no avanza a la siguiente pista de
      // la cola automáticamente (el usuario puede elegir otra a mano). ÚNICA
      // excepción de toda la web: si la cola es una playlist (autoAdvanceRef,
      // activado solo desde PlaylistsConjunto vía playTrack(..., { autoAdvance
      // : true })), sí pasa directamente al siguiente audio de la cola.
      if (autoAdvanceRef.current && currentIndexRef.current !== null) {
        const nextIndex = currentIndexRef.current + 1
        if (nextIndex < queueRef.current.length) {
          setCurrentIndex(nextIndex)
          return
        }
      }

      intentionalPauseRef.current = true
      expectedPlayingRef.current = false
      audioEl.pause()
      audioEl.currentTime = 0
      setIsPlaying(false)

      // La pista sigue "cargada" (se ve en el mini-player, en pausa en 0), así
      // que aquí no procede 'none' (implicaría que no hay nada cargado) sino
      // 'paused'. Igual que en la rama de arriba, se hace de forma síncrona
      // para que la notificación no se quede colgada mostrando "reproduciendo".
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
        navigator.mediaSession.setPositionState()
      }
    }

    audioEl.addEventListener('timeupdate', handleTimeUpdate)
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioEl.addEventListener('play', handlePlay)
    audioEl.addEventListener('pause', handlePause)
    audioEl.addEventListener('ended', handleEnded)

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate)
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audioEl.removeEventListener('play', handlePlay)
      audioEl.removeEventListener('pause', handlePause)
      audioEl.removeEventListener('ended', handleEnded)
    }
  }, [playRobust])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl || !currentTrack) {
      return
    }

    const isNewTrack = loadedTrackIdRef.current !== currentTrack.id

    if (!isNewTrack) {
      // Misma pista (solo cambió la referencia de currentTrack, p. ej. la cola
      // se recompuso): usa la programación que ya está cargada, sin volver a
      // pedirla a Firestore ni resetear nada.
      if (startDelayEnabledRef.current && startDelaySecondsRef.current > 0) {
        startDelayCountdown(startDelaySecondsRef.current)
      } else {
        playRobust()
      }
      return
    }

    audioEl.src = currentTrack.url
    loadedTrackIdRef.current = currentTrack.id

    const trackId = currentTrack.id
    scheduleRequestIdRef.current += 1
    const requestId = scheduleRequestIdRef.current

    // Pista nueva: primero se resetea todo a los valores por defecto (nunca
    // se arrastra la programación de la pista anterior, ni un instante),
    // mientras se comprueba en Firestore si esta pista concreta tiene una
    // programación guardada por este usuario.
    setRepeatMode('off')
    setRepeatTimes(5)
    setStartDelayEnabled(false)
    setStartDelaySeconds(30)
    setHasSavedSchedule(false)

    async function loadScheduleAndPlay() {
      let schedule = null as Awaited<ReturnType<typeof getAudioSchedule>>

      if (uid) {
        try {
          schedule = await getAudioSchedule(uid, trackId)
        } catch (error) {
          console.error('No se pudo cargar la programación guardada del audio', error)
        }
      }

      // Si mientras se esperaba la respuesta se cambió otra vez de pista, esta
      // respuesta ya no sirve — se descarta para no pisar el estado actual.
      if (scheduleRequestIdRef.current !== requestId) {
        return
      }

      if (schedule) {
        setRepeatMode(schedule.repeatMode)
        setRepeatTimes(schedule.repeatTimes)
        setStartDelayEnabled(schedule.startDelayEnabled)
        setStartDelaySeconds(schedule.startDelaySeconds)
        setHasSavedSchedule(true)

        const clampedVolume = Math.min(1, Math.max(0, schedule.volume))
        setVolumeState(clampedVolume)
        if (audioRef.current) {
          audioRef.current.volume = clampedVolume
        }
      }

      const audioElNow = audioRef.current
      if (!audioElNow || loadedTrackIdRef.current !== trackId) {
        return
      }

      if (schedule?.startDelayEnabled && schedule.startDelaySeconds > 0) {
        startDelayCountdown(schedule.startDelaySeconds)
      } else {
        playRobust()
      }
    }

    loadScheduleAndPlay()
  }, [currentTrack, uid, startDelayCountdown, playRobust])

  // Media Session: declara la pista activa ante el sistema operativo/navegador
  // para que la reproducción sobreviva en segundo plano y aparezcan los
  // controles en la pantalla de bloqueo.
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    if (!currentTrack) {
      // Sin pista cargada: la notificación no debe quedar activa bajo ningún
      // camino que vacíe currentTrack (aquí queda como red de seguridad además
      // del ajuste síncrono que ya se hace en handleEnded).
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
      navigator.mediaSession.setPositionState()
      return
    }

    // Mientras cuenta atrás el retardo de inicio, la notificación debe dejar
    // claro que el audio está en espera (no sonando) sin mostrar el número de
    // segundos — solo se usa aquí si hay cuenta atrás o no, nunca el valor.
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: delayCountdown !== null ? 'NeuroAudio · En espera para empezar' : 'NeuroAudio',
      artwork: [{ src: '/images/logo_1.png', sizes: '512x512', type: 'image/png' }],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, delayCountdown !== null])

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    // Mientras dura el retardo (aunque el audio ya esté sonando silenciado
    // de verdad), la notificación debe seguir mostrando "en pausa", nunca
    // "reproduciendo".
    navigator.mediaSession.playbackState = delayCountdown !== null ? 'paused' : isPlaying ? 'playing' : 'paused'
  }, [isPlaying, delayCountdown])

  const playTrack = useCallback(
    (track: AudioTrack, newQueue?: AudioTrack[], options?: { autoAdvance?: boolean }) => {
      const list = newQueue ?? queueRef.current
      const index = list.findIndex((item) => item.id === track.id)

      if (newQueue) {
        setQueue(newQueue)
      }

      // Se fija explícitamente en cada llamada (nunca se hereda de la
      // reproducción anterior): si no se pasa `autoAdvance: true`, queda en
      // false, tal cual pide "en toda la web" salvo desde una playlist.
      autoAdvanceRef.current = options?.autoAdvance ?? false

      // Cualquier cuenta atrás pendiente de una pista anterior deja de tener
      // sentido: la nueva pista decide desde cero si le toca esperar o no
      // (efecto de [currentTrack] más abajo).
      cancelStartDelay()

      setCurrentIndex(index === -1 ? 0 : index)
      setIsExpanded(true)
    },
    [cancelStartDelay],
  )

  const togglePlay = useCallback(() => {
    const audioEl = audioRef.current
    if (!audioEl || !currentTrack) {
      return
    }

    // Durante la cuenta atrás el audio real sigue en pausa: pulsar play/pausa
    // aquí es la forma de cancelar la espera, tal cual pide la función.
    if (delayCountdown !== null) {
      cancelStartDelay()
      return
    }

    if (audioEl.paused) {
      playRobust()
    } else {
      intentionalPauseRef.current = true
      expectedPlayingRef.current = false
      audioEl.pause()
    }
  }, [currentTrack, delayCountdown, cancelStartDelay, playRobust])

  // Referencia siempre-actualizada a togglePlay para los actionHandler de
  // Media Session: así el efecto que los registra no necesita reinscribirlos
  // en cada segundo de la cuenta atrás (togglePlay cambia de referencia cada
  // vez que delayCountdown avanza).
  const togglePlayRef = useRef(togglePlay)
  useEffect(() => {
    togglePlayRef.current = togglePlay
  }, [togglePlay])

  const seek = useCallback((time: number) => {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }
    audioEl.currentTime = time
    setCurrentTime(time)
  }, [])

  const skip = useCallback((seconds: number) => {
    const audioEl = audioRef.current
    if (!audioEl) {
      return
    }
    const upperBound = Number.isFinite(audioEl.duration) ? audioEl.duration : Infinity
    const target = Math.min(Math.max(audioEl.currentTime + seconds, 0), upperBound)
    audioEl.currentTime = target
    setCurrentTime(target)
  }, [])

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value))
    const audioEl = audioRef.current
    if (audioEl) {
      audioEl.volume = clamped
    }
    setVolumeState(clamped)
  }, [])

  const playNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex === null) {
        return prevIndex
      }
      const nextIndex = prevIndex + 1
      return nextIndex < queueRef.current.length ? nextIndex : prevIndex
    })
  }, [])

  const playPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex === null) {
        return prevIndex
      }
      const previousIndex = prevIndex - 1
      return previousIndex >= 0 ? previousIndex : prevIndex
    })
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    // 'play'/'pause' NUNCA deben tocar el <audio> directamente: tienen que
    // pasar por togglePlay, la misma función que usa el botón de la pantalla
    // completa. Es lo único que hace que, si hay un retardo de inicio en
    // marcha, la notificación no pueda saltárselo y arrancar el audio por su
    // cuenta — togglePlay ya sabe cancelarlo en vez de reproducir de golpe.
    navigator.mediaSession.setActionHandler('play', () => {
      togglePlayRef.current()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlayRef.current()
    })
    // Botones laterales de la notificación/pantalla de bloqueo: deben avanzar y
    // retroceder 10s dentro del audio actual, igual que los botones +10s/-10s de
    // la web (misma función `skip`, sin duplicar lógica). Se ignora cualquier
    // seekOffset que sugiera el sistema: el salto queda fijo en 10s.
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-10))
    navigator.mediaSession.setActionHandler('seekforward', () => skip(10))

    // Algunos dispositivos móviles solo pintan flechas laterales en la
    // notificación cuando hay handlers de 'previoustrack'/'nexttrack' (ignoran
    // seekbackward/seekforward a efectos visuales). Para que las flechas
    // aparezcan pero sigan haciendo ±10s (nunca cambiar de pista), se registran
    // aquí apuntando también a `skip`, no a playPrevious/playNext.
    navigator.mediaSession.setActionHandler('previoustrack', () => skip(-10))
    navigator.mediaSession.setActionHandler('nexttrack', () => skip(10))

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('seekbackward', null)
      navigator.mediaSession.setActionHandler('seekforward', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  }, [skip])

  const expand = useCallback(() => setIsExpanded(true), [])
  const collapse = useCallback(() => setIsExpanded(false), [])

  const setRepeatOff = useCallback(() => {
    setRepeatMode('off')
    setRepeatCount(0)
  }, [])

  const setRepeatInfinite = useCallback(() => {
    setRepeatMode('infinite')
    setRepeatCount(0)
  }, [])

  const applyRepeatTimes = useCallback((times: number) => {
    const clamped = Math.min(99, Math.max(1, Math.round(times)))
    setRepeatTimes(clamped)
    setRepeatMode('times')
    setRepeatCount(0)
  }, [])

  // Guarda el ajuste de "Retardo de inicio". Si se acaba de activar (o se
  // cambia su tiempo) mientras hay una pista cargada, esa pista se reinicia
  // desde el principio para que el retardo se aplique de verdad, tal como se
  // pidió: "al pulsar guardar cambios, el audio debe empezar desde el
  // principio". Si se desactiva mientras había una cuenta atrás en marcha,
  // esa espera se cancela y el audio arranca ya, sin más demora.
  const applyStartDelay = useCallback(
    (enabled: boolean, seconds: number) => {
      const clampedSeconds = Math.min(1800, Math.max(0, Math.round(seconds / 15) * 15))
      setStartDelayEnabled(enabled)
      setStartDelaySeconds(clampedSeconds)

      const audioEl = audioRef.current
      if (!audioEl || !currentTrack) {
        return
      }

      if (enabled) {
        cancelStartDelay()
        intentionalPauseRef.current = true
        expectedPlayingRef.current = false
        audioEl.pause()
        audioEl.currentTime = 0
        setCurrentTime(0)
        startDelayCountdown(clampedSeconds)
      } else if (delayCountdown !== null) {
        cancelStartDelay()
        playRobust()
      }
    },
    [currentTrack, delayCountdown, cancelStartDelay, startDelayCountdown, playRobust],
  )

  // Botón "guardar" (tipo guardar publicación de Instagram) del panel
  // Programar audio: guarda o borra en Firestore la programación actual
  // (repeticiones, volumen, retardo) asociada a esta pista y a este usuario.
  // Actualización optimista: el botón cambia al instante y solo se deshace
  // si la escritura falla de verdad.
  const toggleSavedSchedule = useCallback(() => {
    if (!uid || !currentTrack || isSavingSchedule) {
      return
    }

    const trackId = currentTrack.id
    const wasSaved = hasSavedSchedule

    setHasSavedSchedule(!wasSaved)
    setIsSavingSchedule(true)

    const request = wasSaved
      ? deleteAudioSchedule(uid, trackId)
      : saveAudioSchedule(uid, trackId, {
          repeatMode: repeatModeRef.current,
          repeatTimes: repeatTimesRef.current,
          startDelayEnabled: startDelayEnabledRef.current,
          startDelaySeconds: startDelaySecondsRef.current,
          volume: volumeRef.current,
        })

    request
      .catch((error) => {
        console.error('No se pudo guardar/eliminar la programación del audio', error)
        // Solo se deshace si seguimos en la misma pista; si ya se cambió de
        // audio, el estado de "guardado" que se ve ahora es el de otra pista.
        if (loadedTrackIdRef.current === trackId) {
          setHasSavedSchedule(wasSaved)
        }
      })
      .finally(() => {
        setIsSavingSchedule(false)
      })
  }, [uid, currentTrack, hasSavedSchedule, isSavingSchedule])

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      isExpanded,
      repeatMode,
      repeatTimes,
      repeatCount,
      startDelayEnabled,
      startDelaySeconds,
      delayCountdown,
      hasSavedSchedule,
      isSavingSchedule,
      playTrack,
      togglePlay,
      seek,
      skip,
      setVolume,
      playNext,
      playPrevious,
      expand,
      collapse,
      setRepeatOff,
      setRepeatInfinite,
      applyRepeatTimes,
      applyStartDelay,
      toggleSavedSchedule,
    }),
    [
      queue,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      volume,
      isExpanded,
      repeatMode,
      repeatTimes,
      repeatCount,
      startDelayEnabled,
      startDelaySeconds,
      delayCountdown,
      hasSavedSchedule,
      isSavingSchedule,
      playTrack,
      togglePlay,
      seek,
      skip,
      setVolume,
      playNext,
      playPrevious,
      expand,
      collapse,
      setRepeatOff,
      setRepeatInfinite,
      applyRepeatTimes,
      applyStartDelay,
      toggleSavedSchedule,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)

  if (!context) {
    throw new Error('usePlayer debe usarse dentro de PlayerProvider')
  }

  return context
}
