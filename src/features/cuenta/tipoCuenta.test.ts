import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { accesoAlPanel, cambioDeTipoValido, tipoCuentaDe } from './tipoCuenta'

describe('tipo de cuenta', () => {
  it('sale de users/{uid}.tipoCuenta; sin él, o con otra cosa, oyente', () => {
    expect(tipoCuentaDe({ tipoCuenta: 'profesional' })).toBe('profesional')
    expect(tipoCuentaDe({ tipoCuenta: 'oyente' })).toBe('oyente')
    expect(tipoCuentaDe({ email: 'a@b.com' })).toBe('oyente')
    expect(tipoCuentaDe({ tipoCuenta: 'PROFESIONAL' })).toBe('oyente')
    expect(tipoCuentaDe({ tipoCuenta: true })).toBe('oyente')
    expect(tipoCuentaDe(undefined)).toBe('oyente')
    expect(tipoCuentaDe(null)).toBe('oyente')
  })

  it('solo pasa de oyente a profesional', () => {
    expect(cambioDeTipoValido('oyente', 'profesional')).toBe(true)
    expect(cambioDeTipoValido('oyente', 'oyente')).toBe(true)
    expect(cambioDeTipoValido('profesional', 'profesional')).toBe(true)
    expect(cambioDeTipoValido('profesional', 'oyente')).toBe(false)
  })
})

describe('acceso a /profesional', () => {
  it('mientras se sabe, espera; un profesional entra; un oyente va a /app', () => {
    expect(accesoAlPanel(true, 'profesional')).toBe('esperar')
    expect(accesoAlPanel(true, 'oyente')).toBe('esperar')
    expect(accesoAlPanel(false, 'profesional')).toBe('entrar')
    expect(accesoAlPanel(false, 'oyente')).toBe('a-la-app')
  })

  it('la ruta del panel está detrás de la puerta SoloProfesionales', () => {
    const app = readFileSync(
      fileURLToPath(new URL('../../App.tsx', import.meta.url)),
      'utf8',
    ).replace(/\r\n/g, '\n')
    expect(app).toMatch(
      /path="\/profesional\/\*"\s*element=\{\s*<SoloProfesionales>[\s\S]*<ProfesionalApp \/>[\s\S]*<\/SoloProfesionales>/,
    )
  })

  it('el botón «Panel del profesional» depende solo de tipoCuenta (sin leer el perfil)', () => {
    const hook = readFileSync(
      fileURLToPath(
        new URL('../cambioDePanel/useEsProfesional.ts', import.meta.url),
      ),
      'utf8',
    )
    expect(hook).toContain('profile?.tipoCuenta')
    expect(hook).not.toMatch(/perfilesProfesionales|getDoc/)
  })
})
