import { describe, expect, it } from 'vitest'
import {
  ErrorAudio,
  comprobarArchivoAudio,
  detectarTipoAudio,
  tituloDesdeArchivo,
} from './archivoAudio'
import { MAX_TAMANO_AUDIO } from './modelo'

const bytes = (...partes: (string | number[])[]) =>
  new Uint8Array(
    partes.flatMap((p) =>
      typeof p === 'string' ? [...p].map((c) => c.charCodeAt(0)) : p,
    ),
  )

const archivo = (contenido: BlobPart, nombre: string, tipo = '') =>
  new File([contenido], nombre, { type: tipo })

describe('detectarTipoAudio', () => {
  it('reconoce MP3 con etiqueta ID3 y sin ella (cabecera de trama)', () => {
    expect(detectarTipoAudio(bytes('ID3', [4, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      'audio/mpeg',
    )
    expect(detectarTipoAudio(bytes([0xff, 0xfb, 0x90, 0x64]))).toBe(
      'audio/mpeg',
    )
  })

  it('reconoce M4A (caja ftyp) y WAV (RIFF…WAVE)', () => {
    expect(detectarTipoAudio(bytes([0, 0, 0, 0x20], 'ftypM4A '))).toBe(
      'audio/mp4',
    )
    expect(detectarTipoAudio(bytes('RIFF', [0x24, 0, 0, 0], 'WAVE'))).toBe(
      'audio/wav',
    )
  })

  it('no confunde otros formatos con audio', () => {
    expect(detectarTipoAudio(bytes('%PDF-1.7....'))).toBeNull()
    expect(
      detectarTipoAudio(
        bytes([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
      ),
    ).toBeNull()
    // RIFF que no es WAVE (WebP) y AAC «crudo» (capa 0).
    expect(detectarTipoAudio(bytes('RIFF', [0, 0, 0, 0], 'WEBP'))).toBeNull()
    expect(detectarTipoAudio(bytes([0xff, 0xf1, 0x50, 0x80]))).toBeNull()
    expect(detectarTipoAudio(bytes('<html>hola</html>'))).toBeNull()
  })
})

describe('comprobarArchivoAudio', () => {
  it('acepta un audio real aunque la extensión diga otra cosa', async () => {
    await expect(
      comprobarArchivoAudio(
        archivo(bytes('ID3', [4, 0, 0, 0, 0, 0, 0, 0, 0]), 'audio.txt'),
      ),
    ).resolves.toBe('audio/mpeg')
  })

  it('rechaza un archivo que no es audio aunque se llame .mp3', async () => {
    await expect(
      comprobarArchivoAudio(
        archivo(bytes('<script>alert(1)</script>'), 'audio.mp3', 'audio/mpeg'),
      ),
    ).rejects.toBeInstanceOf(ErrorAudio)
  })

  it('rechaza archivos de más de 100 MB y vacíos', async () => {
    const grande = new File(
      [
        bytes('ID3', [4, 0, 0, 0, 0, 0, 0, 0, 0]),
        new Uint8Array(MAX_TAMANO_AUDIO),
      ],
      'grande.mp3',
    )
    await expect(comprobarArchivoAudio(grande)).rejects.toThrow('100 MB')
    await expect(
      comprobarArchivoAudio(new File([], 'vacio.mp3')),
    ).rejects.toThrow('vacío')
  })
})

describe('tituloDesdeArchivo', () => {
  it('quita la extensión y los guiones', () => {
    expect(tituloDesdeArchivo('respiracion_para-dormir_v2.mp3')).toBe(
      'respiracion para dormir v2',
    )
  })
})
