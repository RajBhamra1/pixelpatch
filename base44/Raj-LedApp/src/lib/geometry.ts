import { ModuleInstance } from '@types/index'

export function degToRad(deg: number) { return deg * Math.PI / 180; }

export function getModuleBounds(m: ModuleInstance, width: number, height: number) {
  const r = degToRad(m.rotation || 0)
  const cos = Math.cos(r), sin = Math.sin(r)
  const pts = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]
  const rot = pts.map(p => ({
    x: m.x + p.x * cos - p.y * sin,
    y: m.y + p.x * sin + p.y * cos
  }))
  const xs = rot.map(p => p.x)
  const ys = rot.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
