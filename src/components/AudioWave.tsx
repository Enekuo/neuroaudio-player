import { useEffect, useId, useRef, type CSSProperties } from 'react'

/**
 * Imagen por defecto de un audio: un ecualizador de 14 barras dentro de un
 * círculo, animado con los fotogramas de la animación aprobada.
 *
 * - SVG nítido a cualquier tamaño/densidad de pantalla.
 * - Un único bucle requestAnimationFrame compartido por todas las instancias
 *   que lo necesitan; se para solo cuando ninguna está sonando ni relajándose.
 * - En cada frame solo se tocan los atributos y/height de cada <rect>.
 * - Con "reducir movimiento" (sistema o Ajustes) no se anima: barras en reposo.
 */

const XS = [17.0, 26.0, 35.0, 43.5, 52.5, 61.5, 70.5, 79.5, 88.5, 97.5, 106.5, 115.5, 124.5, 133.5]
const FRAMES = [
  [12, 20, 37, 18, 30, 19, 42, 19, 30, 52, 20, 30, 19, 30],
  [15, 19, 40, 20, 27, 19, 44, 20, 27, 45, 19, 33, 20, 27],
  [17, 17, 43, 22, 23, 17, 46, 22, 23, 38, 17, 37, 22, 23],
  [20, 15, 45, 24, 20, 15, 47, 24, 20, 32, 15, 41, 24, 20],
  [23, 14, 47, 25, 17, 14, 48, 25, 17, 25, 14, 44, 25, 17],
  [27, 12, 49, 28, 14, 12, 50, 28, 14, 18, 12, 49, 28, 15],
  [30, 12, 53, 30, 11, 11, 52, 30, 12, 12, 12, 53, 30, 12],
  [33, 15, 49, 27, 14, 12, 49, 27, 14, 17, 14, 49, 27, 15],
  [37, 17, 44, 23, 17, 13, 44, 23, 17, 23, 17, 44, 23, 17],
  [41, 20, 41, 20, 20, 14, 41, 20, 20, 29, 20, 41, 20, 20],
  [44, 23, 37, 17, 23, 15, 37, 17, 23, 35, 23, 37, 17, 23],
  [49, 27, 33, 14, 27, 15, 33, 14, 27, 40, 27, 33, 15, 27],
  [53, 30, 30, 11, 30, 16, 30, 12, 30, 47, 30, 30, 12, 30],
  [49, 33, 27, 15, 28, 22, 27, 15, 33, 42, 33, 27, 15, 33],
  [44, 37, 23, 20, 26, 28, 23, 20, 37, 39, 37, 23, 20, 37],
  [41, 41, 20, 25, 24, 35, 20, 25, 41, 34, 41, 20, 25, 41],
  [37, 44, 17, 29, 23, 40, 17, 29, 44, 29, 44, 17, 29, 44],
  [33, 49, 15, 34, 21, 46, 14, 34, 49, 26, 49, 14, 34, 49],
  [30, 53, 12, 39, 18, 52, 11, 39, 52, 21, 52, 12, 39, 53],
  [27, 49, 12, 40, 17, 49, 11, 37, 49, 27, 46, 13, 37, 46],
  [23, 44, 11, 42, 16, 44, 11, 36, 44, 32, 40, 14, 36, 40],
  [20, 41, 12, 45, 15, 41, 11, 34, 41, 37, 33, 15, 34, 33],
  [17, 37, 12, 47, 14, 37, 10, 33, 37, 43, 27, 17, 33, 27],
  [15, 33, 12, 48, 13, 33, 10, 31, 33, 47, 20, 18, 31, 20],
  [12, 30, 13, 50, 12, 30, 10, 30, 30, 53, 13, 20, 30, 14],
  [15, 27, 12, 49, 12, 30, 10, 32, 27, 50, 13, 18, 32, 13],
  [17, 23, 12, 48, 11, 30, 10, 34, 23, 45, 13, 17, 34, 13],
  [20, 20, 12, 46, 11, 30, 11, 36, 20, 41, 12, 15, 36, 12],
  [23, 17, 11, 45, 11, 30, 11, 38, 17, 37, 12, 14, 38, 12],
  [27, 15, 12, 44, 11, 30, 11, 40, 14, 34, 11, 13, 40, 11],
  [30, 12, 12, 42, 11, 30, 11, 43, 12, 30, 12, 12, 43, 12],
  [27, 12, 15, 37, 14, 27, 17, 37, 14, 27, 13, 15, 37, 15],
  [23, 14, 17, 32, 17, 23, 24, 32, 17, 23, 14, 17, 32, 17],
  [20, 15, 20, 26, 20, 20, 31, 27, 20, 20, 16, 20, 27, 20],
  [17, 16, 23, 21, 23, 17, 37, 21, 23, 17, 17, 23, 21, 23],
  [15, 17, 27, 16, 27, 14, 44, 17, 27, 14, 19, 27, 17, 27],
]
// Velocidad del movimiento: 13 fps sobre los 36 fotogramas ≈ bucle de 2,8 s
// (la animación original iba a 25 fps / 1,44 s; se ha ralentizado a petición,
// primero a 18 fps / 2 s y luego a esto).
const FPS = 13
const REST = 14 // altura de reposo (audio en pausa), antes de aplicar gain
const CY = 56 // centro vertical del viewBox
const SETTLE_EPSILON = 0.05
// Al ponerse en marcha, las barras crecen desde donde estaban hasta el
// movimiento en este tiempo (curva ease-out), en vez de saltar de golpe: es
// el espejo de cómo se relajan al pausar (~0,3-0,4 s).
const START_DURATION = 0.45

