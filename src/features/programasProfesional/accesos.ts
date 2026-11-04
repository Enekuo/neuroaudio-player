import type { AudioProfesional, EnvioAudio } from '../audiosProfesional/modelo'
import type { AccesoPrograma, ProgramaProfesional } from './modelo'

// Quién puede oír cada audio de la Biblioteca. Las reglas de Storage solo
// pueden mirar dos documentos por descarga (el vínculo y el audio), así que
// esto se guarda ya calculado:
// - en el vínculo de cada persona, `audiosBiblioteca`: sus envíos y los
//   pasos de sus programas privados publicados;
// - en cada audio de la Biblioteca, `publicoEnAudios` (su general en Audios
//   está publicado) y `enProgramaPublico` (está en un programa para todos
//   publicado).
// Lo calcula el panel con lo que ya tiene y escribe solo lo que no cuadra.

type Vinculo = { oyenteUid: string; audiosBiblioteca: string[] }

export type CambiosDeAccesos = {
  vinculos: { oyenteUid: string; audiosBiblioteca: string[] }[]
  audios: {
    audioId: string
    publicoEnAudios: boolean
    enProgramaPublico: boolean
  }[]
}

const mismos = (a: readonly string[], b: readonly string[]) => {
  if (a.length !== b.length) return false
  const sb = new Set(b)
  return a.every((x) => sb.has(x))
}

export function calcularAccesos(datos: {
  biblioteca: AudioProfesional[]
  generales: AudioProfesional[]
  envios: EnvioAudio[]
  programas: ProgramaProfesional[]
  accesos: AccesoPrograma[]
  vinculos: Vinculo[]
}): CambiosDeAccesos {
  const enBiblioteca = new Set(datos.biblioteca.map((a) => a.id))
  const publicados = datos.programas.filter((p) => p.estado === 'publicado')
  const porId = new Map(publicados.map((p) => [p.id, p]))

  // Lo que debería tener cada persona.
  const debido = new Map<string, Set<string>>()
  const dar = (oyenteUid: string, audioId: string) => {
    if (!enBiblioteca.has(audioId)) return
    if (!debido.has(oyenteUid)) debido.set(oyenteUid, new Set())
    debido.get(oyenteUid)!.add(audioId)
  }
  for (const e of datos.envios) dar(e.oyenteUid, e.audioId)
  for (const a of datos.accesos) {
    const programa = porId.get(a.programaId)
    if (programa?.para === 'personas')
      programa.pasos.forEach((id) => dar(a.oyenteUid, id))
  }

  const vinculos = datos.vinculos.flatMap((v) => {
    const audiosBiblioteca = [...(debido.get(v.oyenteUid) ?? [])].sort()
    return mismos(audiosBiblioteca, v.audiosBiblioteca)
      ? []
      : [{ oyenteUid: v.oyenteUid, audiosBiblioteca }]
  })

  const enAudiosPublicado = new Set(
    datos.generales.flatMap((g) =>
      g.deMisAudios && g.estado === 'publicado' ? [g.deMisAudios] : [],
    ),
  )
  const enProgramaPublico = new Set(
    publicados.filter((p) => p.para === 'todos').flatMap((p) => p.pasos),
  )
  const audios = datos.biblioteca.flatMap((b) => {
    const publicoEnAudios = enAudiosPublicado.has(b.id)
    const enPrograma = enProgramaPublico.has(b.id)
    return publicoEnAudios === b.publicoEnAudios &&
      enPrograma === b.enProgramaPublico
      ? []
      : [
          {
            audioId: b.id,
            publicoEnAudios,
            enProgramaPublico: enPrograma,
          },
        ]
  })

  return { vinculos, audios }
}
