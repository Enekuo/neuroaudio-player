import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PAGINAS_AYUDA } from '../ayuda/paginas'
import {
  BORRADORES_VACIOS,
  LIMITES_SOPORTE,
  PAGINA_OTRA,
  SUBTIPOS_COMENTARIO,
  construirMensajeSoporte,
  leerBorradores,
  textoSoporteValido,
  type DatosEnvioSoporte,
} from './modelo'

const datos = (extra: Partial<DatosEnvioSoporte> = {}): DatosEnvioSoporte => ({
  cuenta: { uid: 'u1', nombre: 'Lucía Pérez', correo: 'lucia@correo.com' },
  tipo: 'problema',
  subtipo: null,
  pagina: 'audios',
  texto: '  No me deja subir el audio.  ',
  ruta: '/profesional/audios',
  navegador: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130',
  modoOscuro: false,
  ...extra,
})

describe('soporte: el texto', () => {
  it('mínimo 10 caracteres sin contar espacios y máximo 2.000', () => {
    expect(textoSoporteValido('123456789')).toBe(false)
    expect(textoSoporteValido('   123456789   ')).toBe(false)
    expect(textoSoporteValido('1234567890')).toBe(true)
    expect(textoSoporteValido('a'.repeat(2000))).toBe(true)
    expect(textoSoporteValido('a'.repeat(2001))).toBe(false)
    expect(textoSoporteValido('')).toBe(false)
  })
})

describe('soporte: el mensaje que se guarda', () => {
  it('lleva exactamente los campos acordados, nada más', () => {
    const m = construirMensajeSoporte(datos())
    expect(Object.keys(m).sort()).toEqual(
      [
        'uid',
        'nombre',
        'correo',
        'tipo',
        'subtipo',
        'pagina',
        'texto',
        'estado',
        'contexto',
      ].sort(),
    )
    expect(Object.keys(m.contexto).sort()).toEqual(
      ['ruta', 'navegador', 'modo'].sort(),
    )
  })

  it('uid, nombre y correo salen de la cuenta; el texto, sin espacios sobrantes', () => {
    const m = construirMensajeSoporte(datos())
    expect(m).toMatchObject({
      uid: 'u1',
      nombre: 'Lucía Pérez',
      correo: 'lucia@correo.com',
      tipo: 'problema',
      subtipo: null,
      pagina: 'audios',
      texto: 'No me deja subir el audio.',
      estado: 'nuevo',
      contexto: {
        ruta: '/profesional/audios',
        navegador: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130',
        modo: 'claro',
      },
    })
  })

  it('un problema nunca lleva subtipo; un comentario, sí', () => {
    expect(
      construirMensajeSoporte(datos({ subtipo: 'me_gusta' })).subtipo,
    ).toBeNull()
    expect(
      construirMensajeSoporte(
        datos({ tipo: 'comentario', subtipo: 'no_me_gusta' }),
      ).subtipo,
    ).toBe('no_me_gusta')
  })

  it('modo oscuro, cuenta sin nombre y textos largos recortados', () => {
    const m = construirMensajeSoporte(
      datos({
        modoOscuro: true,
        cuenta: { uid: 'u1', nombre: null, correo: 'a@b.com' },
        navegador: 'x'.repeat(500),
        ruta: '/profesional/' + 'y'.repeat(500),
      }),
    )
    expect(m.contexto.modo).toBe('oscuro')
    expect(m.nombre).toBe('')
    expect(m.contexto.navegador).toHaveLength(LIMITES_SOPORTE.navegador)
    expect(m.contexto.ruta).toHaveLength(LIMITES_SOPORTE.ruta)
  })
})

describe('soporte: opciones', () => {
  it('«¿En qué página ocurre?»: las del menú más «Otra o no lo sé»', () => {
    const claves = [...PAGINAS_AYUDA.map((p) => p.clave), PAGINA_OTRA]
    // Las mismas que admiten las reglas propuestas.
    expect(claves).toEqual([
      'dashboard',
      'perfil',
      'oyentes',
      'mis-audios',
      'audios',
      'listas',
      'mensajes',
      'estadisticas',
      'ajustes',
      'otra',
    ])
  })

  it('tipos de comentario, con sus textos', () => {
    expect(SUBTIPOS_COMENTARIO.map((s) => [s.valor, s.etiqueta])).toEqual([
      ['sugerencia', 'Una sugerencia'],
      ['me_gusta', 'Algo que me gusta'],
      ['no_me_gusta', 'Algo que no me gusta'],
    ])
  })

  it('las reglas propuestas admiten exactamente esas páginas y tipos', () => {
    for (const modo of ['todos', 'solo-vinculados']) {
      const reglas = readFileSync(
        fileURLToPath(
          new URL(
            `../../../../reglas/propuestas/firestore.${modo}.rules`,
            import.meta.url,
          ),
        ),
        'utf8',
      )
      expect(reglas).toContain(
        "['dashboard', 'perfil', 'oyentes', 'mis-audios', 'audios', 'listas', 'mensajes', 'estadisticas', 'ajustes', 'otra']",
      )
      expect(reglas).toContain("['sugerencia', 'me_gusta', 'no_me_gusta']")
      expect(reglas).toContain(`size() <= ${LIMITES_SOPORTE.textoMax}`)
    }
  })
})

describe('soporte: borradores de la sesión', () => {
  it('sin nada guardado, vacíos', () => {
    expect(leerBorradores(null)).toEqual(BORRADORES_VACIOS)
  })

  it('recupera lo escrito a medias', () => {
    const guardado = JSON.stringify({
      problema: { texto: 'Algo a medias', pagina: 'perfil' },
      comentario: { texto: 'Me gusta', subtipo: 'me_gusta' },
    })
    expect(leerBorradores(guardado)).toEqual({
      problema: { texto: 'Algo a medias', pagina: 'perfil' },
      comentario: { texto: 'Me gusta', subtipo: 'me_gusta' },
    })
  })

  it('lo roto o raro se queda vacío', () => {
    expect(leerBorradores('{no es json')).toEqual(BORRADORES_VACIOS)
    expect(
      leerBorradores(
        JSON.stringify({
          problema: { texto: 42, pagina: {} },
          comentario: { texto: 'ok', subtipo: 'spam' },
        }),
      ),
    ).toEqual({
      problema: { texto: '', pagina: null },
      comentario: { texto: 'ok', subtipo: null },
    })
  })

  it('no guarda más de 2.000 caracteres', () => {
    const largo = JSON.stringify({ problema: { texto: 'a'.repeat(5000) } })
    expect(leerBorradores(largo).problema.texto).toHaveLength(2000)
  })
})
