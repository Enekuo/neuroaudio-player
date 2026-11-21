import { describe, expect, it, vi } from 'vitest'
import {
  RUTA_APP,
  RUTA_ELECCION,
  RUTA_PANEL,
  destinoTrasLogin,
  entradaEleccion,
  entradaRegistroProfesional,
  esCancelacionDeGoogle,
  recorridoLogin,
  recorridoRegistroOyente,
  recorridoRegistroProfesional,
  type Acciones,
  type Cuenta,
} from './recorridos'

/**
 * Acciones de prueba: una «base de datos» con la cuenta de la persona y el
 * registro de lo que se hizo. confirmar = respuesta al mensaje de oyente a
 * profesional.
 */
function preparar(cuentaInicial: Cuenta, confirmar = true) {
  let cuenta = cuentaInicial
  const a = {
    entrar: vi.fn(async () => 'ana'),
    leerCuenta: vi.fn(async () => cuenta),
    crearOyente: vi.fn(async () => {
      cuenta = 'oyente'
    }),
    crearProfesional: vi.fn(async () => {
      cuenta = 'profesional'
    }),
    pasarAProfesional: vi.fn(async () => {
      cuenta = 'profesional'
    }),
    confirmarPaso: vi.fn(async () => confirmar),
  } satisfies Acciones
  const escrituras = () =>
    a.crearOyente.mock.calls.length +
    a.crearProfesional.mock.calls.length +
    a.pasarAProfesional.mock.calls.length
  return { a, escrituras, cuenta: () => cuenta }
}

describe('/login (no crea nada al entrar)', () => {
  it('profesional → panel; oyente → app; sin cuenta → elección', async () => {
    for (const [cuenta, destino] of [
      ['profesional', RUTA_PANEL],
      ['oyente', RUTA_APP],
      [null, RUTA_ELECCION],
    ] as const) {
      const p = preparar(cuenta)
      expect(await recorridoLogin(p.a)).toBe(destino)
      expect(p.a.entrar).toHaveBeenCalledOnce()
      expect(p.escrituras()).toBe(0)
      expect(p.cuenta()).toBe(cuenta)
    }
  })

  it('con sesión, el mismo destino', () => {
    expect(destinoTrasLogin('profesional')).toBe(RUTA_PANEL)
    expect(destinoTrasLogin('oyente')).toBe(RUTA_APP)
    expect(destinoTrasLogin(null)).toBe(RUTA_ELECCION)
  })

  it('si cierra la ventana de Google, no pasa nada (y no es un error)', async () => {
    const p = preparar(null)
    p.a.entrar.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' })
    const error = await recorridoLogin(p.a).catch((e: unknown) => e)
    expect(esCancelacionDeGoogle(error)).toBe(true)
    expect(p.a.leerCuenta).not.toHaveBeenCalled()
    expect(esCancelacionDeGoogle({ code: 'auth/network-request-failed' })).toBe(false)
    expect(esCancelacionDeGoogle(null)).toBe(false)
  })
})

describe('pantalla de elección', () => {
  it('solo con sesión y sin cuenta; si no, a su sitio', () => {
    expect(entradaEleccion(false, null)).toBe('login')
    expect(entradaEleccion(true, null)).toBe('mostrar')
    expect(entradaEleccion(true, 'oyente')).toBe(RUTA_APP)
    expect(entradaEleccion(true, 'profesional')).toBe(RUTA_PANEL)
  })

  it('«Soy oyente» crea la cuenta de oyente y va a la app', async () => {
    const p = preparar(null)
    expect(await recorridoRegistroOyente(p.a, 'ana')).toBe(RUTA_APP)
    expect(p.a.entrar).not.toHaveBeenCalled() // ya tenía sesión
    expect(p.a.crearOyente).toHaveBeenCalledWith('ana')
    expect(p.cuenta()).toBe('oyente')
  })

  it('«Soy profesional» lleva al formulario, sin preguntar', () => {
    expect(entradaRegistroProfesional(null, true)).toBe('formulario')
  })
})

