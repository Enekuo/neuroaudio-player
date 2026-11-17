import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DASHBOARD_PROFESIONAL, SECCIONES_PROFESIONAL } from '../data/secciones'
import { AYUDA } from './contenido'
import {
  PAGINAS_AYUDA,
  elegirPaginaAyuda,
  paginaAyudaMostrada,
  paginaDeRuta,
} from './paginas'

describe('ayuda: página marcada según la ruta', () => {
  it('la portada es el Dashboard', () => {
    expect(paginaDeRuta('/profesional')).toBe('dashboard')
    expect(paginaDeRuta('/profesional/')).toBe('dashboard')
  })

  it('cada página del menú se marca a sí misma', () => {
    for (const s of SECCIONES_PROFESIONAL) {
      expect(paginaDeRuta(`/profesional/${s.path}`)).toBe(s.path)
    }
  })

  it('las subpáginas cuentan como su página principal', () => {
    expect(paginaDeRuta('/profesional/listas/programas')).toBe('listas')
    expect(paginaDeRuta('/profesional/listas/programas/abc123')).toBe('listas')
    expect(paginaDeRuta('/profesional/listas/xyz')).toBe('listas')
    expect(paginaDeRuta('/profesional/oyentes/uid-de-alguien')).toBe('oyentes')
    expect(paginaDeRuta('/profesional/ajustes/cuenta')).toBe('ajustes')
  })

  it('no confunde páginas con nombres parecidos ni rutas desconocidas', () => {
    expect(paginaDeRuta('/profesional/mis-audios')).toBe('mis-audios')
    expect(paginaDeRuta('/profesional/audios')).toBe('audios')
    expect(paginaDeRuta('/profesional/audiosx')).toBe('dashboard')
    expect(paginaDeRuta('/profesional/no-existe')).toBe('dashboard')
  })
})

