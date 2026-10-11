import { describe, expect, it } from 'vitest'
import {
  ErrorFoto,
  ajustarTamano,
  comprobarArchivoFoto,
  detectarTipoImagen,
} from './procesarFoto'

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]
const WEBP = [0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

const archivo = (bytes: number[], nombre: string, tipo = '') =>
  new File([new Uint8Array(bytes)], nombre, { type: tipo })

describe('detectarTipoImagen', () => {
  it('reconoce JPG, PNG y WebP por sus primeros bytes', () => {
    expect(detectarTipoImagen(new Uint8Array(JPEG))).toBe('image/jpeg')
    expect(detectarTipoImagen(new Uint8Array(PNG))).toBe('image/png')
    expect(detectarTipoImagen(new Uint8Array(WEBP))).toBe('image/webp')
  })

  it('no reconoce otros formatos', () => {
    // GIF, PDF y un RIFF que no es WebP (WAV).
    expect(
      detectarTipoImagen(new TextEncoder().encode('GIF89a......')),
    ).toBeNull()
    expect(
      detectarTipoImagen(new TextEncoder().encode('%PDF-1.7....')),
    ).toBeNull()
    expect(
      detectarTipoImagen(new TextEncoder().encode('RIFF....WAVE')),
    ).toBeNull()
  })
})

describe('comprobarArchivoFoto', () => {
  it('acepta una imagen real aunque la extensión diga otra cosa', async () => {
    await expect(comprobarArchivoFoto(archivo(PNG, 'foto.txt'))).resolves.toBe(
      'image/png',
    )
  })

  it('rechaza un archivo que no es imagen aunque se llame .jpg', async () => {
    const falso = archivo(
      [...new TextEncoder().encode('<script>alert(1)</script>')],
      'foto.jpg',
      'image/jpeg',
    )
    await expect(comprobarArchivoFoto(falso)).rejects.toBeInstanceOf(ErrorFoto)
  })

  it('rechaza fotos de más de 5 MB', async () => {
    const grande = new File(
      [new Uint8Array(JPEG), new Uint8Array(5 * 1024 * 1024)],
      'grande.jpg',
    )
    await expect(comprobarArchivoFoto(grande)).rejects.toThrow('5 MB')
  })
})

describe('ajustarTamano', () => {
  it('reduce el lado mayor al máximo manteniendo la proporción', () => {
    expect(ajustarTamano(4000, 3000, 1600)).toEqual({ ancho: 1600, alto: 1200 })
    expect(ajustarTamano(3000, 4000, 400)).toEqual({ ancho: 300, alto: 400 })
  })

  it('nunca agranda una foto pequeña', () => {
    expect(ajustarTamano(300, 200, 1600)).toEqual({ ancho: 300, alto: 200 })
  })
})