describe('/registro/oyente', () => {
  it('oyente nuevo: entra, se crea como oyente y va a la app', async () => {
    const p = preparar(null)
    expect(await recorridoRegistroOyente(p.a, null)).toBe(RUTA_APP)
    expect(p.a.entrar).toHaveBeenCalledOnce()
    expect(p.a.crearOyente).toHaveBeenCalledOnce()
    expect(p.cuenta()).toBe('oyente')
  })

  it('con cuenta de cualquier tipo: a la app sin cambiar nada', async () => {
    for (const cuenta of ['oyente', 'profesional'] as const) {
      const p = preparar(cuenta)
      expect(await recorridoRegistroOyente(p.a, null)).toBe(RUTA_APP)
      expect(p.escrituras()).toBe(0)
      expect(p.cuenta()).toBe(cuenta)
    }
  })
})

describe('/registro/profesional', () => {
  it('profesional nuevo: entra, se crea como profesional y va al panel', async () => {
    const p = preparar(null)
    expect(await recorridoRegistroProfesional(p.a, null)).toBe(RUTA_PANEL)
    expect(p.a.crearProfesional).toHaveBeenCalledWith('ana')
    expect(p.a.confirmarPaso).not.toHaveBeenCalled()
    expect(p.cuenta()).toBe('profesional')
  })

  it('ya profesional: al panel sin cambiar nada', async () => {
    const p = preparar('profesional')
    expect(await recorridoRegistroProfesional(p.a, null)).toBe(RUTA_PANEL)
    expect(p.escrituras()).toBe(0)
  })

  it('oyente que confirma: pasa a profesional y va al panel', async () => {
    const p = preparar('oyente', true)
    expect(await recorridoRegistroProfesional(p.a, null)).toBe(RUTA_PANEL)
    expect(p.a.confirmarPaso).toHaveBeenCalledOnce()
    expect(p.a.pasarAProfesional).toHaveBeenCalledWith('ana')
    expect(p.a.crearProfesional).not.toHaveBeenCalled() // conserva lo que tenía
    expect(p.cuenta()).toBe('profesional')
  })

  it('oyente que cancela: sigue siendo oyente y va a la app', async () => {
    const p = preparar('oyente', false)
    expect(await recorridoRegistroProfesional(p.a, null)).toBe(RUTA_APP)
    expect(p.escrituras()).toBe(0)
    expect(p.cuenta()).toBe('oyente')
  })

  it('oyente con sesión que ya confirmó al entrar: no se le pregunta otra vez', async () => {
    const p = preparar('oyente')
    expect(await recorridoRegistroProfesional(p.a, 'ana', true)).toBe(RUTA_PANEL)
    expect(p.a.entrar).not.toHaveBeenCalled()
    expect(p.a.confirmarPaso).not.toHaveBeenCalled()
    expect(p.a.pasarAProfesional).toHaveBeenCalledOnce()
  })

  it('al abrirlo con sesión: profesional → panel; oyente → pregunta (salvo desde la elección); sin cuenta → formulario', () => {
    expect(entradaRegistroProfesional('profesional', false)).toBe('panel')
    expect(entradaRegistroProfesional('profesional', true)).toBe('panel')
    expect(entradaRegistroProfesional('oyente', false)).toBe('preguntar')
    expect(entradaRegistroProfesional('oyente', true)).toBe('formulario')
    expect(entradaRegistroProfesional(null, false)).toBe('formulario')
  })

  it('si falla al crear, el error sale (para avisar) y no se navega', async () => {
    const p = preparar(null)
    p.a.crearProfesional.mockRejectedValueOnce(new Error('sin conexión'))
    await expect(recorridoRegistroProfesional(p.a, null)).rejects.toThrow('sin conexión')
    expect(esCancelacionDeGoogle(new Error('sin conexión'))).toBe(false)
  })
})