const VARIANTS = {
  large: { step: 1, barWidth: 4.2, gain: 1.3 },
  small: { step: 2, barWidth: 9, gain: 1.5 },
} as const

export type AudioWaveVariant = keyof typeof VARIANTS

function barHeight(value: number, gain: number) {
  return Math.max(6, value * gain)
}

// ---- Bucle compartido ----------------------------------------------------

type WaveInstance = {
  bars: SVGRectElement[]
  idx: number[]
  gain: number
  cur: number[]
  phase: number
  playing: boolean
  /** Si en el frame anterior estaba sonando (para detectar el arranque). */
  wasPlaying: boolean
  /** Alturas desde las que arranca la transición de entrada. */
  startFrom: number[]
  /** Progreso 0..1 de esa transición de entrada. */
  startProgress: number
}

const instances = new Set<WaveInstance>()
let rafId: number | null = null
let lastTime: number | null = null

function prefersReducedMotion() {
  if (typeof window === 'undefined') {
    return true
  }
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion')
  )
}

function needsFrame(instance: WaveInstance) {
  return instance.playing || instance.cur.some((value) => Math.abs(value - REST) > SETTLE_EPSILON)
}

function tick(time: number) {
  const dt = lastTime === null ? 0 : Math.min(0.1, (time - lastTime) / 1000)
  lastTime = time
  let anyActive = false

  instances.forEach((instance) => {
    if (!needsFrame(instance)) {
      return
    }
    anyActive = true

    let f0 = 0
    let f1 = 0
    let a = 0
    if (instance.playing && !instance.wasPlaying) {
      instance.startFrom = instance.cur.slice()
      instance.startProgress = 0
    }
    instance.wasPlaying = instance.playing

    let startEase = 1
    if (instance.playing) {
      instance.startProgress = Math.min(1, instance.startProgress + dt / START_DURATION)
      startEase = 1 - Math.pow(1 - instance.startProgress, 3)
      instance.phase = (instance.phase + dt * FPS) % FRAMES.length
      f0 = Math.floor(instance.phase)
      f1 = (f0 + 1) % FRAMES.length
      a = instance.phase - f0
    }

    instance.idx.forEach((barIndex, i) => {
      if (instance.playing) {
        const frameValue = FRAMES[f0][barIndex] + (FRAMES[f1][barIndex] - FRAMES[f0][barIndex]) * a
        const from = instance.startFrom[i] ?? REST
        instance.cur[i] = from + (frameValue - from) * startEase
      } else {
        instance.cur[i] += (REST - instance.cur[i]) * Math.min(1, dt * 9)
        if (Math.abs(instance.cur[i] - REST) <= SETTLE_EPSILON) {
          instance.cur[i] = REST
        }
      }
      const h = barHeight(instance.cur[i], instance.gain)
      const bar = instance.bars[i]
      bar.setAttribute('y', (CY - h / 2).toFixed(2))
      bar.setAttribute('height', h.toFixed(2))
    })
  })

  if (anyActive) {
    rafId = requestAnimationFrame(tick)
  } else {
    rafId = null
    lastTime = null
  }
}

