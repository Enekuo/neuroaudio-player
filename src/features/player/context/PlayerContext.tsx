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
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
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

  const repeatModeRef = useRef<RepeatMode>('off')
  const repeatTimesRef = useRef(5)
  const currentIndexRef = useRef<number | null>(null)
  // Solo true cuando la cola activa es una playlist (Audios conjuntos >
  // Playlists). Es el ÚNICO caso de toda la web en el que, al terminar un
  // audio, debe empezar a sonar directamente el siguiente de la cola.
  const autoAdvanceRef = useRef(false)

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
    setRepeatCount(0)
  }, [currentTrack?.id])

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
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleEnded = () => {
      const mode = repeatModeRef.current

      // TEMPORAL: log de depuración para el bug de repeticiones cortadas al
      // bloquear pantalla en móvil. Quitar cuando se resuelva.
      console.log(
        `[NeuroAudio][ended] mode=${mode} visibility=${document.visibilityState} at=${new Date().toISOString()}`,
      )

      if (mode === 'infinite') {
        audioEl.currentTime = 0
        audioEl.play().catch(() => setIsPlaying(false))
        return
      }

      if (mode === 'times') {
        setRepeatCount((prevCount) => {
          const nextCount = prevCount + 1

          // TEMPORAL: mismo log de depuración, aquí con el número de repetición.
          console.log(`[NeuroAudio][ended] repetición ${nextCount} de ${repeatTimesRef.current}`)

          if (nextCount < repeatTimesRef.current) {
            audioEl.currentTime = 0
            audioEl.play().catch(() => setIsPlaying(false))
            return nextCount
          }
          // Terminadas todas las repeticiones: se limpia todo. El audio sale de
          // la pantalla (deja de haber pista actual) y la repetición se apaga,
          // así el número de repeticiones desaparece.
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
  }, [])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl || !currentTrack) {
      return
    }

    if (loadedTrackIdRef.current !== currentTrack.id) {
      audioEl.src = currentTrack.url
      loadedTrackIdRef.current = currentTrack.id
    }

    audioEl.play().catch(() => setIsPlaying(false))
  }, [currentTrack])

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

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: 'NeuroAudio',
      artwork: [{ src: '/images/logo_1.png', sizes: '512x512', type: 'image/png' }],
    })
  }, [currentTrack])

  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  const playTrack = useCallback((track: AudioTrack, newQueue?: AudioTrack[], options?: { autoAdvance?: boolean }) => {
    const list = newQueue ?? queueRef.current
    const index = list.findIndex((item) => item.id === track.id)

    if (newQueue) {
      setQueue(newQueue)
    }

    // Se fija explícitamente en cada llamada (nunca se hereda de la
    // reproducción anterior): si no se pasa `autoAdvance: true`, queda en
    // false, tal cual pide "en toda la web" salvo desde una playlist.
    autoAdvanceRef.current = options?.autoAdvance ?? false

    setCurrentIndex(index === -1 ? 0 : index)
    setIsExpanded(true)
  }, [])

  const togglePlay = useCallback(() => {
    const audioEl = audioRef.current
    if (!audioEl || !currentTrack) {
      return
    }

    if (audioEl.paused) {
      audioEl.play().catch(() => {})
    } else {
      audioEl.pause()
    }
  }, [currentTrack])

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

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().catch(() => {})
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause()
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
