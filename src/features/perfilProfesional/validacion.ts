import {
  LIMITES,
  MAX_FOTOS,
  OPCIONES_RESPUESTA,
  REDES,
  type Enlaces,
  type PerfilProfesional,
  type Red,
} from './modelo'

export type RedSocial = Exclude<Red, 'web'>
export const REDES_SOCIALES: RedSocial[] = ['instagram', 'youtube', 'tiktok']

// Dominios de cada red (incluidos los subdominios habituales: www., m.).
const DOMINIOS: Record<RedSocial, string[]> = {
  instagram: ['instagram.com'],
  youtube: ['youtube.com'],
  tiktok: ['tiktok.com'],
}

const NOMBRE_RED: Record<RedSocial, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

/** Enlace completo que se guarda para cada red (las reglas exigen https). */
const PLANTILLA_ENLACE: Record<RedSocial, (usuario: string) => string> = {
  instagram: (u) => `https://instagram.com/${u}`,
  youtube: (u) => `https://youtube.com/@${u}`,
  tiktok: (u) => `https://tiktok.com/@${u}`,
}

/** Letras, números, punto, guion y guion bajo. */
const USUARIO_VALIDO = /^[A-Za-z0-9._-]+$/
const MAX_USUARIO = 50

// Rutas de Instagram que no son un perfil (publicaciones, reels…).
const RUTAS_NO_PERFIL_INSTAGRAM = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'tv',
])

function dominioPermitido(host: string, dominios: string[]) {
  return dominios.some((d) => host === d || host.endsWith(`.${d}`))
}

/**
 * Normaliza y valida la web. Acepta lo que la gente suele escribir
 * («miweb.com», «http://…») y la devuelve siempre en https.
 */
function normalizarWeb(texto: string): { url: string } | { error: string } {
  let url: URL
  try {
    url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(texto) ? texto : `https://${texto}`,
    )
  } catch {
    return { error: 'La web no es un enlace válido.' }
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { error: 'La web debe empezar por https://.' }
  }
  url.protocol = 'https:'

  const host = url.hostname.toLowerCase()
  if (!host.includes('.') || url.username || url.password) {
    return { error: 'La web no es un enlace válido.' }
  }

  const resultado = url.toString()
  if (resultado.length > LIMITES.enlace) {
    return { error: 'La web es demasiado larga.' }
  }
  return { url: resultado }
}

/** ¿Lo escrito parece un enlace (y no un nombre de usuario con puntos)? */
function pareceEnlace(texto: string) {
  return (
    /^https?:\/\//i.test(texto) ||
    texto.includes('/') ||
    /^(www\.|m\.)?(instagram\.com|youtube\.com|youtu\.be|tiktok\.com)$/i.test(
      texto,
    )
  )
}

/**
 * Saca el nombre de usuario de lo que escriba el profesional en una red:
 * «luciamartin», «@luciamartin» o un enlace completo de esa red. Quita el @
 * y los espacios, y comprueba los caracteres.
 */
