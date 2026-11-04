import { rellenarDatosEmpresa } from './formato'
import avisoLegal from './textos/avisoLegal'
import cookies from './textos/cookies'
import normas from './textos/normas'
import privacidad from './textos/privacidad'
import terminos from './textos/terminos'

/**
 * Páginas legales de la web (/legal/:slug). Cada texto vive en textos/ y se
 * escribe con el formato de formato.ts. Los huecos [entre corchetes] se
 * quedan visibles hasta rellenarlos; `npm run legales:comprobar` los lista.
 */
export const DOCUMENTOS_LEGALES = [
  { slug: 'aviso-legal', titulo: 'Aviso legal', texto: avisoLegal },
  { slug: 'privacidad', titulo: 'Política de privacidad', texto: privacidad },
  { slug: 'cookies', titulo: 'Política de cookies', texto: cookies },
  { slug: 'terminos', titulo: 'Términos del servicio', texto: terminos },
  { slug: 'normas', titulo: 'Normas de la comunidad', texto: normas },
] as const

export type DocumentoLegal = (typeof DOCUMENTOS_LEGALES)[number]

export const rutaLegal = (slug: DocumentoLegal['slug']) => `/legal/${slug}`

export const buscarDocumentoLegal = (slug: string | undefined) =>
  DOCUMENTOS_LEGALES.find((d) => d.slug === slug) ?? null

/** El texto tal como se muestra: con la razón social y el NIF si ya están. */
export const textoDeDocumento = (doc: DocumentoLegal) =>
  rellenarDatosEmpresa(doc.texto)
