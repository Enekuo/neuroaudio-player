import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EnlacePanelOyente from '../profesional/layouts/EnlacePanelOyente'
import EnlacePanelProfesional from './EnlacePanelProfesional'
import { TRAZO_CAMBIAR_PANEL } from './cambioDePanel'

const pintar = (elemento: React.ReactElement) =>
  renderToStaticMarkup(<MemoryRouter>{elemento}</MemoryRouter>)

const fuente = (ruta: string) =>
  readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), 'utf8')

describe('app del oyente: «Panel del profesional»', () => {
  it('un profesional lo ve en la barra lateral, con su texto, y lleva a /profesional', () => {
    const html = pintar(
      <EnlacePanelProfesional esProfesional variante="lateral" />,
    )
    expect(html).toContain('href="/profesional"')
    expect(html).toContain('Panel del profesional')
    expect(html).toContain('Ir al panel del profesional')
  })

  it('en móvil es un icono con su aria-label, y lleva a /profesional', () => {
    const html = pintar(
      <EnlacePanelProfesional esProfesional variante="movil" />,
    )
    expect(html).toContain('href="/profesional"')
    expect(html).toContain('aria-label="Ir al panel del profesional"')
    expect(html).not.toContain('>Panel del profesional<')
  })

  it('un oyente normal no ve nada, ni en ordenador ni en móvil', () => {
    expect(
      pintar(
        <EnlacePanelProfesional esProfesional={false} variante="lateral" />,
      ),
    ).toBe('')
    expect(
      pintar(<EnlacePanelProfesional esProfesional={false} variante="movil" />),
    ).toBe('')
  })

  it('está en la barra lateral y junto a la cuenta de Inicio (no en la barra inferior)', () => {
    const lateral = fuente('../library/components/MenuLateral.tsx')
    expect(lateral).toMatch(
      /<EnlacePanelProfesional esProfesional=\{esProfesional\} variante="lateral" \/>/,
    )
    // Después de la barra lateral empieza la barra inferior: ahí no está.
    const barraInferior = lateral.slice(
      lateral.indexOf('className="bottom-nav"'),
    )
    expect(barraInferior).not.toContain('EnlacePanelProfesional')
    const inicio = fuente('../dashboard/components/DashboardHome.tsx')
    expect(inicio).toMatch(
      /<EnlacePanelProfesional esProfesional=\{esProfesional\} variante="movil" \/>\s*<MenuCuentaMovil \/>/,
    )
  })
})

describe('panel profesional: «Panel del oyente»', () => {
  it('se llama así y lleva a la app del oyente (/app)', () => {
    const html = pintar(<EnlacePanelOyente />)
    expect(html).toContain('href="/app"')
    expect(html).toContain('Panel del oyente')
  })

  it('el menú del panel lo usa (y ya no queda «Volver a la app»)', () => {
    const layout = fuente('../profesional/layouts/ProfesionalLayout.tsx')
    expect(layout).toContain('<EnlacePanelOyente sx={navItemSx} />')
    expect(layout).not.toContain('Volver a la app')
  })
})

describe('el mismo icono a los dos lados', () => {
  it('es SwapHoriz, con el mismo trazo en el panel y en la app del oyente', () => {
    const oyente = pintar(
      <EnlacePanelProfesional esProfesional variante="lateral" />,
    )
    expect(oyente).toContain(`d="${TRAZO_CAMBIAR_PANEL}"`)
    const panel = pintar(<EnlacePanelOyente />)
    expect(panel).toContain(`d="${TRAZO_CAMBIAR_PANEL}"`)
  })
})
