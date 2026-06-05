import { describe, it, expect } from 'vitest'
import { getModuleBounds } from '../src/lib/geometry'

describe('geometry', () => {
  it('computes bounds without rotation', () => {
    const m = { id:'m1', typeId:'t', x: 100, y: 50, rotation: 0, z: 0 }
    const b = getModuleBounds(m as any, 500, 500)
    expect(b.x).toBe(100)
    expect(b.y).toBe(50)
    expect(b.width).toBe(500)
    expect(b.height).toBe(500)
  })
  it('computes bounds with 90° rotation', () => {
    const m = { id:'m1', typeId:'t', x: 100, y: 50, rotation: 90, z: 0 }
    const b = getModuleBounds(m as any, 500, 300)
    expect(Math.round(b.width)).toBe(300)
    expect(Math.round(b.height)).toBe(500)
  })
})
