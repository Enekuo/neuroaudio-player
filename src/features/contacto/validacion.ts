/**
 * Formulario de contacto (/contacto): opciones, límites y validación. Los
 * límites coinciden con las reglas de Firestore (match /mensajesContacto).
 */
export const LIMITES = {
  nombre: 100,
  correo: 200,
  mensajeMin: 10,
  mensajeMax: 2000,
} as const

export const OPCIONES_QUE_ERES = [
  { valor: 'profesional', etiqueta: 'Profesional' },
  { valor: 'oyente', etiqueta: 'Oyente' },
] as const

export const OPCIONES_MOTIVO = [
  { valor: 'duda', etiqueta: 'Una duda' },
  { valor: 'cuenta', etiqueta: 'Ayuda con mi cuenta' },
  { valor: 'ser-profesional', etiqueta: 'Quiero ser profesional' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const

export type QueEres = (typeof OPCIONES_QUE_ERES)[number]['valor']
export type Motivo = (typeof OPCIONES_MOTIVO)[number]['valor']

/** Lo que hay en el formulario (las listas, '' si no se eligió nada). */
export type FormularioContacto = {
  nombre: string
  correo: string
  queEres: string
  motivo: string
  mensaje: string
  aceptoPrivacidad: boolean
}

/** Lo que se guarda (sin la fecha, que pone el servidor). */
export type MensajeContacto = {
  nombre: string
  correo: string
  queEres: QueEres | null
  motivo: Motivo | null
  mensaje: string
  aceptoPrivacidad: true
}

export type ErroresContacto = Partial<
  Record<'nombre' | 'correo' | 'queEres' | 'motivo' | 'mensaje' | 'aceptoPrivacidad', string>
>

export const FORMULARIO_VACIO: FormularioContacto = {
  nombre: '',
  correo: '',
  queEres: '',
  motivo: '',
  mensaje: '',
  aceptoPrivacidad: false,
}

// Igual que en las reglas: algo@algo.algo, sin espacios.
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const esQueEres = (v: string): v is QueEres =>
  OPCIONES_QUE_ERES.some((o) => o.valor === v)
const esMotivo = (v: string): v is Motivo =>
  OPCIONES_MOTIVO.some((o) => o.valor === v)

/** Errores por campo, en español; vacío si todo está bien. */
export function validarContacto(f: FormularioContacto): ErroresContacto {
  const errores: ErroresContacto = {}
  const nombre = f.nombre.trim()
  const correo = f.correo.trim()
  const mensaje = f.mensaje.trim()

  if (!nombre) errores.nombre = 'Escribe tu nombre.'
  else if (nombre.length > LIMITES.nombre)
    errores.nombre = `El nombre puede tener como máximo ${LIMITES.nombre} caracteres.`

  if (!correo) errores.correo = 'Escribe tu correo electrónico.'
  else if (correo.length > LIMITES.correo)
    errores.correo = `El correo puede tener como máximo ${LIMITES.correo} caracteres.`
  else if (!CORREO.test(correo))
    errores.correo = 'Revisa el correo: debe ser como nombre@correo.com.'

  if (f.queEres && !esQueEres(f.queEres))
    errores.queEres = 'Elige una opción de la lista.'
  if (f.motivo && !esMotivo(f.motivo))
    errores.motivo = 'Elige una opción de la lista.'

  if (!mensaje) errores.mensaje = 'Escribe tu mensaje.'
  else if (mensaje.length < LIMITES.mensajeMin)
    errores.mensaje = `El mensaje debe tener al menos ${LIMITES.mensajeMin} caracteres.`
  else if (mensaje.length > LIMITES.mensajeMax)
    errores.mensaje = `El mensaje puede tener como máximo ${LIMITES.mensajeMax} caracteres.`

  if (!f.aceptoPrivacidad)
    errores.aceptoPrivacidad =
      'Para enviar el mensaje tienes que aceptar la Política de privacidad.'

  return errores
}

/** El formulario ya validado, listo para guardar (recortado y con null). */
export function prepararMensaje(f: FormularioContacto): MensajeContacto {
  return {
    nombre: f.nombre.trim(),
    correo: f.correo.trim(),
    queEres: esQueEres(f.queEres) ? f.queEres : null,
    motivo: esMotivo(f.motivo) ? f.motivo : null,
    mensaje: f.mensaje.trim(),
    aceptoPrivacidad: true,
  }
}

// Anti-spam (sin servicios externos ni almacenamiento en el navegador).
/** Tiempo mínimo desde que se abre el formulario hasta que se envía. */
export const TIEMPO_MINIMO_MS = 3000

/** ¿Parece un robot? Rellenó el campo trampa o envió demasiado rápido. */
export const pareceRobot = (trampa: string, abiertoHaceMs: number) =>
  trampa.trim() !== '' || abiertoHaceMs < TIEMPO_MINIMO_MS
