import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  escucharProgreso,
  marcarPaso,
} from '../../programasProfesional/programaService'
import { usePlayer } from '../context/PlayerContext'
import { alTerminarPista } from '../utils/finDePista'

/** A partir de aquí se ofrece marcarlo antes de que termine. */
const CASI_TERMINADO = 0.98
const CONFIRMACION_MS = 3000

/**
 * Completar un paso de un programa (solo si el audio suena como paso):
 * - al llegar al final se completa solo (una vez: no repite la escritura,
 *   tampoco con repetición) y se confirma con «Paso completado»;
 * - desde el 98 % se ofrece «Audio completado · Marcar» para marcarlo antes.
 * Si ya estaba completado, no dice nada.
 */
/**
 * `arriba`: con el reproductor a pantalla completa, bajo su cabecera (abajo
 * taparía los controles).
 */
function AvisoPasoCompletado({ arriba = false }: { arriba?: boolean }) {
  const { user } = useAuth()
  const { currentTrack, currentTime, duration } = usePlayer()
  const programa = currentTrack?.programa ?? null
  const pistaId = currentTrack?.id ?? null
  const uid = user?.uid ?? null
  const [completados, setCompletados] = useState<string[] | null>(null)
  const [confirmado, setConfirmado] = useState(false)
  const enCurso = useRef(false)
  const temporizador = useRef<number | null>(null)

  const programaId = programa?.id ?? null
  useEffect(() => {
    setCompletados(null)
    if (!programaId || !uid) return
    return escucharProgreso(programaId, uid, setCompletados, () =>
      setCompletados(null),
    )
  }, [programaId, uid])

  const yaHecho = Boolean(pistaId && completados?.includes(pistaId))

  const completar = useCallback(async () => {
    if (!programa || !uid || !pistaId || yaHecho || enCurso.current) return
    enCurso.current = true
    try {
      await marcarPaso(programa, uid, pistaId, true, completados ?? [])
      setConfirmado(true)
      if (temporizador.current !== null)
        window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(
        () => setConfirmado(false),
        CONFIRMACION_MS,
      )
    } catch {
      // Sin conexión o sin acceso: se reintentará al volver a terminarlo.
    } finally {
      enCurso.current = false
    }
  }, [programa, uid, pistaId, yaHecho, completados])

  // Al llegar al final, solo.
  useEffect(
    () =>
      alTerminarPista((id) => {
        if (id === pistaId) void completar()
      }),
    [pistaId, completar],
  )

  // Otro audio: fuera la confirmación anterior.
  useEffect(() => {
    setConfirmado(false)
  }, [pistaId])

  useEffect(
    () => () => {
      if (temporizador.current !== null)
        window.clearTimeout(temporizador.current)
    },
    [],
  )

  if (!programa || !uid || completados === null) return null

  if (confirmado) {
    return (
      <div
        className={`player-undo-toast paso-toast${arriba ? ' paso-toast--arriba' : ''}`}
        role="status"
      >
        <span className="paso-toast__hecho" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span>Paso completado</span>
      </div>
    )
  }

  const casiTerminado = duration > 0 && currentTime / duration >= CASI_TERMINADO
  if (!casiTerminado || yaHecho) return null

  return (
    <div
      className={`player-undo-toast paso-toast${arriba ? ' paso-toast--arriba' : ''}`}
      role="status"
    >
      <span>Audio completado</span>
      <button type="button" onClick={() => void completar()}>
        Marcar
      </button>
    </div>
  )
}

export default AvisoPasoCompletado
