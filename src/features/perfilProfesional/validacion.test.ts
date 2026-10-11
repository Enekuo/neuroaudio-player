import { describe, expect, it } from 'vitest'
import { iniciales, perfilVacio } from './modelo'
import {
  enlaceDeUsuario,
  enlacesParaEditar,
  normalizarEnlace,
  usuarioDeRed,
  validarPerfil,
} from './validacion'

describe('normalizarEnlace', () => {
  it('acepta una web sin protocolo y la devuelve en https', () => {
    expect(normalizarEnlace('web', 'miconsulta.es')).toEqual({
      url: 'https://miconsulta.es/',
    })
  })

  it('pasa http a https', () => {
    expect(normalizarEnlace('web', 'http://miconsulta.es/sobre')).toEqual({
      url: 'https://miconsulta.es/sobre',
    })
  })

  it('vacío no es un error: el enlace es opcional', () => {
    expect(normalizarEnlace('instagram', '   ')).toBeNull()
  })

  it('rechaza protocolos peligrosos', () => {
    expect(normalizarEnlace('web', 'javascript:alert(1)')).toHaveProperty(
      'error',
    )
    expect(normalizarEnlace('web', 'data:text/html,hola')).toHaveProperty(
      'error',
    )
  })

  it('rechaza textos que no son enlaces', () => {
    expect(normalizarEnlace('web', 'hola')).toHaveProperty('error')
    expect(
      normalizarEnlace('web', 'https://usuario:clave@web.es'),
    ).toHaveProperty('error')
  })
})

describe('redes: nombre de usuario', () => {
  it('construye el enlace completo de cada red', () => {
    expect(normalizarEnlace('instagram', 'luciamartin')).toEqual({
      url: 'https://instagram.com/luciamartin',
    })
    expect(normalizarEnlace('youtube', 'luciamartin')).toEqual({
      url: 'https://youtube.com/@luciamartin',
    })
    expect(normalizarEnlace('tiktok', 'luciamartin')).toEqual({
      url: 'https://tiktok.com/@luciamartin',
    })
  })

  it('quita el @ y los espacios', () => {
    expect(usuarioDeRed('instagram', '@luciamartin')).toEqual({
      usuario: 'luciamartin',
    })
    expect(usuarioDeRed('tiktok', '  @lucia martin ')).toEqual({
      usuario: 'luciamartin',
    })
    expect(usuarioDeRed('youtube', '@ lucia.martin')).toEqual({
      usuario: 'lucia.martin',
    })
  })

  it('admite letras, números, punto, guion y guion bajo', () => {
    expect(usuarioDeRed('instagram', 'Lucia_M-2.0')).toEqual({
      usuario: 'Lucia_M-2.0',
    })
  })

  it('rechaza otros caracteres, sin hablar de «enlace no válido»', () => {
    for (const valor of ['lucía', 'lucia!', 'lucia<script>', 'lucía martín#']) {
      const resultado = usuarioDeRed('instagram', valor)
      expect(resultado).toHaveProperty('error')
      expect((resultado as { error: string }).error).not.toMatch(
        /enlace válido/,
      )
    }
  })

  it('vacío o solo @ no es un error: el campo es opcional', () => {
    expect(normalizarEnlace('instagram', '   ')).toBeNull()
    expect(normalizarEnlace('tiktok', '@')).toBeNull()
  })

  it('si pegan un enlace completo de esa red, extrae el usuario', () => {
    expect(
      usuarioDeRed('instagram', 'https://www.instagram.com/luciamartin/'),
    ).toEqual({
      usuario: 'luciamartin',
    })
    expect(
      usuarioDeRed('instagram', 'instagram.com/luciamartin?igsh=abc'),
    ).toEqual({
      usuario: 'luciamartin',
    })
    expect(
      usuarioDeRed('youtube', 'https://www.youtube.com/@luciamartin/videos'),
    ).toEqual({
      usuario: 'luciamartin',
    })
    expect(
      usuarioDeRed('tiktok', 'https://www.tiktok.com/@luciamartin?lang=es'),
    ).toEqual({
      usuario: 'luciamartin',
    })
    expect(
      normalizarEnlace('instagram', 'https://www.instagram.com/lucia'),
    ).toEqual({
      url: 'https://instagram.com/lucia',
    })
  })

  it('rechaza enlaces de otra red o que no son de un perfil', () => {
    expect(
      usuarioDeRed('tiktok', 'https://instagram.com/lucia'),
    ).toHaveProperty('error')
    expect(
      usuarioDeRed('instagram', 'https://instagram.com.malo.es/x'),
    ).toHaveProperty('error')
    expect(
      usuarioDeRed('instagram', 'https://instagram.com/p/C1abc/'),
    ).toHaveProperty('error')
    expect(
      usuarioDeRed('youtube', 'https://youtube.com/watch?v=abc'),
    ).toHaveProperty('error')
    expect(usuarioDeRed('youtube', 'https://youtu.be/abc')).toHaveProperty(
      'error',
    )
  })

  it('un usuario con puntos no se confunde con un enlace', () => {
    expect(usuarioDeRed('instagram', 'lucia.martin.psico')).toEqual({
      usuario: 'lucia.martin.psico',
    })
  })

  it('al volver a abrir el formulario muestra solo el usuario', () => {
    expect(
      enlacesParaEditar({
        web: 'https://miconsulta.es/',
        instagram: 'https://instagram.com/luciamartin',
        youtube: 'https://youtube.com/@luciamartin',
        tiktok: 'https://tiktok.com/@luciamartin',
      }),
    ).toEqual({
      web: 'https://miconsulta.es/',
      instagram: 'luciamartin',
      youtube: 'luciamartin',
      tiktok: 'luciamartin',
    })
  })

  it('guardar y volver a abrir conserva el usuario (ida y vuelta)', () => {
    for (const red of ['instagram', 'youtube', 'tiktok'] as const) {
      const url = enlaceDeUsuario(red, 'lucia_m')
      expect(enlacesParaEditar({ [red]: url })[red]).toBe('lucia_m')
      expect(url.startsWith('https://')).toBe(true)
    }
  })
})

describe('validarPerfil', () => {
  it('un perfil vacío es válido', () => {
    expect(validarPerfil(perfilVacio())).toEqual({ errores: {}, enlaces: {} })
  })

  it('limita la frase a 160 caracteres', () => {
    const perfil = { ...perfilVacio(), frase: 'a'.repeat(161) }
    expect(validarPerfil(perfil).errores.frase).toBeDefined()
    expect(
      validarPerfil({ ...perfil, frase: 'a'.repeat(160) }).errores.frase,
    ).toBeUndefined()
  })

  it('devuelve los enlaces normalizados y los errores por red', () => {
    const perfil = {
      ...perfilVacio(),
      enlaces: { web: 'miconsulta.es', youtube: 'vimeo.com/x' },
    }
    const { errores, enlaces } = validarPerfil(perfil)
    expect(enlaces).toEqual({ web: 'https://miconsulta.es/' })
    expect(errores.youtube).toBeDefined()
  })

  it('limita el número de fotos', () => {
    const fotos = Array.from({ length: 10 }, (_, i) => ({
      id: `f${i}`,
      alt: '',
    }))
    expect(
      validarPerfil({ ...perfilVacio(), fotos }).errores.fotos,
    ).toBeDefined()
  })
})

describe('iniciales', () => {
  it('toma la primera letra del nombre y del último apellido', () => {
    expect(iniciales('lucía martín ferrer')).toBe('LF')
    expect(iniciales('Ana')).toBe('A')
    expect(iniciales('  ')).toBe('?')
  })
})
