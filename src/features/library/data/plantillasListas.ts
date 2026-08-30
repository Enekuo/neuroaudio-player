import type { TemplateIconName } from '../components/TemplateIcon'

export type ListTemplate = {
  /** Identificador interno estable. NO cambiar: se guarda en Firestore (campo `template`) y en el id de las carpetas fijas. */
  id: string
  /** Texto visible para el usuario. Se puede cambiar libremente sin afectar a datos ya guardados. */
  label: string
  gradientFrom: string
  gradientTo: string
  icon: TemplateIconName
  /** Imagen de fondo opcional para la tarjeta de plantilla (TemplateGrid). Si no se define, la tarjeta usa el icono. */
  cardImage?: string
  /** Tamaño de esa imagen de fondo, en % del ancho de la tarjeta (background-size). Por defecto 50 si no se indica. */
  cardImageSize?: number
  /** Posición de esa imagen de fondo (background-position): 'center', '30% 70%', 'right top', etc. Por defecto 'center' si no se indica. */
  cardImagePosition?: string
}

export const LIST_TEMPLATES: ListTemplate[] = [
  { id: 'meditacion', label: 'Meditación', gradientFrom: '#1D9E75', gradientTo: '#0F6E56', icon: 'yinyang', cardImage: '/images/img_tarjeta1.png', cardImageSize: 75, cardImagePosition: 'center' },
  { id: 'hipnosis', label: 'Hipnosis', gradientFrom: '#7F77DD', gradientTo: '#3C3489', icon: 'spiral', cardImage: '/images/img_tarjeta2.png', cardImageSize: 75, cardImagePosition: 'center' },
  { id: 'reprogramacion', label: 'Reprogramación', gradientFrom: '#378ADD', gradientTo: '#0C447C', icon: 'refresh', cardImage: '/images/img_tarjeta3.png', cardImagePosition: 'center' },
  { id: 'subliminales', label: 'Subliminales', gradientFrom: '#D4537E', gradientTo: '#72243E', icon: 'wave-sine', cardImage: '/images/img_tarjeta4.png', cardImagePosition: 'center' },
  { id: 'mantras', label: 'Mantras', gradientFrom: '#EF9F27', gradientTo: '#854F0B', icon: 'om', cardImage: '/images/img_tarjeta5.png', cardImageSize: 75, cardImagePosition: 'center' },
  { id: 'dormir', label: 'Para dormir', gradientFrom: '#26215C', gradientTo: '#042C53', icon: 'moon', cardImage: '/images/img_tarjeta6.png', cardImagePosition: 'center' },
  // id 'ansiedad' se mantiene por compatibilidad con listas ya creadas y el backend; solo cambia la etiqueta visible.
  { id: 'ansiedad', label: 'Visualización', gradientFrom: '#5DCAA5', gradientTo: '#0F6E56', icon: 'wind', cardImage: '/images/img_tarjeta7.png', cardImageSize: 75, cardImagePosition: 'center' },
  { id: 'motivacion', label: 'Motivación', gradientFrom: '#D85A30', gradientTo: '#712B13', icon: 'flame' },
]

export const CUSTOM_TEMPLATE_ID = 'personalizada'

export const CUSTOM_TEMPLATE: ListTemplate = {
  id: CUSTOM_TEMPLATE_ID,
  label: 'Personalizada',
  gradientFrom: '#3A3B40',
  gradientTo: '#1B1C1F',
  icon: 'lista',
}

export function getTemplateById(id: string): ListTemplate {
  return LIST_TEMPLATES.find((template) => template.id === id) ?? CUSTOM_TEMPLATE
}

/**
 * Id determinista del documento de lista para una categoría fija de un usuario.
 * Así la carpeta "Meditación" de un usuario siempre es el mismo documento y se
 * puede crear de forma perezosa la primera vez que se le añade un audio.
 */
export function listaFijaId(uid: string, templateId: string): string {
  return `${uid}__${templateId}`
}

/** Modelo de vista de una carpeta de la biblioteca (categoría fija o lista personalizada). */
export type LibraryFolder = {
  /** Clave estable para el estado de UI (id de plantilla para las fijas, id de doc para las personalizadas). */
  key: string
  /** Id del documento Firestore (ya exista o no todavía, en el caso de las fijas). */
  listaId: string
  name: string
  /** Id de plantilla, para resolver icono/gradiente vía getTemplateById. */
  template: string
  isCustom: boolean
  /** Ids de audios asociados según el documento (sin filtrar por audios existentes). */
  audioIds: string[]
  /** Nº de audios que existen realmente en la biblioteca del usuario. */
  count: number
}
