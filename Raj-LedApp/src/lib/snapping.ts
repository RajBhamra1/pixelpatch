import { ModuleInstance, Project } from '@types/index'

export interface SnapResult { x: number; y: number; lines: { x?: number; y?: number } }

export function snapPosition(project: Project, moving: ModuleInstance, newX: number, newY: number, w: number, h: number, tol = 8): SnapResult {
  const grid = project.canvas.gridSize
  let snapX = newX, snapY = newY
  const lines: { x?: number; y?: number } = {}

  const gx = Math.round(newX / grid) * grid
  const gy = Math.round(newY / grid) * grid
  if (Math.abs(gx - newX) <= tol) { snapX = gx; lines.x = gx }
  if (Math.abs(gy - newY) <= tol) { snapY = gy; lines.y = gy }

  const edgesX: number[] = []
  const edgesY: number[] = []
  for (const m of project.modules) {
    if (m.id === moving.id) continue
    const mw = getTypeW(project, m), mh = getTypeH(project, m)
    edgesX.push(m.x, m.x + mw, m.x + mw/2)
    edgesY.push(m.y, m.y + mh, m.y + mh/2)
  }
  const thisEdgesX = [snapX, snapX + w, snapX + w/2]
  const thisEdgesY = [snapY, snapY + h, snapY + h/2]

  for (let i=0;i<thisEdgesX.length;i++) {
    const val = thisEdgesX[i]
    const nearest = nearestVal(val, edgesX)
    if (nearest !== null && Math.abs(nearest - val) <= tol) {
      const delta = nearest - val
      snapX += delta
      lines.x = nearest
    }
  }
  for (let i=0;i<thisEdgesY.length;i++) {
    const val = thisEdgesY[i]
    const nearest = nearestVal(val, edgesY)
    if (nearest !== null && Math.abs(nearest - val) <= tol) {
      const delta = nearest - val
      snapY += delta
      lines.y = nearest
    }
  }

  return { x: snapX, y: snapY, lines }
}

function nearestVal(v: number, arr: number[]): number | null {
  if (arr.length === 0) return null
  let best = arr[0], d = Math.abs(arr[0] - v)
  for (let i=1;i<arr.length;i++) {
    const nd = Math.abs(arr[i] - v)
    if (nd < d) { d = nd; best = arr[i] }
  }
  return best
}

function getTypeW(project: Project, m: ModuleInstance) {
  const t = project.moduleTypes.find(t => t.id === m.typeId)!
  return t.widthPx
}
function getTypeH(project: Project, m: ModuleInstance) {
  const t = project.moduleTypes.find(t => t.id === m.typeId)!
  return t.heightPx
}
