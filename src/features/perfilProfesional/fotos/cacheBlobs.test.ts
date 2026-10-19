import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { crearCacheBlobs } from './cacheBlobs'

const MARGEN = 10_000

describe('crearCacheBlobs', () => {
  let revocadas: string[]

  beforeEach(() => {
    vi.useFakeTimers()
    revocadas = []
    let n = 0
    vi.spyOn(URL, 'createObjectURL').mockImplementation(
      () => `blob:prueba/${++n}`,
    )
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
      revocadas.push(url)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('la misma foto se descarga una sola vez aunque la usen varias pantallas', async () => {
    const cargar = vi.fn(async () => new Blob(['x']))
    const cache = crearCacheBlobs(cargar, MARGEN)
    const [a, b] = await Promise.all([
      cache.adquirir('f1'),
      cache.adquirir('f1'),
    ])
    expect(a).toBe(b)
    expect(cargar).toHaveBeenCalledTimes(1)
  })

  it('al salir de la pantalla, se libera tras el margen (no antes)', async () => {
    const cache = crearCacheBlobs(async () => new Blob(['x']), MARGEN)
    const url = await cache.adquirir('f1')
    cache.soltar('f1')
    await vi.advanceTimersByTimeAsync(MARGEN - 1)
    expect(revocadas).toEqual([])
    await vi.advanceTimersByTimeAsync(1)
    expect(revocadas).toEqual([url])
    expect(cache.tamano()).toBe(0)
  })

  it('si se vuelve a usar dentro del margen, no se libera ni se descarga otra vez', async () => {
    const cargar = vi.fn(async () => new Blob(['x']))
    const cache = crearCacheBlobs(cargar, MARGEN)
    await cache.adquirir('f1')
    cache.soltar('f1')
    await vi.advanceTimersByTimeAsync(5_000)
    await cache.adquirir('f1')
    await vi.advanceTimersByTimeAsync(MARGEN * 2)
    expect(revocadas).toEqual([])
    expect(cargar).toHaveBeenCalledTimes(1)
  })

  it('no se libera mientras otra pantalla la siga usando', async () => {
    const cache = crearCacheBlobs(async () => new Blob(['x']), MARGEN)
    await cache.adquirir('f1')
    await cache.adquirir('f1')
    cache.soltar('f1')
    await vi.advanceTimersByTimeAsync(MARGEN * 2)
    expect(revocadas).toEqual([])
    cache.soltar('f1')
    await vi.advanceTimersByTimeAsync(MARGEN)
    expect(revocadas).toHaveLength(1)
  })

  it('si la descarga falla (sin permiso), el siguiente intento vuelve a pedirla', async () => {
    const cargar = vi
      .fn<(ruta: string) => Promise<Blob>>()
      .mockRejectedValueOnce(new Error('sin permiso'))
      .mockResolvedValue(new Blob(['x']))
    const cache = crearCacheBlobs(cargar, MARGEN)
    await expect(cache.adquirir('f1')).rejects.toThrow('sin permiso')
    await expect(cache.adquirir('f1')).resolves.toMatch(/^blob:/)
    expect(cargar).toHaveBeenCalledTimes(2)
  })

  it('olvidar (foto borrada) la libera al momento', async () => {
    const cache = crearCacheBlobs(async () => new Blob(['x']), MARGEN)
    const url = await cache.adquirir('f1')
    cache.olvidar('f1')
    await vi.advanceTimersByTimeAsync(0)
    expect(revocadas).toEqual([url])
  })
})
