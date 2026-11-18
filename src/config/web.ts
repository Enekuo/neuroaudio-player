/**
 * Dirección pública de la web de NeuroAudio. Único sitio donde está escrita:
 * todo lo que necesite la dirección (textos legales, y en el futuro enlaces
 * de invitación, correos, metadatos…) sale de aquí.
 *
 * getneuroaudio.com (sin www) redirige a esta.
 */
export const URL_WEB = 'https://www.getneuroaudio.com'

/** El dominio tal como se escribe en un texto: «www.getneuroaudio.com». */
export const DOMINIO_WEB = new URL(URL_WEB).host

/**
 * Enlace completo a una página de la web, p. ej.
 * enlaceWeb('/app/profesional/abc') → «https://www.getneuroaudio.com/app/profesional/abc».
 * Siempre sobre URL_WEB, nunca sobre la dirección en la que se esté (que en
 * pruebas o en una vista previa sería otra).
 */
export function enlaceWeb(ruta = '/') {
  return new URL(ruta, URL_WEB).toString()
}
