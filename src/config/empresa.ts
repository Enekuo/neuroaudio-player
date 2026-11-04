/**
 * Datos de la empresa que se muestran en el pie de la landing y en las
 * páginas legales. Único sitio donde se rellenan.
 *
 * Mientras estén vacíos no se muestra nada (ni texto de relleno): el pie
 * enseña solo «© 2026 NeuroAudio». Al rellenarlos, aparecen a su lado:
 * «© 2026 NeuroAudio · Razón Social S.L. · NIF B12345678».
 */
export const EMPRESA = {
  /** Razón social tal como figura en el registro, p. ej. «NeuroAudio S.L.». */
  razonSocial: '',
  /** NIF / CIF, p. ej. «B12345678». */
  nif: '',
}

/** «Razón Social · NIF B12345678», o '' si aún no hay datos. */
export function textoIdentificacionEmpresa(empresa = EMPRESA) {
  const razon = empresa.razonSocial.trim()
  const nif = empresa.nif.trim()
  return [razon, nif && `NIF ${nif}`].filter(Boolean).join(' · ')
}
