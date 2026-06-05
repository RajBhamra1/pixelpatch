import { describe, it, expect } from 'vitest'
import { snapPosition } from '../src/lib/snapping'

const project = {
  canvas: { gridSize: 20 },
  modules: [
    { id: 'a', typeId:'t', x: 100, y: 100, rotation: 0, z:0 },
    { id: 'b', typeId:'t', x: 300, y: 100, rotation: 0, z:1 },
  ],
  moduleTypes: [{ id:'t', name:'T', widthPx: 100, heightPx: 100 }]
} as any

describe('snapping', () => {
  it('snaps to grid', () => {
    const moving = { id:'m', typeId:'t', x:0, y:0, rotation:0, z:2 }
    const r = snapPosition(project, moving as any, 103, 39, 100, 100, 8)
    expect(r.x % 20).toBe(0)
    expect(r.y % 20).toBe(0)
  })
  it('snaps to other module edges', () => {
    const moving = { id:'m', typeId:'t', x:0, y:0, rotation:0, z:2 }
    const r = snapPosition(project, moving as any, 199, 100, 100, 100, 8)
    expect(r.x).toBe(200)
  })
})