export function usuarioDeRed(
  red: RedSocial,
  valor: string,
): { usuario: string } | { error: string } | null {
  const texto = valor.trim()
  if (!texto) return null

  let candidato: string
  if (pareceEnlace(texto)) {
    let url: URL
    try {
      url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`)
    } catch {
      return {
        error: `Escribe solo tu nombre de usuario de ${NOMBRE_RED[red]}.`,
      }
    }
    if (!dominioPermitido(url.hostname.toLowerCase(), DOMINIOS[red])) {
      return {
        error: `Ese enlace no es de ${NOMBRE_RED[red]}. Escribe solo tu nombre de usuario.`,
      }
    }
    const primerTramo = decodeURIComponent(
      url.pathname.split('/').filter(Boolean)[0] ?? '',
    )
    if (red === 'instagram') {
      if (
        !primerTramo ||
        RUTAS_NO_PERFIL_INSTAGRAM.has(primerTramo.toLowerCase())
      ) {
        return {
          error:
            'Ese enlace no es de un perfil. Escribe solo tu nombre de usuario.',
        }
      }
      candidato = primerTramo
    } else {
      // YouTube y TikTok: el perfil va con @ (youtube.com/@canal, tiktok.com/@usuario).
      if (!primerTramo.startsWith('@')) {
        return {
          error: `Ese enlace no es de un perfil. Escribe solo tu nombre de usuario de ${NOMBRE_RED[red]}.`,
        }
      }
      candidato = primerTramo
    }
  } else {
    candidato = texto
  }

  const usuario = candidato.replace(/\s+/g, '').replace(/^@+/, '')
  if (!usuario) return null
  if (!USUARIO_VALIDO.test(usuario)) {
    return {
      error:
        'El nombre de usuario solo puede tener letras, números, punto, guion y guion bajo.',
    }
  }
  if (usuario.length > MAX_USUARIO) {
    return { error: 'El nombre de usuario es demasiado largo.' }
  }
  return { usuario }
}

/** Enlace completo de un perfil a partir del nombre de usuario. */
export function enlaceDeUsuario(red: RedSocial, usuario: string) {
  return PLANTILLA_ENLACE[red](usuario)
}

/**
 * Normaliza lo que se ha escrito en un campo de enlace y devuelve el enlace
 * completo que se guarda (siempre https): la web tal cual, las redes a
 * partir del nombre de usuario.
 */
export function normalizarEnlace(
  red: Red,
  valor: string,
): { url: string } | { error: string } | null {
  const texto = valor.trim()
  if (!texto) return null
  if (red === 'web') return normalizarWeb(texto)
  const resultado = usuarioDeRed(red, texto)
  if (!resultado || 'error' in resultado) return resultado
  return { url: enlaceDeUsuario(red, resultado.usuario) }
}

/**
 * Lo que se enseña en el formulario: la web completa y, en las redes, solo
 * el nombre de usuario (sacado del enlace guardado).
 */
export function enlacesParaEditar(enlaces: Enlaces): Enlaces {
  const paraEditar: Enlaces = {}
  for (const red of REDES) {
    const valor = enlaces[red]
    if (!valor) continue
    if (red === 'web') {
      paraEditar.web = valor
      continue
    }
    const resultado = usuarioDeRed(red, valor)
    paraEditar[red] =
      resultado && 'usuario' in resultado ? resultado.usuario : valor
  }
  return paraEditar
}

export type ErroresPerfil = Partial<
  Record<
    | 'nombre'
    | 'frase'
    | 'dedicacion'
    | 'bienvenida'
    | Red
    | 'fotos'
    | 'secciones',
    string
  >
>

/**
 * Valida el perfil antes de guardarlo y devuelve los enlaces normalizados.
 * Las reglas de Firestore repiten los límites en el servidor.
 */
export function validarPerfil(perfil: PerfilProfesional): {
  errores: ErroresPerfil
  enlaces: Enlaces
} {
  const errores: ErroresPerfil = {}
  const enlaces: Enlaces = {}

  if (perfil.nombre.length > LIMITES.nombre) {
    errores.nombre = `Máximo ${LIMITES.nombre} caracteres.`
  }
  if (perfil.frase.length > LIMITES.frase) {
    errores.frase = `Máximo ${LIMITES.frase} caracteres.`
  }
  if (perfil.dedicacion.length > LIMITES.dedicacion) {
    errores.dedicacion = `Máximo ${LIMITES.dedicacion} caracteres.`
  }
  if (perfil.bienvenida.length > LIMITES.bienvenida) {
    errores.bienvenida = `Máximo ${LIMITES.bienvenida} caracteres.`
  }

  for (const red of REDES) {
    const resultado = normalizarEnlace(red, perfil.enlaces[red] ?? '')
    if (resultado && 'error' in resultado) errores[red] = resultado.error
    else if (resultado) enlaces[red] = resultado.url
  }

  if (perfil.fotos.length > MAX_FOTOS) {
    errores.fotos = `Máximo ${MAX_FOTOS} fotos.`
  } else if (perfil.fotos.some((f) => f.alt.length > LIMITES.altFoto)) {
    errores.fotos = `El texto alternativo admite ${LIMITES.altFoto} caracteres.`
  }

  if (perfil.secciones.length > LIMITES.secciones) {
    errores.secciones = `Máximo ${LIMITES.secciones} secciones.`
  } else if (
    perfil.secciones.some(
      (s) =>
        s.titulo.length > LIMITES.tituloSeccion ||
        s.texto.length > LIMITES.textoSeccion,
    )
  ) {
    errores.secciones = `Cada sección admite un título de ${LIMITES.tituloSeccion} caracteres y un texto de ${LIMITES.textoSeccion}.`
  }

  return { errores, enlaces }
}

export function esTiempoRespuesta(
  valor: unknown,
): valor is PerfilProfesional['respuesta'] {
  return valor === null || OPCIONES_RESPUESTA.some((o) => o.valor === valor)
}
