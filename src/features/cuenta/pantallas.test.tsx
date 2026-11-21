import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cuenta } from './recorridos'

// Sin Firebase: la cuenta con sesión se decide en cada prueba.
const sesion = vi.hoisted(() => ({
  actual: {
    uid: null as string | null,
    email: null as string | null,
    nombre: null as string | null,
    cuenta: null as Cuenta,
    cargando: false,
  },
}))
vi.mock('./useCuenta', () => ({ useCuenta: () => sesion.actual }))
vi.mock('./cuentaService', () => ({
  entrarConGoogle: vi.fn(),
  leerCuenta: vi.fn(),
  crearCuentaOyente: vi.fn(),
  crearCuentaProfesional: vi.fn(),
  pasarAProfesional: vi.fn(),
}))
vi.mock('../auth/services/authService', () => ({ signOutUser: vi.fn() }))
// Pintado estático: <Navigate> no navega (lo hace en un efecto). Se pinta su
// destino para comprobarlo.
vi.mock('react-router-dom', async (original) => ({
  ...(await original<typeof import('react-router-dom')>()),
  Navigate: ({ to }: { to: string }) => <p>DESTINO {to}</p>,
}))

const { default: LoginPage } = await import('./pages/LoginPage')
const { default: RegistroOyentePage } = await import('./pages/RegistroOyentePage')
const { default: RegistroProfesionalPage } = await import(
  './pages/RegistroProfesionalPage'
)
const { default: EleccionPage } = await import('./pages/EleccionPage')
const { default: ProtectedRoute } = await import('../auth/components/ProtectedRoute')

const SIN_SESION = { uid: null, email: null, nombre: null, cuenta: null, cargando: false }
const conSesion = (cuenta: Cuenta) => ({
  uid: 'ana',
  email: 'ana@correo.com',
  nombre: 'Ana Ruiz',
  cuenta,
  cargando: false,
})

