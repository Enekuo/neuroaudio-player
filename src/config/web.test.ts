import { describe, expect, it } from 'vitest'
import avisoLegal from '../features/legal/textos/avisoLegal'
import { DOMINIO_WEB, URL_WEB, enlaceWeb } from './web'

describe('dirección pública de la web', () => {
  it('es la del dominio propio, con https y www', () => {
    expect(URL_WEB).toBe('https://www.getneuroaudio.com')
    expect(DOMINIO_WEB).toBe('www.getneuroaudio.com')
  })

  it('los enlaces se construyen siempre sobre ella', () => {
    expect(enlaceWeb()).toBe('https://www.getneuroaudio.com/')
    expect(enlaceWeb('/app/profesional/abc')).toBe(
      'https://www.getneuroaudio.com/app/profesional/abc',
    )
    expect(enlaceWeb('legal/privacidad?x=1')).toBe(
      'https://www.getneuroaudio.com/legal/privacidad?x=1',
    )
  })

  it('el aviso legal dice el dominio y ya no tiene el hueco [dominio]', () => {
    expect(avisoLegal).toContain('- Sitio web: www.getneuroaudio.com')
    expect(avisoLegal).not.toContain('[dominio]')
  })
})