describe('ayuda: elegir otra página', () => {
  it('cambia la ayuda mostrada, sin cambiar la página en la que se está', () => {
    const ruta = '/profesional/perfil'
    const eleccion = elegirPaginaAyuda('ajustes', 'visita-1')
    expect(paginaAyudaMostrada(ruta, 'visita-1', eleccion)).toBe('ajustes')
    // La ruta (dónde está el profesional) no se ha tocado.
    expect(paginaDeRuta(ruta)).toBe('perfil')
  })

  it('el panel no puede navegar: no usa enlaces ni navegación', () => {
    const fuente = readFileSync(
      fileURLToPath(new URL('./PanelAyuda.tsx', import.meta.url)),
      'utf8',
    )
    expect(fuente).not.toMatch(/useNavigate|navigate\(|<Link|NavLink|href=/)
  })

  it('si el profesional cambia de pantalla, la ayuda pasa a la nueva', () => {
    const eleccion = elegirPaginaAyuda('ajustes', 'visita-1')
    expect(
      paginaAyudaMostrada('/profesional/oyentes', 'visita-2', eleccion),
    ).toBe('oyentes')
  })

  it('volver a la pantalla de antes no recupera la elección vieja', () => {
    const eleccion = elegirPaginaAyuda('ajustes', 'visita-1')
    // Cada navegación es una visita nueva, aunque sea a la misma ruta.
    expect(
      paginaAyudaMostrada('/profesional/perfil', 'visita-3', eleccion),
    ).toBe('perfil')
  })

  it('sin elección, se ve la ayuda de la página actual', () => {
    expect(paginaAyudaMostrada('/profesional/audios', 'v', null)).toBe('audios')
  })
})

describe('ayuda: una entrada por cada página del menú', () => {
  it('el desplegable tiene las páginas del menú, en su orden y con sus nombres', () => {
    expect(PAGINAS_AYUDA.map((p) => p.nombre)).toEqual([
      DASHBOARD_PROFESIONAL.label,
      ...SECCIONES_PROFESIONAL.map((s) => s.label),
    ])
    expect(PAGINAS_AYUDA.map((p) => p.icono)).toEqual([
      DASHBOARD_PROFESIONAL.icon,
      ...SECCIONES_PROFESIONAL.map((s) => s.icon),
    ])
  })

  it('cada página tiene su ayuda, y no sobra ninguna', () => {
    const claves = PAGINAS_AYUDA.map((p) => p.clave)
    expect(Object.keys(AYUDA).sort()).toEqual([...claves].sort())
    for (const clave of claves) {
      expect(AYUDA[clave].titulo.trim()).not.toBe('')
      expect(AYUDA[clave].introduccion.trim()).not.toBe('')
    }
  })

  it('cada sección tiene título y algo de contenido, sin huecos vacíos', () => {
    for (const ayuda of Object.values(AYUDA)) {
      for (const s of ayuda.secciones) {
        expect(s.titulo.trim()).not.toBe('')
        expect(Boolean(s.texto?.length || s.pasos?.length || s.nota)).toBe(true)
        for (const t of [...(s.texto ?? []), ...(s.pasos ?? [])]) {
          expect(t.trim()).not.toBe('')
        }
        if (s.nota !== undefined) expect(s.nota.trim()).not.toBe('')
      }
    }
  })
})

/** Todos los textos de una página, en orden. */
const textosDe = (clave: string) => {
  const a = AYUDA[clave]
  return [
    a.titulo,
    a.introduccion,
    ...a.secciones.flatMap((s) => [
      s.titulo,
      ...(s.texto ?? []),
      ...(s.pasos ?? []),
      ...(s.nota ? [s.nota] : []),
    ]),
  ]
}

describe('ayuda: textos definitivos', () => {
  it('cada página tiene sus secciones, en orden', () => {
    const titulos = (clave: string) =>
      AYUDA[clave].secciones.map((s) => s.titulo)
    expect(titulos('dashboard')).toEqual([
      'Qué significan los números',
      'Accesos rápidos',
      'Primeros pasos',
      'Por qué a veces no coinciden',
    ])
    expect(titulos('perfil')).toEqual([
      'Cómo cambiar tu perfil',
      'Cabecera',
      'Fotos',
      'Secciones',
      'Para tus oyentes',
      'Ver cómo queda',
    ])
    expect(titulos('oyentes')).toEqual([
      'La lista',
      'Pausar y reanudar',
      'Enviarle audios de Biblioteca',
      'Crear un audio solo para esa persona',
      'Nota privada',
    ])
    expect(titulos('mis-audios')).toEqual([
      'Subir un audio',
      'Enviar un audio a tus oyentes',
      'Etiquetas',
      'Dónde más puedes usar estos audios',
      'Borrar un audio',
      'Límite',
    ])
    expect(titulos('audios')).toEqual([
      '¿Audios o Biblioteca?',
      'Subir un audio general',
      'Borrador y publicado',
      'Cambiar el orden',
      'Añadir desde Biblioteca',
      'Audios para una persona',
      'Contenido de salud',
      'Editar un audio',
    ])
    expect(titulos('listas')).toEqual([
      '¿Lista o programa?',
      'Crear una lista',
      'Crear un programa',
      'Cómo se abre un programa',
      'Para quién es un programa',
      'El progreso de cada persona',
      'Pasar a borrador o borrar',
    ])
    expect(titulos('mensajes')).toEqual([])
    expect(titulos('estadisticas')).toEqual([])
    expect(titulos('ajustes')).toEqual([
      'General',
      'Cuenta',
      'Privacidad',
      'Plan y uso',
    ])
  })

  it('una sección puede llevar a la vez texto, pasos y nota', () => {
    const programa = AYUDA.listas.secciones.find(
      (s) => s.titulo === 'Crear un programa',
    )
    expect(programa?.pasos).toHaveLength(7)
    expect(programa?.nota).toBe(
      'Un programa nuevo siempre se crea en borrador. Nadie lo ve hasta que lo publicas.',
    )
    const numeros = AYUDA.dashboard.secciones[0]
    expect(numeros.texto).toHaveLength(4)
  })

  it('las páginas que aún no existen lo dicen', () => {
    for (const clave of ['mensajes', 'estadisticas']) {
      expect(AYUDA[clave].introduccion).toBe(
        'Esta página estará disponible próximamente.',
      )
    }
  })

  it('no quedan textos provisionales', () => {
    for (const clave of Object.keys(AYUDA)) {
      for (const t of textosDe(clave)) expect(t).not.toMatch(/^Ayuda de /)
    }
  })

  it('es texto plano: sin etiquetas HTML, y el panel no interpreta HTML', () => {
    for (const clave of Object.keys(AYUDA)) {
      for (const t of textosDe(clave)) expect(t).not.toMatch(/<[a-z/!]/i)
    }
    const fuente = readFileSync(
      fileURLToPath(new URL('./PanelAyuda.tsx', import.meta.url)),
      'utf8',
    )
    expect(fuente).not.toMatch(/dangerouslySetInnerHTML|innerHTML/)
  })
})
