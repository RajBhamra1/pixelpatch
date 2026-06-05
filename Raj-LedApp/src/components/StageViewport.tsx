import React, { useState, useRef, useEffect } from "react"
import { Stage, Layer, Rect, Text, Image, Line } from "react-konva"
import type { Stage as StageType } from "konva/lib/Stage"
import { KonvaEventObject } from "konva/lib/Node"
import useImage from "use-image"
import { useProject } from "@store/projectStore"

type ID = string
type Pt = { x: number; y: number }

const BORDER_COLOR = "#888"
const BORDER_WIDTH = 4

/* ----------------------- text helpers ----------------------- */
const EST_CHAR_W = 0.6
const hexToRGBA = (hex: string, a = 1) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${a})`
}
const wrapWordsToWidth = (text: string, maxCharsPerLine: number) => {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    if (!cur) { cur = w; continue }
    if (cur.length + 1 + w.length <= maxCharsPerLine) cur += " " + w
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  return lines
}
function fitTextToBox(
  text: string,
  maxW: number,
  maxH: number,
  opts?: { minFont?: number; maxFont?: number; lineHeight?: number }
) {
  const minFont = opts?.minFont ?? 8
  const maxFont = opts?.maxFont ?? Math.max(12, Math.floor(maxH))
  const lineHeight = opts?.lineHeight ?? 1.12
  for (let fs = maxFont; fs >= minFont; fs--) {
    const maxChars = Math.max(1, Math.floor(maxW / (fs * EST_CHAR_W)))
    const lines = text.split("\n").flatMap((p) => wrapWordsToWidth(p.trim(), maxChars))
    const height = lines.length * (fs * lineHeight)
    if (height <= maxH) {
      const width = Math.min(maxW, Math.max(...lines.map(l => l.length * fs * EST_CHAR_W), 0))
      return { lines, fontSize: fs, boxW: width, boxH: height }
    }
  }
  const fs = minFont
  const maxChars = Math.max(1, Math.floor(maxW / (fs * EST_CHAR_W)))
  const lines = text.split("\n").flatMap((p) => wrapWordsToWidth(p.trim(), maxChars))
  const height = lines.length * (fs * lineHeight)
  const width = Math.min(maxW, Math.max(...lines.map(l => l.length * fs * EST_CHAR_W), 0))
  return { lines, fontSize: fs, boxW: width, boxH: height }
}

/* ----------------------- snap helpers ----------------------- */
const snapToStep = (v: number, step: number) => Math.round(v / Math.max(step, 1)) * Math.max(step, 1)
const snapPtToStep = (pt: Pt, stepX: number, stepY: number): Pt => ({ x: snapToStep(pt.x, stepX), y: snapToStep(pt.y, stepY) })
const snapVal = (v: number, g: number) => Math.round(v / Math.max(g, 1)) * Math.max(g, 1)
const randomHex = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")

/* --------- gradient helpers for 4-corner custom fill --------- */
const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpColor = (c1: any, c2: any, t: number) => ({
  r: Math.round(lerp(c1.r, c2.r, t)),
  g: Math.round(lerp(c1.g, c2.g, t)),
  b: Math.round(lerp(c1.b, c2.b, t)),
})
function drawFourCornerGradient(ctx: CanvasRenderingContext2D, w: number, h: number, colors: [string, string, string, string]) {
  const [tl, tr, br, bl] = colors.map(hexToRgb)
  const sw = 64, sh = 64
  const off = document.createElement("canvas")
  off.width = sw; off.height = sh
  const octx = off.getContext("2d")!
  const img = octx.createImageData(sw, sh)
  for (let y = 0; y < sh; y++) {
    const v = y / (sh - 1)
    const left = lerpColor(tl, bl, v)
    const right = lerpColor(tr, br, v)
    for (let x = 0; x < sw; x++) {
      const u = x / (sw - 1)
      const c = lerpColor(left, right, u)
      const idx = (y * sw + x) * 4
      img.data[idx] = c.r
      img.data[idx + 1] = c.g
      img.data[idx + 2] = c.b
      img.data[idx + 3] = 255
    }
  }
  octx.putImageData(img, 0, 0)
  ctx.drawImage(off, 0, 0, w, h)
}

/* ---------- normalize gradient.mode (may be number or string) ---------- */
const modeOf = (m: any): "1" | "2" | "4" => {
  const s = typeof m === "number" ? String(m) : m
  return s === "2" || s === "4" ? s : "1"
}

/* ---------------- Magnetic snap (groups + per-module + corner) ---------------- */
type RectLike = { x: number; y: number; w: number; h: number }
type Guide = { type: "v" | "h"; x1: number; y1: number; x2: number; y2: number }

/** overlap OR within tolerance on the perpendicular axis */
const nearOverlap = (a1: number, a2: number, b1: number, b2: number, tol: number) => {
  if (![a1, a2, b1, b2, tol].every(Number.isFinite)) return false
  const A1 = Math.min(a1, a2), A2 = Math.max(a1, a2)
  const B1 = Math.min(b1, b2), B2 = Math.max(b1, b2)
  if (Math.max(A1, B1) <= Math.min(A2, B2)) return true
  const gap = Math.max(B1 - A2, A1 - B2)
  return gap <= tol
}

function calcBBoxForIds(project: any, ids: ID[]) {
  const rects: RectLike[] = []
  for (const id of ids || []) {
    const m = project.modules.find((mm: any) => mm.id === id)
    if (!m) continue
    const t = project.moduleTypes.find((tt: any) => tt.id === m.typeId)
    if (!t) continue
    rects.push({ x: +m.x || 0, y: +m.y || 0, w: +t.widthPx || 0, h: +t.heightPx || 0 })
  }
  if (!rects.length) return null
  const minX = Math.min(...rects.map((r) => r.x))
  const minY = Math.min(...rects.map((r) => r.y))
  const maxX = Math.max(...rects.map((r) => r.x + r.w))
  const maxY = Math.max(...rects.map((r) => r.y + r.h))
  return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) }
}

/** Build neighbors: include ALL group bboxes AND EVERY module (except selection) for per-module snap */
function buildNeighbors(project: any, excludeIds: Set<ID>): RectLike[] {
  const rects: RectLike[] = []
  const groups = Array.isArray(project.groups) ? project.groups : []
  const modules = Array.isArray(project.modules) ? project.modules : []
  const moduleTypes = Array.isArray(project.moduleTypes) ? project.moduleTypes : []

  // group bboxes
  for (const g of groups) {
    const mids: ID[] = Array.isArray(g.memberIds) ? g.memberIds : []
    if (mids.length && mids.every(id => excludeIds.has(id))) continue
    const bb = calcBBoxForIds(project, mids)
    if (bb && (bb.w > 0 || bb.h > 0)) rects.push(bb)
  }

  // all modules (excluding current selection)
  for (const m of modules) {
    if (excludeIds.has(m.id)) continue
    const t = moduleTypes.find((tt: any) => tt.id === m.typeId)
    if (!t) continue
    rects.push({ x: +m.x || 0, y: +m.y || 0, w: +t.widthPx || 0, h: +t.heightPx || 0 })
  }

  return rects
}

function magneticAdjust(
  baselineBBox: RectLike,
  initialDx: number,
  initialDy: number,
  neighbors: RectLike[] | undefined,
  axisThreshold = 24,
  perpTolerance = 44,
  cornerThreshold = 16
): { dx: number; dy: number; guides: Guide[] } {
  const guides: Guide[] = []
  const N = Array.isArray(neighbors) ? neighbors : []
  if (!baselineBBox || !Number.isFinite(baselineBBox.x) || !Number.isFinite(baselineBBox.y)) {
    return { dx: initialDx || 0, dy: initialDy || 0, guides }
  }

  const bw = Math.max(0, +baselineBBox.w || 0)
  const bh = Math.max(0, +baselineBBox.h || 0)
  const bx = +baselineBBox.x || 0
  const by = +baselineBBox.y || 0

  const iDx = Number.isFinite(initialDx) ? initialDx : 0
  const iDy = Number.isFinite(initialDy) ? initialDy : 0

  const cand0 = { x: bx + iDx, y: by + iDy, w: bw, h: bh }

  let bestDx = cand0.x - bx
  let bestDy = cand0.y - by
  let bestXErr = axisThreshold + 1
  let bestYErr = axisThreshold + 1
  let bestXGuide: Guide | null = null
  let bestYGuide: Guide | null = null

  // Horizontal (X) snap: align/butt to neighbor when vertically near/overlapping
  for (const n of N) {
    const nx1 = +n.x || 0, ny1 = +n.y || 0
    const nw = Math.max(0, +n.w || 0), nh = Math.max(0, +n.h || 0)
    const nx2 = nx1 + nw, ny2 = ny1 + nh
    if (!nearOverlap(cand0.y, cand0.y + cand0.h, ny1, ny2, perpTolerance)) continue

    const targetsX = [nx1, nx2, nx1 - cand0.w, nx2 - cand0.w]
    for (const tx of targetsX) {
      if (!Number.isFinite(tx)) continue
      const desiredDx = tx - bx
      const err = Math.abs(desiredDx - iDx)
      if (err < bestXErr && err <= axisThreshold) {
        bestXErr = err
        bestDx = desiredDx
        const oy1 = Math.max(cand0.y, ny1)
        const oy2 = Math.min(cand0.y + cand0.h, ny2)
        const y1 = Math.min(oy1, oy2), y2 = Math.max(oy1, oy2)
        bestXGuide = { type: "v", x1: tx, y1, x2: tx, y2 }
      }
    }
  }

  // Apply X pick to candidate before computing Y
  const xCandidates = [bx + iDx, bx + bestDx]

  // Vertical (Y) snap: align/butt to neighbor when horizontally near/overlapping
  for (const n of N) {
    const nx1 = +n.x || 0, ny1 = +n.y || 0
    const nw = Math.max(0, +n.w || 0), nh = Math.max(0, +n.h || 0)
    const nx2 = nx1 + nw, ny2 = ny1 + nh

    for (const xCand of xCandidates) {
      const ourX1 = xCand
      const ourX2 = xCand + cand0.w
      if (!nearOverlap(ourX1, ourX2, nx1, nx2, perpTolerance)) continue

      const targetsY = [ny1, ny2, ny1 - cand0.h, ny2 - cand0.h]
      for (const ty of targetsY) {
        if (!Number.isFinite(ty)) continue
        const desiredDy = ty - by
        const err = Math.abs(desiredDy - iDy)
        if (err < bestYErr && err <= axisThreshold) {
          bestYErr = err
          bestDy = desiredDy
          const ox1 = Math.max(ourX1, nx1)
          const ox2 = Math.min(ourX2, nx2)
          const x1 = Math.min(ox1, ox2), x2 = Math.max(ox1, ox2)
          bestYGuide = { type: "h", x1, y1: ty, x2, y2: ty }
        }
      }
    }
  }

  // Corner snap if neither axis selected
  if (bestXErr > axisThreshold && bestYErr > axisThreshold) {
    let bestCornerErr = cornerThreshold + 1
    let bestCornerDx = bestDx
    let bestCornerDy = bestDy
    let bestCornerGuide: Guide | null = null

    for (const n of N) {
      const nx1 = +n.x || 0, ny1 = +n.y || 0
      const nw = Math.max(0, +n.w || 0), nh = Math.max(0, +n.h || 0)
      const nx2 = nx1 + nw, ny2 = ny1 + nh

      const combos: Array<{ tx: number; ty: number; guide?: Guide }> = [
        { tx: nx2,            ty: ny1,            guide: { type: "v", x1: nx2, y1: ny1, x2: nx2, y2: ny2 } },
        { tx: nx1 - cand0.w,  ty: ny1,            guide: { type: "v", x1: nx1, y1: ny1, x2: nx1, y2: ny2 } },
        { tx: nx2,            ty: ny2 - cand0.h,  guide: { type: "v", x1: nx2, y1: ny1, x2: nx2, y2: ny2 } },
        { tx: nx1 - cand0.w,  ty: ny2 - cand0.h,  guide: { type: "v", x1: nx1, y1: ny1, x2: nx1, y2: ny2 } },
        { tx: nx1,            ty: ny2,            guide: { type: "h", x1: nx1, y1: ny2, x2: nx2, y2: ny2 } },
        { tx: nx1,            ty: ny1 - cand0.h,  guide: { type: "h", x1: nx1, y1: ny1, x2: nx2, y2: ny1 } },
        { tx: nx2 - cand0.w,  ty: ny2,            guide: { type: "h", x1: nx1, y1: ny2, x2: nx2, y2: ny2 } },
        { tx: nx2 - cand0.w,  ty: ny1 - cand0.h,  guide: { type: "h", x1: nx1, y1: ny1, x2: nx2, y2: ny1 } },
      ]

      for (const c of combos) {
        const desiredDx = c.tx - bx
        const desiredDy = c.ty - by
        const err = Math.hypot(desiredDx - iDx, desiredDy - iDy)
        if (err < bestCornerErr && err <= cornerThreshold) {
          bestCornerErr = err
          bestCornerDx = desiredDx
          bestCornerDy = desiredDy
          bestCornerGuide = c.guide || null
        }
      }
    }

    if (bestCornerErr <= cornerThreshold) {
      bestDx = bestCornerDx
      bestDy = bestCornerDy
      if (bestCornerGuide) guides.push(bestCornerGuide)
    }
  }

  if (bestXGuide) guides.push(bestXGuide)
  if (bestYGuide) guides.push(bestYGuide)
  return { dx: bestDx, dy: bestDy, guides }
}

/* -------------------- copy/paste helpers -------------------- */

function nextGroupName(base: string, existing: string[]): string {
  const m = base.match(/^(.*?)(\d+)\s*$/)
  if (m) {
    const head = m[1].trim()
    const n = parseInt(m[2], 10) + 1
    return `${head} ${n}`
  }
  const nums = existing
    .map((s) => (s.match(/(\d+)\s*$/)?.[1]))
    .filter(Boolean)
    .map((n) => parseInt(n!, 10))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  if (/^group\b/i.test(base)) return `Group ${next}`
  return `${base} ${next}`
}

type ClipItem = { typeId: ID; dx: number; dy: number; rotation: number; label?: string; fill?: string }
type ClipGroup = {
  name: string
  color: string
  borderWidth?: number
  borderStyle?: "solid" | "dashed" | "dotted"
  fontSize?: number
  labelBg?: string
  labelTextColor?: string
  gradient?: any
  memberIndices: number[]
}
type Clipboard = { items: ClipItem[]; groups: ClipGroup[]; size: { w: number; h: number } }

/* ------------------------------------------------------------------------- */

export default function StageViewport({
  setStageRef,
  onMousePos,
  showToolbar = false,
}: {
  setStageRef: (s: StageType) => void
  onMousePos: (pos: { x: number; y: number }) => void
  showToolbar?: boolean
}) {
  const {
    project,
    addModule,
    selection,
    setSelection,
    activeType,
    setActiveType,
    removeModules,
    setModulesXY,
    createGroupFromSelection,
    ungroupGroup,
    moveModulesBy,
    setProjectCanvasZoom,
    setProjectCanvasShowGrid,
    toggleSnapEnabled,
    updateGroup,
    updateCanvas,

    // history
    pushHistory,
    undo,
    redo,
  } = useProject() as any

  const containerRef = useRef<HTMLDivElement>(null)
  const stageNodeRef = useRef<StageType | null>(null)
  const [stageSize, setStageSize] = useState({ w: 100, h: 100 })
  const [baseScale, setBaseScale] = useState(1)

  // grid pulsation
  const [animOn, setAnimOn] = useState<boolean>(false)
  const [pulsePhase, setPulsePhase] = useState<number>(0)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    if (!animOn) { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; return }
    let last = performance.now()
    const loop = (t: number) => { const dt = (t - last) / 1000; last = t; setPulsePhase((p) => p + 2.4 * dt); rafRef.current = requestAnimationFrame(loop) }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [animOn])

  // Fit canvas to viewport
  useEffect(() => {
    const updateSize = () => {
      const el = containerRef.current
      if (!el) return
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (!cw || !ch) return
      const base = Math.min(cw / project.canvas.widthPx, ch / project.canvas.heightPx)
      setStageSize({ w: cw, h: ch })
      setBaseScale(base)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [project.canvas.widthPx, project.canvas.heightPx])

 const zoom = project.canvas.zoom ?? 1
const scale = baseScale * zoom

const offset = {
  x: (stageSize.w - project.canvas.widthPx * scale) / 2,
  y: (stageSize.h - project.canvas.heightPx * scale) / 2,
}


  // selection / movement
  const [dragStart, setDragStart] = useState<Pt | null>(null)
  const [previewRects, setPreviewRects] = useState<{ x: number; y: number; w: number; h: number }[]>([])
  const [marqueeStart, setMarqueeStart] = useState<Pt | null>(null)
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [moveStart, setMoveStart] = useState<Pt | null>(null)
  const [baseline, setBaseline] = useState<Record<ID, Pt>>({})
  const [baselineBBox, setBaselineBBox] = useState<RectLike | null>(null)

  // Magnetic & guides
  const [magnetOn, setMagnetOn] = useState<boolean>(true)
  const [snapGuides, setSnapGuides] = useState<Guide[]>([])

  // Copy systems
  const copyModeRef = useRef(false)   // alt/option drag
  const copyDeltaRef = useRef({ dx: 0, dy: 0 })
  const [ghostCopies, setGhostCopies] = useState<{ x: number; y: number; w: number; h: number }[]>([])
  const clipboardRef = useRef<Clipboard | null>(null)
  const pushedForThisDragRef = useRef(false)

  // last mouse position for paste
  const lastMouseLocalRef = useRef<Pt>({ x: 0, y: 0 })

  // Global label visibility (stored on canvas; default true)
  const showGroupLabels = ((project.canvas as any).showGroupLabels ?? true) as boolean

  // Right-click context menu state
  const [ctxMenu, setCtxMenu] = useState<{ visible: boolean; x: number; y: number; groupId?: ID }>({ visible: false, x: 0, y: 0 })

  // Close context menu on outside click or Esc (NOT on right-click)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const menuEl = document.getElementById("ctx-menu")
      if (menuEl && menuEl.contains(e.target as Node)) return
      setCtxMenu((m) => ({ ...m, visible: false }))
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu((m) => ({ ...m, visible: false }))
    }
    window.addEventListener("click", onDocClick)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("click", onDocClick)
      window.removeEventListener("keydown", onEsc)
    }
  }, [])

  const toLocal = (p: Pt) => ({ x: (p.x - offset.x) / scale, y: (p.y - offset.y) / scale })
  const rectsIntersect = (a: any, b: any) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

  // moduleId -> groupId map
  const moduleToGroup: Record<ID, ID> = {}
  project.groups.forEach((g: any) => g.memberIds.forEach((mid: ID) => (moduleToGroup[mid] = g.id)))

  // helpers
  const currentSelBBox = selection.ids.length ? calcBBoxForIds(project, selection.ids) : null
  const groupBBox = (memberIds: ID[]) => calcBBoxForIds(project, memberIds)

  const groupFullySelected = (gid: ID) => {
    const g = project.groups.find((gg: any) => gg.id === gid)
    if (!g || !g.memberIds?.length) return false
    if (selection.ids.length !== g.memberIds.length) return false
    return g.memberIds.every((id: ID) => selection.ids.includes(id))
  }

  const selectedGroupId = (): ID | null => {
    for (const g of project.groups) {
      if (g.memberIds?.length && selection.ids.length === g.memberIds.length && g.memberIds.every((id: ID) => selection.ids.includes(id))) {
        return g.id
      }
    }
    return null
  }

  /* ---------------------- copy/paste functions ---------------------- */

  function computeClipboardFromSelection(): Clipboard | null {
    if (!selection.ids.length) return null
    const bbox = calcBBoxForIds(project, selection.ids)
    if (!bbox) return null

    // items
    const items: ClipItem[] = []
    const idToIndex = new Map<ID, number>()
    selection.ids.forEach((id) => {
      const m = project.modules.find((mm: any) => mm.id === id)
      if (!m) return
      items.push({
        typeId: m.typeId,
        dx: m.x - bbox.x,
        dy: m.y - bbox.y,
        rotation: m.rotation,
        label: m.label,
        fill: m.fill,
      })
      idToIndex.set(id, items.length - 1)
    })

    // full groups contained in selection
    const groups: ClipGroup[] = []
    project.groups.forEach((g: any) => {
      if (!g.memberIds.length) return
      const allIn = g.memberIds.every((id: ID) => selection.ids.includes(id))
      if (!allIn) return
      const memberIndices = g.memberIds.map((id: ID) => idToIndex.get(id)).filter((i) => i != null) as number[]
      if (memberIndices.length) {
        groups.push({
          name: g.name,
          color: g.color,
          borderWidth: g.borderWidth,
          borderStyle: g.borderStyle,
          fontSize: g.fontSize,
          labelBg: g.labelBg,
          labelTextColor: g.labelTextColor,
          gradient: g.gradient,
          memberIndices,
        })
      }
    })

    return { items, groups, size: { w: bbox.w, h: bbox.h } }
  }

  function pasteClipboard(at?: Pt) {
    const clip = clipboardRef.current
    if (!clip || clip.items.length === 0) return

    // anchor
    let ax = at?.x ?? (currentSelBBox ? currentSelBBox.x + 20 : 0)
    let ay = at?.y ?? (currentSelBBox ? currentSelBBox.y + 20 : 0)
    if (project.canvas.snapEnabled) {
      ax = snapVal(ax, project.canvas.gridSize)
      ay = snapVal(ay, project.canvas.gridSize)
    }

    pushHistory?.("paste")

    // queue targets and add
    const targets: Array<{ key: string; typeId: ID; x: number; y: number; rotation: number; label?: string; fill?: string }> = []
    clip.items.forEach((it) => {
      const x = Math.round(ax + it.dx)
      const y = Math.round(ay + it.dy)
      const key = `${it.typeId}@${x},${y}`
      targets.push({ key, typeId: it.typeId, x, y, rotation: it.rotation, label: it.label, fill: it.fill })
    })

    for (const t of targets) {
      addModule(t.typeId, t.x, t.y, t.rotation, t.fill, t.label)
    }

    // resolve new IDs by scanning from end
    const after = (useProject as any).getState().project
    const mods = after.modules
    const wanted = new Map<string, number>() // key -> count
    targets.forEach((t) => wanted.set(t.key, (wanted.get(t.key) || 0) + 1))

    const found: ID[] = []
    for (let i = mods.length - 1; i >= 0; i--) {
      const m = mods[i]
      const key = `${m.typeId}@${m.x},${m.y}`
      const left = wanted.get(key) || 0
      if (left > 0) {
        found.push(m.id)
        wanted.set(key, left - 1)
        if ([...wanted.values()].every((v) => v === 0)) break
      }
    }
    const newIds = found.reverse()

    // Create groups (mirror original groups)
    const existingNames = after.groups.map((gg: any) => gg.name)
    clip.groups.forEach((cg) => {
      // map member indices -> new module ids
      const memberIds: ID[] = cg.memberIndices.map((idx) => newIds[idx]).filter(Boolean)
      if (!memberIds.length) return
      const proposed = nextGroupName(cg.name || "Group", existingNames)
      existingNames.push(proposed)

      // create group from these members
      setSelection(memberIds)
      createGroupFromSelection(proposed, cg.color)

      // update style details to match source group
      const p2 = (useProject as any).getState().project
      const lastGroup = p2.groups[p2.groups.length - 1]
      if (lastGroup) {
        updateGroup(lastGroup.id, {
          borderWidth: cg.borderWidth,
          borderStyle: cg.borderStyle,
          fontSize: cg.fontSize,
          labelBg: cg.labelBg,
          labelTextColor: cg.labelTextColor,
          gradient: cg.gradient,
        })
      }
    })

    // re-select all pasted modules
    setSelection(newIds)
  }

  /* ----------------------- right-click helpers ----------------------- */
  const openGroupMenu = (evt: KonvaEventObject<PointerEvent>, groupId: ID) => {
    evt.evt.preventDefault()
    ;(evt as any).cancelBubble = true

    // Gate: only open if this group is fully selected; otherwise select it and exit.
    if (!groupFullySelected(groupId)) {
      const g = project.groups.find((gg: any) => gg.id === groupId)
      if (g?.memberIds?.length) setSelection([...g.memberIds])
      return
    }

    const rect = containerRef.current?.getBoundingClientRect()
    const x = evt.evt.clientX - (rect?.left ?? 0)
    const y = evt.evt.clientY - (rect?.top ?? 0)
    setCtxMenu({ visible: true, x, y, groupId })
  }

  const ctxSelectGroup = () => {
    if (!ctxMenu.groupId) return
    const g = project.groups.find((gg: any) => gg.id === ctxMenu.groupId)
    if (!g) return
    setSelection([...g.memberIds])
    setCtxMenu((m) => ({ ...m, visible: false }))
  }

  const ctxRenameGroup = () => {
    if (!ctxMenu.groupId) return
    const g = project.groups.find((gg: any) => gg.id === ctxMenu.groupId)
    if (!g) return
    const name = window.prompt("Rename group:", g.name ?? "Group")
    if (name && name.trim()) updateGroup(g.id, { name: name.trim() })
    setCtxMenu((m) => ({ ...m, visible: false }))
  }

  const ctxToggleLabel = () => {
    if (!ctxMenu.groupId) return
    const g = project.groups.find((gg: any) => gg.id === ctxMenu.groupId)
    if (!g) return
    const hidden = (g as any).labelHidden === true
    updateGroup(g.id, { labelHidden: !hidden } as any)
    setCtxMenu((m) => ({ ...m, visible: false }))
  }

  const ctxUngroup = () => {
    if (!ctxMenu.groupId) return
    ungroupGroup(ctxMenu.groupId)
    setCtxMenu((m) => ({ ...m, visible: false }))
  }

  const ctxDuplicate = () => {
    if (!ctxMenu.groupId) return
    const g = project.groups.find((gg: any) => gg.id === ctxMenu.groupId)
    if (!g) return
    const bb = groupBBox(g.memberIds)
    setSelection([...g.memberIds])
    clipboardRef.current = computeClipboardFromSelection()
    if (bb) pasteClipboard({ x: bb.x + 20, y: bb.y + 20 })
    setCtxMenu((m) => ({ ...m, visible: false }))
  }

  /* ----------------------- mouse handlers ----------------------- */
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    const local = toLocal(pos)
    onMousePos(local)
    lastMouseLocalRef.current = local

    // ghost preview (placement)
    if (activeType && dragStart) {
      const t = project.moduleTypes.find((tt: any) => tt.id === activeType)
      if (!t) return
      const dx = local.x - dragStart.x
      const dy = local.y - dragStart.y
      const stepX = t.widthPx
      const stepY = t.heightPx
      const cols = Math.max(1, Math.floor(Math.abs(dx) / stepX) + 1)
      const rows = Math.max(1, Math.floor(Math.abs(dy) / stepY) + 1)
      const rects = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = dragStart.x + c * stepX * Math.sign(dx || 1)
          let y = dragStart.y + r * stepY * Math.sign(dy || 1)
          if (project.canvas.snapEnabled) {
            x = snapVal(x, stepX)
            y = snapVal(y, stepY)
          }
          rects.push({ x, y, w: stepX, h: stepY })
        }
      }
      setPreviewRects(rects)
    }

    // marquee
    if (marqueeStart && !activeType && !moveStart) {
      const x = Math.min(marqueeStart.x, local.x)
      const y = Math.min(marqueeStart.y, local.y)
      const w = Math.abs(local.x - marqueeStart.x)
      const h = Math.abs(local.y - marqueeStart.y)
      setMarqueeRect({ x, y, w, h })
    }

    // dragging selection/group
    if (moveStart && baselineBBox) {
      const dxRaw = local.x - moveStart.x
      const dyRaw = local.y - moveStart.y

      // 1) MAGNET FIRST
      let ddx = dxRaw
      let ddy = dyRaw
      let guides: Guide[] = []
      if (magnetOn) {
        const exclude = new Set<ID>(Object.keys(baseline))
        const neighbors = buildNeighbors(project, exclude) // groups + ALL modules
        const res = magneticAdjust(baselineBBox, ddx, ddy, neighbors, 24, 44, 16)
        ddx = res.dx
        ddy = res.dy
        guides = res.guides
      }

      // 2) GRID SECOND (fallback only if no magnet guide)
      if (guides.length === 0 && project.canvas.snapEnabled) {
        const snappedX = snapVal(baselineBBox.x + ddx, project.canvas.gridSize)
        const snappedY = snapVal(baselineBBox.y + ddy, project.canvas.gridSize)
        ddx = snappedX - baselineBBox.x
        ddy = snappedY - baselineBBox.y
      }

      setSnapGuides(guides)

      // copy mode → ghost preview; normal mode → actually move
      if (copyModeRef.current) {
        copyDeltaRef.current = { dx: ddx, dy: ddy }
        const ghosts: { x: number; y: number; w: number; h: number }[] = []
        for (const id of selection.ids) {
          const m = project.modules.find((mm: any) => mm.id === id)
          if (!m) continue
          const t = project.moduleTypes.find((tt: any) => tt.id === m.typeId)
          if (!t) continue
          ghosts.push({ x: (baseline[id]?.x ?? m.x) + ddx, y: (baseline[id]?.y ?? m.y) + ddy, w: t.widthPx, h: t.heightPx })
        }
        setGhostCopies(ghosts)
      } else {
        const updates: Record<ID, { x: number; y: number }> = {}
        Object.keys(baseline).forEach((id) => {
          updates[id] = { x: baseline[id].x + ddx, y: baseline[id].y + ddy }
        })
        setModulesXY(updates)
      }
    }
  }

  const startDragForIds = (ids: ID[], local: Pt, altDown: boolean) => {
    setSelection(ids)
    const base: Record<ID, Pt> = {}
    ids.forEach((id) => {
      const m = project.modules.find((mm: any) => mm.id === id)
      if (m) base[id] = { x: m.x, y: m.y }
    })
    setBaseline(base)
    setMoveStart(local)
    setBaselineBBox(calcBBoxForIds(project, ids))

    copyModeRef.current = !!altDown
    setGhostCopies([])

    if (!pushedForThisDragRef.current) {
      pushHistory?.(altDown ? "duplicate" : "move start")
      pushedForThisDragRef.current = true
    }
  }

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (ctxMenu.visible) setCtxMenu((m) => ({ ...m, visible: false }))

    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    const localRaw = toLocal(pos)
    const altDown = (e.evt as KeyboardEvent).altKey === true

    // placing start
    if (activeType) {
      const t = project.moduleTypes.find((tt: any) => tt.id === activeType)
      if (!t) return
      pushHistory?.("place start")
      const stepX = t.widthPx
      const stepY = t.heightPx
      const local = project.canvas.snapEnabled ? snapPtToStep(localRaw, stepX, stepY) : localRaw
      setDragStart(local)
      return
    }

    const local = localRaw // do NOT pre-snap to grid here; magnet gets first say

    const targetName = e.target?.getAttr("name")
    const targetId = e.target?.getAttr("dataId") as string | undefined

    // group
    if (targetName === "group-hit" && targetId) {
      const group = project.groups.find((g: any) => g.id === targetId)
      const nextSel = group ? [...group.memberIds] : []
      if (nextSel.length) {
        startDragForIds(nextSel, local, altDown)
        return
      }
    }

    // selection bbox drag
    if (targetName === "selection-hit" && selection.ids.length) {
      startDragForIds([...selection.ids], local, altDown)
      return
    }

    // single module
    if (targetName === "module-rect" && targetId) {
      const nextSel = selection.ids.includes(targetId) ? selection.ids : [targetId]
      startDragForIds(nextSel, local, altDown)
      return
    }

    // new marquee
    setSelection([])
    setMarqueeStart(local)
    setMarqueeRect({ x: local.x, y: local.y, w: 0, h: 0 })
    setBaselineBBox(null)
  }

  const handleMouseUp = (_e: KonvaEventObject<MouseEvent>) => {
    // placing commit
    if (activeType && dragStart) {
      const stage = stageNodeRef.current
      const pos = stage?.getPointerPosition()
      const local = pos ? toLocal(pos) : dragStart
      const t = project.moduleTypes.find((tt: any) => tt.id === activeType)
      if (t) {
        const dx = local.x - dragStart.x
        const dy = local.y - dragStart.y
        const stepX = t.widthPx
        const stepY = t.heightPx
        const cols = Math.max(1, Math.floor(Math.abs(dx) / stepX) + 1)
        const rows = Math.max(1, Math.floor(Math.abs(dy) / stepY) + 1)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let x = dragStart.x + c * stepX * Math.sign(dx || 1)
            let y = dragStart.y + r * stepY * Math.sign(dy || 1)
            if (project.canvas.snapEnabled) {
              x = snapVal(x, stepX)
              y = snapVal(y, stepY)
            }
            const fill = randomHex()
            addModule(t.id, Math.round(x), Math.round(y), 0, fill)
          }
        }
      }
      setDragStart(null)
      setPreviewRects([])
      setActiveType(null)
      return
    }

    // marquee commit → select full groups where intersected
    if (marqueeRect) {
      const hitsSet = new Set<ID>()
      project.modules.forEach((m: any) => {
        const t = project.moduleTypes.find((tt: any) => tt.id === m.typeId)
        if (!t) return
        const r = { x: m.x, y: m.y, w: t.widthPx, h: t.heightPx }
        if (rectsIntersect(marqueeRect, r)) {
          const gId = moduleToGroup[m.id]
          if (gId) {
            const g = project.groups.find((gg: any) => gg.id === gId)
            g?.memberIds.forEach((mid: ID) => hitsSet.add(mid))
          } else {
            hitsSet.add(m.id)
          }
        }
      })
      const ids = Array.from(hitsSet)
      setSelection(ids)
      setMarqueeStart(null)
      setMarqueeRect(null)

      if (ids.length) {
        const base: Record<ID, Pt> = {}
        ids.forEach((id) => {
          const m = project.modules.find((mm: any) => mm.id === id)
          if (m) base[id] = { x: m.x, y: m.y }
        })
        setBaseline(base)
        setBaselineBBox(calcBBoxForIds(project, ids))
      }
      return
    }

    // drag end
    if (moveStart) {
      if (copyModeRef.current && baseline && selection.ids.length) {
        // Build a clipboard from the selection so we can retain groups on duplicate
        clipboardRef.current = computeClipboardFromSelection()
        // Paste at offset position = baseline bbox + delta
        const bb = calcBBoxForIds(project, selection.ids)
        if (bb) {
          const ax = bb.x + copyDeltaRef.current.dx
          const ay = bb.y + copyDeltaRef.current.dy
          pasteClipboard({ x: ax, y: ay })
        }
      }

      setMoveStart(null)
      setBaseline({})
      setBaselineBBox(null)
      setSnapGuides([])
      setGhostCopies([])
      copyModeRef.current = false
      pushedForThisDragRef.current = false
    }
  }

  // Keyboard (guard typing in inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null
      if (ae) {
        const tag = ae.tagName.toLowerCase()
        if (tag === "input" || tag === "textarea" || ae.isContentEditable) return
      }
      const k = e.key.toLowerCase()

      // Toggle GLOBAL group labels
      if (k === "l" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const curr = ((useProject as any).getState().project.canvas.showGroupLabels ?? true) as boolean
        updateCanvas({ showGroupLabels: !curr } as any)
        return
      }

      // Copy
      if ((e.metaKey || e.ctrlKey) && k === "c") {
        e.preventDefault()
        const clip = computeClipboardFromSelection()
        clipboardRef.current = clip
        return
      }

      // Paste
      if ((e.metaKey || e.ctrlKey) && k === "v") {
        e.preventDefault()
        if (clipboardRef.current) {
          const at = lastMouseLocalRef.current || undefined
          pasteClipboard(at)
        }
        return
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && k === "z") {
        e.preventDefault()
        undo?.()
        return
      }
      if ((e.metaKey || e.ctrlKey) && ((e.shiftKey && k === "z") || k === "y")) {
        e.preventDefault()
        redo?.()
        return
      }

      if ((k === "delete" || k === "backspace") && selection.ids.length) {
        e.preventDefault()
        removeModules(selection.ids)
        return
      }
      if ((e.metaKey || e.ctrlKey) && k === "g" && !e.shiftKey) {
        e.preventDefault()
        if (selection.ids.length >= 2) {
          createGroupFromSelection()
        }
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && k === "g") {
        e.preventDefault()
        const g = project.groups.find(
          (gr: any) => gr.memberIds.length > 0 && gr.memberIds.every((id: ID) => selection.ids.includes(id))
        )
        if (g) ungroupGroup(g.id)
        return
      }

      if (selection.ids.length) {
        const step = e.shiftKey ? 10 : 1
        if (k === "arrowleft") { e.preventDefault(); moveModulesBy(selection.ids, -step, 0) }
        else if (k === "arrowright") { e.preventDefault(); moveModulesBy(selection.ids, step, 0) }
        else if (k === "arrowup") { e.preventDefault(); moveModulesBy(selection.ids, 0, -step) }
        else if (k === "arrowdown") { e.preventDefault(); moveModulesBy(selection.ids, 0, step) }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selection.ids, removeModules, createGroupFromSelection, project.groups, ungroupGroup, moveModulesBy, undo, redo, updateCanvas])

  // ghost label (rows × cols) for placement
  const ghostLabel = (() => {
    if (previewRects.length === 0) return null
    const minX = Math.min(...previewRects.map((r) => r.x))
    const minY = Math.min(...previewRects.map((r) => r.y))
    const maxX = Math.max(...previewRects.map((r) => r.x + r.w))
    const maxY = Math.max(...previewRects.map((r) => r.y + r.h))
    const w = previewRects[0].w
    const h = previewRects[0].h
    const cols = Math.round((maxX - minX) / w)
    const rows = Math.round((maxY - minY) / h)
    return { text: `${rows} × ${cols}`, x: maxX + 8, y: maxY + 8 }
  })()

  // logo (optional)
  const logoBox = project.canvas.logo
  const [logoImg] = useImage(logoBox?.src || "", "anonymous")
  const logoDims = (() => {
    if (!logoImg || !logoBox?.size) return null
    const w = logoBox.size
    const h = (logoImg.height / logoImg.width) * w
    const x = logoBox.x ?? 10
    const y = logoBox.y ?? project.canvas.heightPx - h - 10
    return { w, h, x, y }
  })()

  /* ---------------------------- render ---------------------------- */
  return (
    <div
      ref={containerRef}
      style={{ position: "relative", flex: 1, height: "100%", background: "var(--bg-viewport)", overflow: "hidden" }}
    >
      {/* Floating toolbar (optional) */}
      {showToolbar && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            zIndex: 1000,
            display: "flex",
            gap: 8,
            background: "rgba(15,15,20,0.72)",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            color: "var(--text)",
            backdropFilter: "blur(6px)",
            pointerEvents: "auto",
          }}
        >
          <button onClick={() => setProjectCanvasZoom(1)} style={btnStyle} title="Reset Zoom">🔄</button>
          <button onClick={() => setProjectCanvasZoom((project.canvas.zoom ?? 1) * 1.2)} style={btnStyle} title="Zoom In">➕</button>
          <button onClick={() => setProjectCanvasZoom((project.canvas.zoom ?? 1) / 1.2)} style={btnStyle} title="Zoom Out">➖</button>

          <button
            onClick={() => setProjectCanvasShowGrid(!project.canvas.showGrid)}
            style={{ ...btnStyle, background: project.canvas.showGrid ? "var(--accent-2)" : "var(--button)", border: "1px solid var(--border)", color: "#fff" }}
            title="Toggle Grid"
          >
            {project.canvas.showGrid ? "GRID ON" : "GRID OFF"}
          </button>

          <button
            onClick={() => toggleSnapEnabled()}
            style={{ ...btnStyle, background: project.canvas.snapEnabled ? "var(--accent-3)" : "var(--button)", border: "1px solid var(--border)", color: "#fff" }}
            title="Snap to Grid"
          >
            {project.canvas.snapEnabled ? "SNAP ON" : "SNAP OFF"}
          </button>

          <button
            onClick={() => setMagnetOn(v => !v)}
            style={{ ...btnStyle, background: magnetOn ? "var(--accent-1)" : "var(--button)", border: "1px solid var(--border)", color: "#fff", fontWeight: 700 }}
            title="Magnetic snap to modules & groups"
          >
            {magnetOn ? "MAGNET ON" : "MAGNET OFF"}
          </button>

          <button
            onClick={() => updateCanvas({ showGroupLabels: !showGroupLabels } as any)}
            style={{ ...btnStyle, background: showGroupLabels ? "var(--accent-4)" : "var(--button)", border: "1px solid var(--border)", color: "#fff" }}
            title="Toggle group labels (L)"
          >
            {showGroupLabels ? "LABELS ON" : "LABELS OFF"}
          </button>
        </div>
      )}

      <Stage
        ref={(n) => { stageNodeRef.current = n; if (n) setStageRef(n) }}
        width={stageSize.w}
        height={stageSize.h}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          // Right-click anywhere: open menu only if current selection is exactly one full group
          e.evt.preventDefault()
          const gid = selectedGroupId()
          if (!gid) return
          const rect = containerRef.current?.getBoundingClientRect()
          const x = e.evt.clientX - (rect?.left ?? 0)
          const y = e.evt.clientY - (rect?.top ?? 0)
          setCtxMenu({ visible: true, x, y, groupId: gid })
        }}
      >
        <Layer scaleX={scale} scaleY={scale} x={offset.x} y={offset.y}>

          {/* Canvas bg */}
          <Rect
            x={0}
            y={0}
            width={project.canvas.widthPx}
            height={project.canvas.heightPx}
            fill={project.canvas.canvasBg || "#000"}
            

          />

          {/* Grid */}
          {project.canvas.showGrid &&
            [...Array(Math.floor(project.canvas.widthPx / project.canvas.gridSize))].map((_, i) => (
              <Rect
                key={`v-${i}`}
                x={i * project.canvas.gridSize}
                y={0}
                width={1}
                height={project.canvas.heightPx}
                fill={animOn ? hexToRGBA(project.canvas.gridColor, 0.60 + 0.25 * Math.sin(pulsePhase)) : project.canvas.gridColor}
                listening={false}
              />
            ))}
          {project.canvas.showGrid &&
            [...Array(Math.floor(project.canvas.heightPx / project.canvas.gridSize))].map((_, i) => (
              <Rect
                key={`h-${i}`}
                x={0}
                y={i * project.canvas.gridSize}
                width={project.canvas.widthPx}
                height={1}
                fill={animOn ? hexToRGBA(project.canvas.gridColor, 0.60 + 0.25 * Math.sin(pulsePhase)) : project.canvas.gridColor}
                listening={false}
              />
            ))}

          {/* Optional Logo */}
          {project.canvas.logo?.src && logoDims && (
            <Image image={logoImg} x={logoDims.x} y={logoDims.y} width={logoDims.w} height={logoDims.h} listening={false} />
          )}

          {/* ----- GROUP UNDERLAYS (with normalized mode) ----- */}
          {project.groups.map((g: any) => {
            const bb = groupBBox(g.memberIds)
            if (!bb) return null
            const grad = g.gradient as (undefined | { mode: "1" | "2" | "4" | number; color?: string; colors?: string[]; direction?: "horizontal" | "vertical" | "diag" })
            if (!grad) return null

            const mode = modeOf(grad.mode)

            if (mode === "1") {
              return (
                <Rect
                  key={`gunder-${g.id}`}
                  x={bb.x}
                  y={bb.y}
                  width={bb.w}
                  height={bb.h}
                  fill={grad.color || "#000"}
                  listening={false}
                />
              )
            }

            if (mode === "2") {
              const dir = grad.direction || "horizontal"
              const start = { x: 0, y: 0 }
              const end   = dir === "vertical" ? { x: 0, y: bb.h } : dir === "diag" ? { x: bb.w, y: bb.h } : { x: bb.w, y: 0 }
              const c0 = grad.colors?.[0] || "#000"
              const c1 = grad.colors?.[1] || "#fff"
              return (
                <Rect
                  key={`gunder-${g.id}`}
                  x={bb.x}
                  y={bb.y}
                  width={bb.w}
                  height={bb.h}
                  listening={false}
                  fillLinearGradientStartPoint={start}
                  fillLinearGradientEndPoint={end}
                  fillLinearGradientColorStops={[0, c0, 1, c1]}
                />
              )
            }

            // mode === "4"
            const c = grad.colors as [string, string, string, string] | undefined
            const colors4: [string, string, string, string] = c?.length === 4 ? c : ["#111", "#333", "#555", "#777"]
            return (
              <Rect
                key={`gunder-${g.id}`}
                x={bb.x}
                y={bb.y}
                width={bb.w}
                height={bb.h}
                listening={false}
                sceneFunc={(ctx, shape) => {
                  const w = shape.width()
                  const h = shape.height()
                  ctx.save()
                  ctx.beginPath()
                  ctx.rect(0, 0, w, h)
                  ctx.clip()
                  drawFourCornerGradient(ctx, w, h, colors4)
                  ctx.restore()
                  ctx.beginPath()
                  ctx.rect(0, 0, w, h)
                  ctx.closePath()
                }}
              />
            )
          })}

          {/* ----- MODULES (transparent inside gradients; no per-tile lines) ----- */}
          {project.modules.map((m: any) => {
            const t = project.moduleTypes.find((tt: any) => tt.id === m.typeId)
            if (!t) return null

            const inGroupId = moduleToGroup[m.id]
            const group = inGroupId ? project.groups.find((gg: any) => gg.id === inGroupId) : null
            const grad = group?.gradient as any
            const mode = grad ? modeOf(grad.mode) : undefined

            // entire group selected?
            const groupSelected =
              !!group &&
              group.memberIds.length > 0 &&
              group.memberIds.every((id: ID) => selection.ids.includes(id))

            // tile selected only when it's selected but not the whole group
            const tileSelected = selection.ids.includes(m.id) && !groupSelected

            // Fill rules
            let effectiveFill: string
            if (grad) {
              if (mode !== "1") {
                // 2/4 color gradient → tiles are transparent to reveal underlay (yellow if selected)
                effectiveFill = tileSelected ? "#ffd400" : "rgba(0,0,0,0)"
              } else {
                // single color group fill
                effectiveFill = tileSelected ? "#ffd400" : (grad.color || m.fill || "#444")
              }
            } else {
              effectiveFill = tileSelected ? "#ffd400" : (m.fill || "#444")
            }

            const stroke = tileSelected ? "yellow" : undefined
            const strokeWidth = tileSelected ? 3 : 0

            const showLabel = !inGroupId
            const pad = 6
            const maxW = Math.max(40, t.widthPx * 0.9)
            const maxH = Math.max(20, t.heightPx * 0.5)
            const text = `${m.label || t.name}\n${t.widthPx}×${t.heightPx}px\n(${m.x}, ${m.y})`
            const fit = fitTextToBox(text, maxW, maxH, { minFont: 8, lineHeight: 1.12 })
            const linesString = fit.lines.join("\n")
            const boxW = fit.boxW + pad * 2
            const boxH = fit.boxH + pad * 2
            const labelX = m.x + (t.widthPx - boxW) / 2
            const labelY = m.y + (t.heightPx - boxH) / 2

            return (
              <React.Fragment key={m.id}>
                <Rect
                  name={inGroupId ? undefined : "module-rect"}
                  dataId={inGroupId ? undefined : m.id}
                  listening={!inGroupId}
                  x={m.x}
                  y={m.y}
                  width={t.widthPx}
                  height={t.heightPx}
                  fill={effectiveFill}
                />
                {showLabel && (
                  <>
                    <Rect
                      x={labelX}
                      y={labelY}
                      width={boxW}
                      height={boxH}
                      fill={project.canvas.labelBg ?? "rgba(0,0,0,0.7)"}
                      cornerRadius={4}
                      listening={false}
                    />
                    <Text
                      x={labelX + pad}
                      y={labelY + pad}
                      width={boxW - pad * 2}
                      height={boxH - pad * 2}
                      align="center"
                      verticalAlign="middle"
                      text={linesString}
                      fontSize={fit.fontSize}
                      lineHeight={1.12}
                      fill={project.canvas.labelTextColor ?? "#ffffff"}
                      listening={false}
                    />
                  </>
                )}
              </React.Fragment>
            )
          })}

          {/* ----- GROUP OVERLAYS (outline/label/hit) ----- */}
          {project.groups.map((g: any) => {
            const bb = groupBBox(g.memberIds)
            if (!bb) return null

            // product names in label
            const productSet = new Set<string>()
            g.memberIds.forEach((id: ID) => {
              const m = project.modules.find((mm: any) => mm.id === id)
              if (!m) return
              const t = project.moduleTypes.find((tt: any) => tt.id === m.typeId)
              if (!t) return
              productSet.add(t.name || "Unknown")
            })
            const productNames = Array.from(productSet)
            const productLine = productNames.length <= 3
              ? productNames.join(", ")
              : `${productNames.slice(0, 3).join(", ")} +${productNames.length - 3} more`

            const panelCount = g.memberIds.length
            const labelText = `${g.name}\n${panelCount} panels\n${productLine}\n${bb.w}×${bb.h}px\n(${bb.x}, ${bb.y})`

            const pad = 8
            const maxLabelW = Math.max(100, bb.w * 0.8)
            const maxLabelH = Math.max(50, bb.h * 0.5)
            const fit = fitTextToBox(labelText, maxLabelW, maxLabelH, { minFont: 10, lineHeight: 1.12 })
            const linesString = fit.lines.join("\n")

            const labelW = fit.boxW + pad * 2
            const labelH = fit.boxH + pad * 2
            const labelX = bb.x + (bb.w - labelW) / 2
            const labelY = bb.y + (bb.h - labelH) / 2

            const dash =
              g.borderStyle === "dashed" ? [8, 6]
                : g.borderStyle === "dotted" ? [2, 6]
                : undefined

            const groupSelected =
              g.memberIds.length > 0 &&
              g.memberIds.every((id: ID) => (selection.ids as ID[]).includes(id))

            const showThisGroupsLabel = showGroupLabels && !(g as any).labelHidden

            return (
              <React.Fragment key={`gover-${g.id}`}>
                {groupSelected && (
                  <Rect x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="rgba(255,212,0,0.35)" listening={false} />
                )}

                <Rect
                  name="group-hit"
                  dataId={g.id}
                  x={bb.x}
                  y={bb.y}
                  width={bb.w}
                  height={bb.h}
                  fill="rgba(0,0,0,0.001)"
                  onContextMenu={(evt) => openGroupMenu(evt as any, g.id)}
                  onMouseDown={(evt) => {
                    if ((evt.evt as MouseEvent).button === 2) openGroupMenu(evt as any, g.id)
                  }}
                />

                <Rect
                  x={bb.x}
                  y={bb.y}
                  width={bb.w}
                  height={bb.h}
                  stroke={groupSelected ? "yellow" : g.color}
                  strokeWidth={g.borderWidth ?? 2}
                  dash={dash}
                  listening={false}
                />

                {showThisGroupsLabel && (
                  <>
                    <Rect x={labelX} y={labelY} width={labelW} height={labelH} fill={g.labelBg ?? "rgba(0,0,0,0.7)"} cornerRadius={4} listening={false} />
                    <Text
                      x={labelX + pad}
                      y={labelY + pad}
                      width={labelW - pad * 2}
                      height={labelH - pad * 2}
                      align="center"
                      verticalAlign="middle"
                      text={linesString}
                      fontSize={fit.fontSize}
                      lineHeight={1.12}
                      fill={g.labelTextColor ?? "#ffffff"}
                      listening={false}
                    />
                  </>
                )}
              </React.Fragment>
            )
          })}

          {/* Selection hitbox for dragging the collection */}
          {currentSelBBox && selection.ids.length > 0 && (
            <Rect
              name="selection-hit"
              x={currentSelBBox.x}
              y={currentSelBBox.y}
              width={currentSelBBox.w}
              height={currentSelBBox.h}
              fill="rgba(0,0,0,0.001)"
            />
          )}

          {/* Ghost preview for Alt/Option copy-drag */}
          {ghostCopies.map((g, idx) => (
            <Rect key={`ghostcopy-${idx}`} x={g.x} y={g.y} width={g.w} height={g.h} fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth={1} dash={[6, 4]} listening={false} />
          ))}

          {/* Placement ghost preview */}
          {previewRects.map((r, idx) => (
            <Rect key={`ghost-${idx}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(0,255,0,0.25)" stroke="lime" strokeWidth={1} dash={[4, 2]} />
          ))}
          {ghostLabel && <Text x={ghostLabel.x} y={ghostLabel.y} text={ghostLabel.text} fontSize={28} fill="lime" fontStyle="bold" />}

          {/* Marquee */}
          {marqueeRect && (
            <Rect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.w}
              height={marqueeRect.h}
              fill="rgba(63,167,255,0.15)"
              stroke="#3fa7ff"
              strokeWidth={1}
              dash={[6, 4]}
            />
          )}

          {/* Snap guides */}
          {snapGuides.map((g, i) => (
            <Line
              key={`guide-${i}`}
              points={[g.x1, g.y1, g.x2, g.y2]}
              stroke="#ff9f1a"
              dash={[8, 6]}
              strokeWidth={2}
              listening={false}
            />
          ))}
        </Layer>
      </Stage>

      {/* Right-click menu (HTML overlay) */}
      {ctxMenu.visible && (
        <div
          id="ctx-menu"
          style={{
            position: "absolute",
            left: ctxMenu.x,
            top: ctxMenu.y,
            zIndex: 2000,
            background: "var(--bg-panel)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
            overflow: "hidden",
            minWidth: 160,
            pointerEvents: "auto",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <CtxBtn onClick={ctxSelectGroup}>Select group</CtxBtn>
          <CtxBtn onClick={ctxRenameGroup}>Rename…</CtxBtn>
          <CtxBtn onClick={ctxDuplicate}>Duplicate</CtxBtn>
          <CtxBtn onClick={ctxToggleLabel}>Toggle label</CtxBtn>
          <CtxBtn onClick={ctxUngroup} danger>Ungroup</CtxBtn>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--button)",
  color: "var(--text)",
  fontSize: 16,
  cursor: "pointer",
}

/* Small helper for context menu buttons */
function CtxBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        color: danger ? "var(--danger-text, #ff6b6b)" : "var(--text)",
        border: "none",
        padding: "8px 12px",
        cursor: "pointer",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  )
}