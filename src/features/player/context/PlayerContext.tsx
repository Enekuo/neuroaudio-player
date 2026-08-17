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
  playTrack: (track: AudioTrack, queue?: AudioTrack[]) => void
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

  const currentTrack = currentIndex !== null ? (queue[currentIndex] ?? null) : null

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

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

    const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime)
    const handleLoadedMetadata = () => setDuration(audioEl.duration || 0)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleEnded = () => {
      const mode = repeatModeRef.current

      if (mode === 'infinite') {
        audioEl.currentTime = 0
        audioEl.play().catch(() => setIsPlaying(false))
        return
      }

      if (mode === 'times') {
        setRepeatCount((prevCount) => {
          const nextCount = prevCount + 1
          if (nextCount < repeatTimesRef.current) {
            audioEl.currentTime = 0
            audioEl.play().catch(() => setIsPlaying(false))
            return nextCount
          }
          setIsPlaying(false)
          return 0
        })
        return
      }

      setIsPlaying(false)
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

  const playTrack = useCallback((track: AudioTrack, newQueue?: AudioTrack[]) => {
    const list = newQueue ?? queueRef.current
    const index = list.findIndex((item) => item.id === track.id)

    if (newQueue) {
      setQueue(newQueue)
    }

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
