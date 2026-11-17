import { describe, expect, it } from 'vitest'
import { consultasDashboard, perfilCompleto, primerosPasos } from './modelo'

const perfil = {
  nombre: 'Lucía',
  frase: 'Te acompaño a dormir mejor.',
  dedicacion: 'Terapia del sueño.',
  fotoPrincipalId: 'f1',
}

describe('qué cuenta cada número del Dashboard', () => {
  const consultas = Object.fromEntries(
    consultasDashboard('pro-1').map((c) => [c.clave, c]),
  )

  it('son 6 consultas y todas filtran por el propio profesional', () => {
    expect(Object.keys(consultas)).toHaveLength(6)
    for (const c of Object.values(consultas))
      expect(c.filtros[0]).toEqual(['profesionalUid', '==', 'pro-1'])
  })

  it('«Audios publicados»: generales y personales publicados (sin Biblioteca)', () => {
    expect(consultas.audiosPublicados).toEqual({
      clave: 'audiosPublicados',
      coleccion: 'audiosProfesional',
      filtros: [
        ['profesionalUid', '==', 'pro-1'],
        ['estado', '==', 'publicado'],
        ['tipo', 'in', ['general', 'personal']],
      ],
    })
  })

  it('«Oyentes»: vínculos activos', () => {
    expect(consultas.oyentesActivos.coleccion).toBe('vinculos')
    expect(consultas.oyentesActivos.filtros).toContainEqual([
      'estado',
      '==',
      'activo',
    ])
  })

  it('«Programas»: programas publicados (no borradores)', () => {
    expect(consultas.programasPublicados.coleccion).toBe('programasProfesional')
    expect(consultas.programasPublicados.filtros).toContainEqual([
      'estado',
      '==',
      'publicado',
    ])
  })

  it('los totales de «Primeros pasos» no filtran por estado', () => {
    for (const clave of ['audiosTotales', 'vinculosTotales', 'programasTotales'])
      expect(consultas[clave].filtros).toHaveLength(1)
  })
})

describe('perfil completo', () => {
  it('nombre, frase, dedicación y foto principal', () => {
    expect(perfilCompleto(perfil)).toBe(true)
  })

  it('falta cualquiera de ellos (o solo espacios) → incompleto', () => {
    expect(perfilCompleto(null)).toBe(false)
    expect(perfilCompleto({ ...perfil, nombre: '  ' })).toBe(false)
    expect(perfilCompleto({ ...perfil, frase: '' })).toBe(false)
    expect(perfilCompleto({ ...perfil, dedicacion: '' })).toBe(false)
    expect(perfilCompleto({ ...perfil, fotoPrincipalId: null })).toBe(false)
  })
})

describe('primeros pasos', () => {
  const ceros = { audiosTotales: 0, vinculosTotales: 0, programasTotales: 0 }

  it('cuenta nueva: los 4 pendientes', () => {
    const pasos = primerosPasos(null, ceros)
    expect(pasos.map((p) => p.id)).toEqual(['perfil', 'audio', 'oyente', 'programa'])
    expect(pasos.every((p) => !p.hecho)).toBe(true)
  })

  it('cada paso se marca con su dato', () => {
    const pasos = primerosPasos(perfil, {
      audiosTotales: 1,
      vinculosTotales: 0,
      programasTotales: 2,
    })
    expect(Object.fromEntries(pasos.map((p) => [p.id, p.hecho]))).toEqual({
      perfil: true,
      audio: true,
      oyente: false,
      programa: true,
    })
  })

  it('«Invita a tu primer oyente» no tiene enlace (hoy no se puede desde el panel)', () => {
    const oyente = primerosPasos(null, ceros).find((p) => p.id === 'oyente')
    expect(oyente?.accion).toBeNull()
  })

  it('los pendientes con acción llevan a su flujo', () => {
    const pasos = Object.fromEntries(primerosPasos(null, ceros).map((p) => [p.id, p]))
    expect(pasos.perfil.accion?.destino).toEqual({ tipo: 'ruta', destino: '/profesional/perfil' })
    expect(pasos.audio.accion?.destino).toEqual({ tipo: 'subirAudio' })
    expect(pasos.programa.accion?.destino).toEqual({ tipo: 'crearPrograma' })
  })
})