function ensureLoop() {
  if (rafId === null && !prefersReducedMotion()) {
    lastTime = null
    rafId = requestAnimationFrame(tick)
  }
}

// ---- Componente ----------------------------------------------------------

type AudioWaveProps = {
  /** Diámetro en px. Si se omite, el círculo ocupa el 100% de su contenedor. */
  size?: number
  variant: AudioWaveVariant
  /** Estado REAL del reproductor para este audio. */
  playing: boolean
  className?: string
}

function AudioWave({ size, variant, playing, className }: AudioWaveProps) {
  const { step, barWidth, gain } = VARIANTS[variant]
  const gradientId = `na-wave-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const barRefs = useRef<(SVGRectElement | null)[]>([])
  const instanceRef = useRef<WaveInstance | null>(null)

  const idx: number[] = []
  for (let i = 0; i < XS.length; i += step) {
    idx.push(i)
  }
  const restHeight = barHeight(REST, gain)

  // Registro en el bucle compartido (y baja al desmontar).
  useEffect(() => {
    if (prefersReducedMotion()) {
      return
    }
    const bars = barRefs.current.filter((bar): bar is SVGRectElement => bar !== null)
    const instance: WaveInstance = {
      bars,
      idx: idx.slice(0, bars.length),
      gain,
      cur: bars.map(() => REST),
      phase: 0,
      playing: false,
      wasPlaying: false,
      startFrom: bars.map(() => REST),
      startProgress: 1,
    }
    instanceRef.current = instance
    instances.add(instance)
    return () => {
      instances.delete(instance)
      instanceRef.current = null
    }
    // Las barras solo cambian con la variante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant])

  // Solo anima la instancia que está sonando; las demás se quedan en reposo
  // sin pedir frames.
  useEffect(() => {
    const instance = instanceRef.current
    if (!instance) {
      return
    }
    instance.playing = playing
    if (needsFrame(instance)) {
      ensureLoop()
    }
  }, [playing, variant])

  const style: CSSProperties = size ? { width: size, height: size } : { width: '100%', height: '100%' }

  return (
    <span className={`audio-wave audio-wave--${variant}${className ? ` ${className}` : ''}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 150 112" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="92">
            <stop offset="0%" stopColor="#7FA6FF" />
            <stop offset="100%" stopColor="#3461FF" />
          </linearGradient>
        </defs>
        {idx.map((barIndex, i) => (
          <rect
            key={barIndex}
            ref={(element) => {
              barRefs.current[i] = element
            }}
            x={(XS[barIndex] - barWidth / 2 + 0.5).toFixed(2)}
            y={(CY - restHeight / 2).toFixed(2)}
            width={barWidth}
            height={restHeight.toFixed(2)}
            rx={barWidth / 2}
            fill={`url(#${gradientId})`}
          />
        ))}
      </svg>
    </span>
  )
}

export default AudioWave