/** Pinta la ruta (si redirige, sale «DESTINO /ruta»). */
function pintar(ruta: string, estado?: unknown) {
  const destino = (nombre: string) => <p>DENTRO DE {nombre}</p>
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[{ pathname: ruta, state: estado }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro/oyente" element={<RegistroOyentePage />} />
        <Route path="/registro/profesional" element={<RegistroProfesionalPage />} />
        <Route path="/registro/elegir" element={<EleccionPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={destino('/app')} />
          <Route path="/profesional" element={destino('/profesional')} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

/** Solo el texto, sin etiquetas ni espacios repetidos. */
const texto = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')

beforeEach(() => {
  sesion.actual = SIN_SESION
})

describe('/login', () => {
  it('sus textos, el botón de Google y los enlaces de debajo', () => {
    const html = pintar('/login')
    const t = texto(html)
    expect(html).toMatch(/<h1 class="registro__titulo">Inicia <em>sesión<\/em><\/h1>/)
    expect(t).toContain('Entra en tu cuenta de NeuroAudio.')
    expect(t).toContain('Iniciar sesión con Google')
    expect(t).toContain('Si es tu primera vez, te preguntaremos si eres profesional u oyente.')
    expect(t).toContain('¿Aún no tienes cuenta? Empezar gratis')
    expect(html).toContain('href="/registro/profesional"')
    expect(t).toContain('¿Eres oyente? Entra aquí')
    expect(html).toContain('href="/registro/oyente"')
    expect(html).toContain('href="/"') // el logo, a la landing
  })

  it('con sesión, cada uno a su sitio (sin cuenta, a la elección)', () => {
    sesion.actual = conSesion('profesional')
    expect(pintar('/login')).toContain('DESTINO /profesional')
    sesion.actual = conSesion('oyente')
    expect(pintar('/login')).toContain('DESTINO /app')
    sesion.actual = conSesion(null)
    expect(pintar('/login')).toContain('DESTINO /registro/elegir')
  })
})

describe('/registro/oyente', () => {
  it('sus textos, sin casilla, con los enlaces legales en pestaña nueva', () => {
    const html = pintar('/registro/oyente')
    const t = texto(html)
    expect(html).toMatch(/Entra como <em>oyente<\/em>/)
    expect(t).toContain('Escucha los audios que tu profesional ha preparado para ti.')
    expect(t).toContain('Registrarse con Google')
    expect(t).toContain(
      'Al registrarte, aceptas los Términos del servicio y la Política de privacidad , y confirmas que eres mayor de edad.',
    )
    expect(html).not.toContain('type="checkbox"')
    expect(html).toMatch(/href="\/legal\/terminos" target="_blank"/)
    expect(html).toMatch(/href="\/legal\/privacidad" target="_blank"/)
    expect(t).toContain('¿Eres profesional? Crea tu cuenta aquí')
    expect(t).toContain('¿Ya tienes cuenta? Iniciar sesión')
  })

  it('con cuenta de cualquier tipo, a la app sin cambiar nada', () => {
    for (const cuenta of ['oyente', 'profesional'] as const) {
      sesion.actual = conSesion(cuenta)
      expect(pintar('/registro/oyente')).toContain('DESTINO /app')
    }
  })
})

describe('/registro/profesional', () => {
  it('pasos, título, campos y botón desactivado hasta que el formulario valga', () => {
    const html = pintar('/registro/profesional')
    const t = texto(html)
    expect(t).toContain('1 Tus datos')
    expect(t).toContain('2 Entrar con Google')
    expect(html).toMatch(/Crea tu cuenta <em>profesional<\/em>/)
    expect(t).toContain('Gratis para empezar. Te llevará menos de un minuto.')
    expect(t).toContain('Nombre profesional')
    expect(t).toContain('Es el nombre que verán tus clientes. Podrás cambiarlo después.')
    expect(t).toContain('¿A qué te dedicas?')
    for (const d of ['Hipnosis', 'Meditación', 'Coaching', 'Psicología', 'Otro']) {
      expect(t).toContain(d)
    }
    expect(t).toContain('País')
    expect(html).toContain('>España<')
    expect(t).toContain('¿Cuántos clientes tienes?')
    for (const c of ['1 a 10', '11 a 50', '51 a 200', 'Más de 200']) expect(t).toContain(c)
    expect(t).toContain(
      'Acepto los Términos del servicio y la Política de privacidad , y confirmo que soy mayor de edad.',
    )
    expect(t).toContain('Quiero recibir novedades y consejos de NeuroAudio por correo.')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Registrarse con Google/)
    expect(t).toContain('Usaremos el correo de tu cuenta de Google.')
    expect(t).toContain('¿Ya tienes cuenta? Iniciar sesión')
    expect(t).toContain('¿Eres oyente? Entra aquí')
    // Sin las dos frases de ventajas debajo.
    expect(t).not.toContain('Cuenta gratis para empezar')
    expect(t).not.toContain('Solo los oyen quienes tú eliges')
  })

  it('los campos tienen su etiqueta (accesibles por teclado y lector)', () => {
    const html = pintar('/registro/profesional')
    expect(html.match(/<(?:input|select)[^>]*\sid="/g)?.length).toBeGreaterThanOrEqual(2)
    for (const [, id] of html.matchAll(/<(?:input|select)[^>]*\sid="([^"]+)"/g)) {
      expect(html).toContain(`for="${id}"`)
    }
    expect(html).toContain('<fieldset')
    expect(html).toContain('<legend')
  })

  it('un profesional con sesión va al panel', () => {
    sesion.actual = conSesion('profesional')
    expect(pintar('/registro/profesional')).toContain('DESTINO /profesional')
  })

  it('un oyente con sesión ve primero el mensaje de confirmación', () => {
    sesion.actual = conSesion('oyente')
    const html = pintar('/registro/profesional')
    const t = texto(html)
    expect(html).toContain('role="alertdialog"')
    expect(t).toContain('¿Seguro que quieres crear una cuenta profesional?')
    expect(t).toContain(
      'Tu cuenta pasará a ser profesional. Conservarás todo lo que tienes como oyente y podrás seguir escuchando desde el panel del oyente.',
    )
    expect(t).toContain('Cancelar')
    expect(t).toContain('Sí, continuar')
  })

  it('con sesión (desde la elección): sin pasos ni pregunta, y botón azul «Crear cuenta profesional»', () => {
    sesion.actual = conSesion(null)
    const html = pintar('/registro/profesional', { desdeEleccion: true })
    const t = texto(html)
    expect(html).not.toContain('role="alertdialog"')
    expect(t).not.toContain('Tus datos')
    expect(t).toContain('Crear cuenta profesional')
    expect(html).toContain('registro__boton--azul')
    expect(t).not.toContain('Registrarse con Google')
    // El nombre de Google ya relleno llega tras el primer pintado (efecto).
  })
})

describe('pantalla de elección', () => {
  it('pastilla con inicial y correo, título, las dos opciones y la nota', () => {
    sesion.actual = conSesion(null)
    const html = pintar('/registro/elegir')
    const t = texto(html)
    expect(t).toContain('A ana@correo.com')
    expect(html).toMatch(/¿Eres <em>profesional<\/em> u <em>oyente<\/em>\?/)
    expect(t).toContain('Todavía no tienes cuenta en NeuroAudio. Elige cómo quieres empezar.')
    expect(t).toContain('Soy profesional')
    expect(t).toContain('Crea tus audios y compártelos con tus clientes.')
    expect(t).toContain('Soy oyente')
    expect(t).toContain('Escucha los audios que tu profesional ha preparado para ti.')
    expect(t).toContain(
      'Si eliges «Soy oyente», aceptas los Términos del servicio y la Política de privacidad , y confirmas que eres mayor de edad.',
    )
    expect(t).toContain('Usar otra cuenta de Google')
    // Las opciones son botones (teclado).
    expect(html.match(/<button[^>]*class="registro__opcion/g)).toHaveLength(2)
  })

  it('sin sesión, a /login; con cuenta, a su sitio', () => {
    expect(pintar('/registro/elegir')).toContain('DESTINO /login')
    sesion.actual = conSesion('oyente')
    expect(pintar('/registro/elegir')).toContain('DESTINO /app')
    sesion.actual = conSesion('profesional')
    expect(pintar('/registro/elegir')).toContain('DESTINO /profesional')
  })
})

describe('rutas con sesión', () => {
  it('con sesión pero sin cuenta (no eligió), a la pantalla de elección', () => {
    sesion.actual = conSesion(null)
    expect(pintar('/app')).toContain('DESTINO /registro/elegir')
  })

  it('sin sesión, a /login; con cuenta, entra', () => {
    expect(pintar('/app')).toContain('DESTINO /login')
    sesion.actual = conSesion('oyente')
    expect(pintar('/app')).toContain('DENTRO DE /app')
    expect(pintar('/app')).not.toContain('DESTINO')
  })
})

describe('botones de la landing', () => {
  const fuente = (ruta: string) =>
    readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')
  const enlace = (codigo: string, textoBoton: string) =>
    codigo.match(
      new RegExp(`<Link\\s+to="([^"]+)"[^>]*>\\s*${textoBoton}\\s*</Link>`),
    )?.[1]

  it('menú: «Iniciar sesión» → /login; «Empezar gratis» → registro del profesional', () => {
    for (const archivo of [
      '../../components/landing/HeroSection.tsx',
      '../../components/landing/NavSimple.tsx',
    ]) {
      const codigo = fuente(archivo)
      expect(enlace(codigo, 'Iniciar sesión')).toBe('/login')
      expect(enlace(codigo, 'Empezar gratis')).toBe('/registro/profesional')
    }
  })

  it('hero: «Soy profesional» y «Soy oyente», a su registro', () => {
    const hero = fuente('../../components/landing/HeroSection.tsx')
    expect(enlace(hero, 'Soy profesional')).toBe('/registro/profesional')
    expect(enlace(hero, 'Soy oyente')).toBe('/registro/oyente')
  })

  it('precios: «Empezar gratis» al registro del profesional; «Suscribirse», como antes', () => {
    const precios = fuente('../../components/landing/Pricing.tsx')
    expect(precios).toMatch(/ctaLabel="Empezar gratis"\s*ctaTo="\/registro\/profesional"/)
    expect(precios).toContain("ctaTo = '/login'")
    expect(precios).not.toMatch(/ctaLabel="Suscribirse"\s*ctaTo=/)
  })

  it('el botón final, al registro del profesional', () => {
    const cta = fuente('../../components/landing/CtaFinalSection.tsx')
    expect(cta).toMatch(/<Link to="\/registro\/profesional" className="na-footer__cta">/)
  })
})
