import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import {
  escucharAudio,
  escucharAudiosParaMi,
  escucharAudiosPublicados,
  escucharEnviosParaMi,
} from '../../audiosProfesional/audioProfesionalService'
import type { AudioProfesional } from '../../audiosProfesional/modelo'
import {
  sinLosQueYaSonGenerales,
  vigilarRecibidos,
} from '../../audiosProfesional/recibidos'
import {
  escucharPerfil,
  escucharProfesionalesDelOyente,
} from '../../perfilProfesional/perfilService'
import type { AudioDeProfesional } from '../utils/buscarAudios'

type Cancelar = () => void

/** Lo que se sabe de un profesional (undefined: aún sin respuesta). */
type DeUnProfesional = {
  cancelar: Cancelar[]
  /** null: sin perfil o no se puede leer (no se muestran sus audios). */
  nombre: string | null | undefined
  generales: AudioProfesional[]
  paraMi: AudioProfesional[]
  recibidos: AudioProfesional[]
}

let vigilancia: {
  uid: string
  profesionales: Map<string, DeUnProfesional>
  cancelar: Cancelar
} | null = null
let instantanea: AudioDeProfesional[] = []
const suscritos = new Set<() => void>()

function publicar() {
  const vistos = new Set<string>()
  const lista: AudioDeProfesional[] = []
  for (const [profesionalUid, p] of vigilancia?.profesionales ?? []) {
    if (!p.nombre) continue
    const anadir = (audios: AudioProfesional[], paraTi: boolean) => {
      for (const audio of audios) {
        if (vistos.has(audio.id)) continue
        vistos.add(audio.id)
        lista.push({ audio, profesionalUid, profesional: p.nombre!, paraTi })
      }
    }
    anadir(p.paraMi, true)
    // Un recibido que también está en Audios sale una vez, como general.
    anadir(
      sinLosQueYaSonGenerales(
        p.recibidos.map((audio) => ({ audio })),
        p.generales,
      ).map((r) => r.audio),
      true,
    )
    anadir(p.generales, false)
  }
  instantanea = lista
  suscritos.forEach((avisar) => avisar())
}

/**
 * Empieza a vigilar un profesional: su nombre y los audios que este oyente
 * puede escuchar (con las mismas consultas que su página). Un error (vínculo
 * en pausa, sin permiso…) cuenta como «sin audios», sin avisar.
 */
function vigilarProfesional(oyenteUid: string, profesionalUid: string) {
  const p: DeUnProfesional = {
    cancelar: [],
    nombre: undefined,
    generales: [],
    paraMi: [],
    recibidos: [],
  }
  const propio = profesionalUid === oyenteUid
  let generalesEnMarcha = false
  const empezarGenerales = () => {
    if (generalesEnMarcha) return
    generalesEnMarcha = true
    p.cancelar.push(
      escucharAudiosPublicados(
        profesionalUid,
        (audios) => {
          p.generales = audios
          publicar()
        },
        () => {
          p.generales = []
          publicar()
        },
      ),
    )
  }

  p.cancelar.push(
    escucharPerfil(
      profesionalUid,
      (perfil) => {
        p.nombre = perfil ? perfil.nombre.trim() || null : null
        // Sus propios audios, solo si es profesional (tiene perfil): así un
        // oyente sin perfil no paga ninguna consulta más.
        if (propio && perfil) empezarGenerales()
        publicar()
      },
      () => {
        p.nombre = null
        publicar()
      },
    ),
  )

  // En su propia página no hay «Para ti» (no se envía nada a sí mismo).
  if (!propio) {
    empezarGenerales()
    p.cancelar.push(
      escucharAudiosParaMi(
        profesionalUid,
        oyenteUid,
        (audios) => {
          p.paraMi = audios
          publicar()
        },
        () => {
          p.paraMi = []
          publicar()
        },
      ),
      vigilarRecibidos(
        profesionalUid,
        (onEnvios, onError) =>
          escucharEnviosParaMi(profesionalUid, oyenteUid, onEnvios, onError),
        escucharAudio,
        (recibidos) => {
          p.recibidos = recibidos.map((r) => r.audio)
          publicar()
        },
        () => {
          p.recibidos = []
          publicar()
        },
      ),
    )
  }
  return p
}

/** Vigila, mientras la app esté abierta, los profesionales de este oyente. */
function iniciar(uid: string) {
  if (vigilancia?.uid === uid) return
  detener()
  const profesionales = new Map<string, DeUnProfesional>()
  const actualizar = (uids: string[]) => {
    const quedan = new Set([...uids, uid])
    for (const [puid, p] of profesionales) {
      if (quedan.has(puid)) continue
      // Vínculo en pausa o borrado: fuera sus audios.
      p.cancelar.forEach((c) => c())
      profesionales.delete(puid)
    }
    for (const puid of quedan) {
      if (!profesionales.has(puid)) {
        profesionales.set(puid, vigilarProfesional(uid, puid))
      }
    }
    publicar()
  }
  const cancelarVinculos = escucharProfesionalesDelOyente(
    uid,
    (vinculos) => actualizar(vinculos.map((v) => v.profesionalUid)),
    () => actualizar([]),
  )
  vigilancia = {
    uid,
    profesionales,
    cancelar: () => {
      cancelarVinculos()
      for (const p of profesionales.values()) p.cancelar.forEach((c) => c())
      profesionales.clear()
    },
  }
  actualizar([])
}

function detener() {
  vigilancia?.cancelar()
  vigilancia = null
  publicar()
}

const suscribir = (avisar: () => void) => {
  suscritos.add(avisar)
  return () => {
    suscritos.delete(avisar)
  }
}

/**
 * Audios de profesionales que el oyente con sesión puede escuchar, para el
 * buscador: los generales publicados y los «para ti» (para una persona o
 * enviados de Mis audios) de sus profesionales con vínculo activo, en
 * cualquier modo, y los suyos publicados si también es profesional.
 * Se empiezan a leer la primera vez que `activo` es true y siguen en vivo
 * mientras la app esté abierta (no se vuelven a pagar al reabrir).
 */
export function useAudiosDeProfesionales(activo: boolean) {
  const { user } = useAuth()
  const uid = user?.uid ?? null

  useEffect(() => {
    if (!uid) {
      if (vigilancia) detener()
      return
    }
    if (activo || (vigilancia && vigilancia.uid !== uid)) iniciar(uid)
  }, [uid, activo])

  return useSyncExternalStore(suscribir, () => instantanea)
}
