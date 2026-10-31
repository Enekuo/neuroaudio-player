import { IDIOMA } from './idioma'

/** Número con su unidad (MB/GB), con los decimales justos, en el idioma dado. */
const conUnidad = (
  valor: number,
  unidad: 'megabyte' | 'gigabyte',
  decimales: number,
  idioma: string,
) =>
  new Intl.NumberFormat(idioma, {
    style: 'unit',
    unit: unidad,
    unitDisplay: 'short',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor)

/**
 * Espacio ocupado: MB (o GB a partir de 1024 MB), con 2 decimales por debajo
 * de 10 MB y 1 hasta 1 GB. El formato (coma o punto decimal, separador de
 * miles, nombre de la unidad) lo pone Intl según el idioma; en español:
 * «63,5 MB». Lo usan «Plan y uso» de la app y del panel.
 */
export function formatearEspacio(bytes: number, idioma = IDIOMA) {
  if (!(bytes > 0)) return conUnidad(0, 'megabyte', 0, idioma)
  const mb = bytes / (1024 * 1024)
  if (mb < 1024) return conUnidad(mb, 'megabyte', mb < 10 ? 2 : 1, idioma)
  return conUnidad(mb / 1024, 'gigabyte', 2, idioma)
}
