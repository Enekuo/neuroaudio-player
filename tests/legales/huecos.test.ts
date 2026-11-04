// Comprobación antes de desplegar: `npm run legales:comprobar`.
// Falla mientras quede algún hueco [entre corchetes] en los textos legales
// (tras poner la razón social y el NIF de src/config/empresa.ts) y lista
// cuáles faltan en cada página. No forma parte de `npm test`.
import { describe, expect, it } from 'vitest'
import {
  DOCUMENTOS_LEGALES,
  textoDeDocumento,
} from '../../src/features/legal/documentos'
import { huecosPendientes } from '../../src/features/legal/formato'

describe('textos legales listos para publicar', () => {
  for (const doc of DOCUMENTOS_LEGALES) {
    it(`/legal/${doc.slug} no tiene huecos [ ] pendientes`, () => {
      expect(huecosPendientes(textoDeDocumento(doc))).toEqual([])
    })
  }
})
