import { describe, expect, it } from 'vitest'
import type { AudioProfesional, EnvioAudio } from './modelo'
import {
  juntarParaTi,
  sinLosQueYaSonGenerales,
  vigilarRecibidos,
  type AudioRecibido,
} from './recibidos'

const audio = (
  id: string,
  extra: Partial<AudioProfesional> = {},
): AudioProfesional =>
  ({
    id,
    profesionalUid: 'pro',
    titulo: id,
    tipo: 'biblioteca',
    creadoEn: new Date(2026, 0, 1),
    ...extra,
  }) as AudioProfesional

const envio = (audioId: string, dia: number): EnvioAudio => ({
  id: `${audioId}__yo`,
  profesionalUid: 'pro',
  audioId,
  oyenteUid: 'yo',
  creadoEn: new Date(2026, 0, dia),
})

/** Escuchas falsas: se disparan a mano desde la prueba. */
function montar() {
  let enviarEnvios: (e: EnvioAudio[]) => void = () => {}
  const porAudio = new Map<string, (a: AudioProfesional | null) => void>()
  const cancelados: string[] = []
  const avisos: AudioRecibido[][] = []
  const cancelar = vigilarRecibidos(
    'pro',
    (on) => {
      enviarEnvios = on
      return () => cancelados.push('envios')
    },
    (id, on) => {
      porAudio.set(id, on)
      return () => {
        cancelados.push(id)
        porAudio.delete(id)
      }
    },
    (r) => avisos.push(r),
    () => {},
  )
  const ultimo = () => avisos[avisos.length - 1]?.map((r) => r.audio.id)
  return {
    envios: (e: EnvioAudio[]) => enviarEnvios(e),
    audio: (id: string, a: AudioProfesional | null) => porAudio.get(id)?.(a),
    porAudio,
    cancelados,
    avisos,
    ultimo,
    cancelar,
  }
}

describe('vigilarRecibidos', () => {
  it('espera a saber de todos los audios antes de avisar', () => {
    const p = montar()
    p.envios([envio('a', 2), envio('b', 1)])
    p.audio('a', audio('a'))
    expect(p.avisos).toHaveLength(0)
    p.audio('b', audio('b'))
    expect(p.ultimo()).toEqual(['a', 'b'])
  })

  it('sin envíos avisa de inmediato con la lista vacía', () => {
    const p = montar()
    p.envios([])
    expect(p.avisos).toEqual([[]])
  })

  it('al retirar el envío deja de vigilar el audio y desaparece', () => {
    const p = montar()
    p.envios([envio('a', 2), envio('b', 1)])
    p.audio('a', audio('a'))
    p.audio('b', audio('b'))
    p.envios([envio('a', 2)])
    expect(p.cancelados).toContain('b')
    expect(p.ultimo()).toEqual(['a'])
  })

  it('no muestra un audio que no se puede leer, ni uno que no sea de la biblioteca de ese profesional', () => {
    const p = montar()
    p.envios([envio('a', 3), envio('b', 2), envio('c', 1)])
    p.audio('a', null)
    p.audio('b', audio('b', { tipo: 'general' }))
    p.audio('c', audio('c', { profesionalUid: 'otro' }))
    expect(p.ultimo()).toEqual([])
  })

  it('si se vuelve a enviar, lo vuelve a vigilar', () => {
    const p = montar()
    p.envios([envio('a', 1)])
    p.audio('a', audio('a'))
    p.envios([])
    p.envios([envio('a', 5)])
    expect(p.porAudio.has('a')).toBe(true)
    p.audio('a', audio('a'))
    expect(p.ultimo()).toEqual(['a'])
  })

  it('al cancelar lo suelta todo y ya no avisa', () => {
    const p = montar()
    p.envios([envio('a', 1)])
    p.cancelar()
    expect(p.cancelados.sort()).toEqual(['a', 'envios'])
    p.audio('a', audio('a'))
    expect(p.avisos).toHaveLength(0)
  })
})

describe('juntarParaTi', () => {
  it('mezcla personales y recibidos, del más reciente al más antiguo', () => {
    const personales = [
      audio('p1', { tipo: 'personal', creadoEn: new Date(2026, 0, 5) }),
      audio('p2', { tipo: 'personal', creadoEn: new Date(2026, 0, 1) }),
    ]
    const recibidos = [
      // La fecha que cuenta es la del envío, no la del audio.
      { audio: audio('r1'), recibidoEn: new Date(2026, 0, 3) },
      { audio: audio('r2'), recibidoEn: new Date(2026, 0, 9) },
    ]
    expect(juntarParaTi(personales, recibidos).map((a) => a.id)).toEqual([
      'r2',
      'p1',
      'r1',
      'p2',
    ])
  })
})

describe('sinLosQueYaSonGenerales', () => {
  it('quita los recibidos que el profesional también ha puesto en Audios', () => {
    const recibidos = [{ audio: audio('b1') }, { audio: audio('b2') }]
    const generales = [
      audio('b1__general', { tipo: 'general', deMisAudios: 'b1' }),
      audio('g', { tipo: 'general', deMisAudios: null }),
    ]
    expect(
      sinLosQueYaSonGenerales(recibidos, generales).map((r) => r.audio.id),
    ).toEqual(['b2'])
  })

  it('sin generales de Biblioteca, los deja todos', () => {
    const recibidos = [{ audio: audio('b1') }]
    expect(sinLosQueYaSonGenerales(recibidos, [])).toEqual(recibidos)
  })
})
