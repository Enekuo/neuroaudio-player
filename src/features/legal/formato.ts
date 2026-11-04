import { EMPRESA } from '../../config/empresa'

/**
 * Formato mínimo de los textos legales (sin HTML: todo se pinta como texto):
 *   ### Título de apartado
 *   - elemento de lista          1. elemento de lista numerada
 *   | celda | celda |            (la 1.ª fila es la cabecera; | --- | se salta)
 *   **negrita** dentro de una línea
 * Los bloques se separan con una línea en blanco; el resto son párrafos.
 */
export type Bloque =
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; numerada: boolean; elementos: string[] }
  | { tipo: 'tabla'; cabecera: string[]; filas: string[][] }

const NUMERADA = /^\d+\.\s+/
const celdas = (linea: string) =>
  linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

export function analizarTexto(texto: string): Bloque[] {
  const bloques: Bloque[] = []
  const grupos = texto
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((g) => g.split('\n').filter((l) => l.trim() !== ''))
    .filter((g) => g.length > 0)

  for (const lineas of grupos) {
    const primera = lineas[0].trim()
    if (primera.startsWith('### ')) {
      bloques.push({ tipo: 'titulo', texto: primera.slice(4).trim() })
      const resto = lineas.slice(1).join('\n')
      if (resto.trim()) bloques.push(...analizarTexto(resto))
    } else if (primera.startsWith('|')) {
      const filas = lineas
        .filter((l) => !/^\|?\s*:?-{3,}/.test(l.trim()))
        .map(celdas)
      bloques.push({ tipo: 'tabla', cabecera: filas[0], filas: filas.slice(1) })
    } else if (primera.startsWith('- ')) {
      bloques.push({
        tipo: 'lista',
        numerada: false,
        elementos: lineas.map((l) => l.trim().replace(/^-\s+/, '')),
      })
    } else if (NUMERADA.test(primera)) {
      bloques.push({
        tipo: 'lista',
        numerada: true,
        elementos: lineas.map((l) => l.trim().replace(NUMERADA, '')),
      })
    } else {
      bloques.push({
        tipo: 'parrafo',
        texto: lineas.map((l) => l.trim()).join(' '),
      })
    }
  }
  return bloques
}

/** «a **b** c» → [{ a }, { b, negrita }, { c }]. */
export function partesEnLinea(texto: string) {
  return texto
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((parte) =>
      parte.startsWith('**') && parte.endsWith('**') && parte.length > 4
        ? { texto: parte.slice(2, -2), negrita: true }
        : { texto: parte, negrita: false },
    )
}

/**
 * Pone la razón social y el NIF de src/config/empresa.ts en sus huecos, si
 * ya están rellenos. Si no, los huecos se quedan tal cual.
 */
export function rellenarDatosEmpresa(texto: string, empresa = EMPRESA) {
  const razon = empresa.razonSocial.trim()
  const nif = empresa.nif.trim()
  const cambiar = (t: string, hueco: string, valor: string) =>
    t.split(hueco).join(valor)
  let resultado = texto
  if (razon) resultado = cambiar(resultado, '[nombre o razón social]', razon)
  if (nif) {
    resultado = cambiar(resultado, '[NIF o CIF]', nif)
    resultado = cambiar(resultado, 'NIF o CIF: [ ]', `NIF o CIF: ${nif}`)
    resultado = cambiar(resultado, 'NIF [ ]', `NIF ${nif}`)
  }
  return resultado
}

/** Los huecos que quedan por rellenar: «[fecha]», «[ ]»… */
export const huecosPendientes = (texto: string) =>
  texto.match(/\[[^\]]*\]/g) ?? []
