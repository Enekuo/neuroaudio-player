import { describe, expect, it } from 'vitest'
import { perfilVacio } from './modelo'
import {
  combinarProfesionales,
  ordenarProfesionales,
  type ProfesionalDelOyente,
} from './ordenProfesionales'

const pro = (
  uid: string,
  nombre: string,
  creadoEn: string | null,
): ProfesionalDelOyente => ({
  uid,
  perfil: { ...perfilVacio(), nombre },
  creadoEn: creadoEn ? new Date(creadoEn) : null,
})

describe('ordenarProfesionales', () => {
  it('con fecha: del vínculo más reciente al más antiguo', () => {
    const r = ordenarProfesionales([
      pro('a', 'Ana', '2026-01-01'),
      pro('b', 'Bea', '2026-03-01'),
      pro('c', 'Carla', '2026-02-01'),
    ])
    expect(r.map((p) => p.uid)).toEqual(['b', 'c', 'a'])
  })

  it('sin fecha: detrás de los que la tienen, por nombre (sin importar tildes ni mayúsculas)', () => {
    const r = ordenarProfesionales([
      pro('z', 'Óscar', null),
      pro('x', 'ana', null),
      pro('y', 'Lucía', '2026-01-01'),
      pro('w', 'Marta', null),
    ])
    expect(r.map((p) => p.perfil.nombre)).toEqual([
      'Lucía',
      'ana',
      'Marta',
      'Óscar',
    ])
  })

  it('quita a quien no tiene nombre', () => {
    const r = ordenarProfesionales([
      pro('a', '   ', '2026-01-01'),
      pro('b', 'Bea', null),
    ])
    expect(r.map((p) => p.uid)).toEqual(['b'])
  })
})

describe('combinarProfesionales (modo «todos»)', () => {
  const general = (uid: string, nombre: string) => ({
    uid,
    perfil: { ...perfilVacio(), nombre },
  })

  it('primero los vinculados (con su orden) y después el resto por nombre', () => {
    const r = combinarProfesionales(
      [pro('v1', 'Zoe', '2026-01-01'), pro('v2', 'Bea', '2026-03-01')],
      [general('o1', 'Óscar'), general('o2', 'ana'), general('o3', 'Marta')],
    )
    expect(r.map((p) => p.perfil.nombre)).toEqual([
      'Bea',
      'Zoe',
      'ana',
      'Marta',
      'Óscar',
    ])
  })

  it('un vinculado que también está en la lista general sale una vez, con su versión en vivo', () => {
    const r = combinarProfesionales(
      [pro('v1', 'Lucía (nuevo nombre)', null)],
      [general('v1', 'Lucía'), general('o1', 'Ana'), general('o1', 'Ana')],
    )
    expect(r.map((p) => p.perfil.nombre)).toEqual([
      'Lucía (nuevo nombre)',
      'Ana',
    ])
  })

  it('el propio perfil sale como uno más (por nombre), sin repetirse; los perfiles sin nombre, no', () => {
    const r = combinarProfesionales(
      [],
      [
        general('yo', 'Yo Mismo'),
        general('o1', '   '),
        general('o2', 'Ana'),
        general('yo', 'Yo Mismo'),
      ],
    )
    expect(r.map((p) => p.uid)).toEqual(['o2', 'yo'])
  })
})
