import React, { useRef, useState } from "react"
import { useProject } from "@store/projectStore"

// Minimal shape we need from Konva Stage at runtime
type StageLike = {
  width: (n?: number) => number
  height: (n?: number) => number
  scale: (s?: { x: number; y: number }) => { x: number; y: number }
  getLayers?: () => any[]
  getChildren?: () => any[]
  draw?: () => void
  toDataURL: (opts?: {
    pixelRatio?: number
    x?: number
    y?: number
    width?: number
    height?: number
    mimeType?: string
    quality?: number
  }) => string
}

type ExportResult = void | string | Blob | Promise<void | string | Blob>

export default function ExportPanel() {
  const {
    project,
    exportPNG,
    exportPDF,
    exportJSON,
    importJSON,
    setProjectName,

    // provided by store
    getStage,     // () => StageLike | null
    stageRef,     // { current?: StageLike }
  } = useProject() as any

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name || "Untitled Project")
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = () => fileRef.current?.click()
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try { importJSON(reader.result as string) }
      catch { alert("Invalid project JSON") }
    }
    reader.readAsText(f)
  }

  const commitName = () => {
    const trimmed = name.trim() || "Untitled Project"
    if (trimmed !== project.name) setProjectName(trimmed)
  }

  // ---------- filename helpers ----------
  const fileSafe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "-").trim()
  const stamp = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`
  }
  const buildFilename = (ext: "png" | "pdf" | "json") =>
    `${fileSafe(project.name || "Untitled Project")}_${project.canvas.widthPx}x${project.canvas.heightPx}_${stamp()}.${ext}`

  const triggerDownload = (data: string | Blob, filename: string) => {
    const a = document.createElement("a")
    if (typeof data === "string") a.href = data
    else {
      const url = URL.createObjectURL(data)
      a.href = url
      setTimeout(() => URL.revokeObjectURL(url), 15_000)
    }
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // ---------- Stage access (robust) ----------
  const getStageNow = (): StageLike | null =>
    (typeof getStage === "function" ? (getStage() as StageLike | null) : null) ||
    (stageRef && stageRef.current ? (stageRef.current as StageLike) : null) ||
    ((window as any).Konva?.stages?.[0] ?? null)

  // Fallback: grab the visible scene canvas (exports the *viewport*, not logical canvas)
  const getCurrentSceneCanvas = (): HTMLCanvasElement | null =>
    document.querySelector<HTMLCanvasElement>(".konvajs-content canvas")

  // ---------- Core: capture the logical canvas area exactly ----------
  const capturePNGExact = (): string | null => {
    const W = project.canvas.widthPx
    const H = project.canvas.heightPx
    const stage = getStageNow() as any
    if (!stage) return null

    // first layer is the one we transform in StageViewport
    const layers: any[] = stage.getLayers ? stage.getLayers() : stage.getChildren?.() || []
    const layer = layers && layers.length ? layers[0] : null

    // snapshot current transforms
    const prev = {
      stageW: typeof stage.width === "function" ? stage.width() : undefined,
      stageH: typeof stage.height === "function" ? stage.height() : undefined,
      stageScale: typeof stage.scale === "function" ? stage.scale() : { x: 1, y: 1 },
      layerX: layer?.x?.() ?? 0,
      layerY: layer?.y?.() ?? 0,
      layerSX: layer?.scaleX?.() ?? 1,
      layerSY: layer?.scaleY?.() ?? 1,
    }

    try {
      // Normalise to logical space (no scale/offset), render full canvas region
      if (typeof stage.width === "function") stage.width(W)
      if (typeof stage.height === "function") stage.height(H)
      if (typeof stage.scale === "function") stage.scale({ x: 1, y: 1 })
      if (layer) {
        layer.scale?.({ x: 1, y: 1 })
        layer.position?.({ x: 0, y: 0 })
      }
      stage.draw?.()

      // Export at exact pixels
      return stage.toDataURL({
        pixelRatio: 1,
        x: 0,
        y: 0,
        width: W,
        height: H,
        mimeType: "image/png",
        quality: 1,
      })
    } catch (err: any) {
      const msg = String(err?.message || err)
      if (/tainted|security/i.test(msg)) {
        throw new Error(
          "Canvas is tainted by a cross-origin image. " +
          "Enable CORS on your image host and load with crossOrigin='anonymous'."
        )
      }
      throw err
    } finally {
      // restore live viewport
      try {
        if (typeof stage.width === "function" && prev.stageW != null) stage.width(prev.stageW)
        if (typeof stage.height === "function" && prev.stageH != null) stage.height(prev.stageH)
        if (typeof stage.scale === "function" && prev.stageScale) stage.scale(prev.stageScale)
        if (layer) {
          layer.scale?.({ x: prev.layerSX, y: prev.layerSY })
          layer.position?.({ x: prev.layerX, y: prev.layerY })
        }
        stage.draw?.()
      } catch { /* no-op */ }
    }
  }

  // ---------- Export actions ----------
  const exportOpts = {
    respectCanvasSize: true,
    width: project.canvas.widthPx,
    height: project.canvas.heightPx,
    filename: fileSafe(project.name || "Untitled Project"),
  }

  const onExportPNG = async () => {
    try {
      // Prefer store hook if present
      if (typeof exportPNG === "function") {
        const maybe = (exportPNG as (o: any) => ExportResult)(exportOpts)
        const res = maybe instanceof Promise ? await maybe : maybe
        if (typeof res === "string") return triggerDownload(res, buildFilename("png"))
        if (res instanceof Blob) return triggerDownload(res, buildFilename("png"))
        if (res === undefined) return
      }

      // Internal capture
      let dataURL = capturePNGExact()
      if (!dataURL) {
        // Last-resort fallback: DOM canvas (viewport capture)
        const scene = getCurrentSceneCanvas()
        if (scene) dataURL = scene.toDataURL("image/png")
      }
      if (!dataURL) throw new Error("Could not capture canvas")

      triggerDownload(dataURL, buildFilename("png"))
    } catch (err: any) {
      console.error(err)
      alert(`Failed to export PNG.\n\n${err?.message || err}`)
    }
  }

  const onExportPDF = async () => {
    try {
      if (typeof exportPDF === "function") {
        const maybe = (exportPDF as (o: any) => ExportResult)(exportOpts)
        const res = maybe instanceof Promise ? await maybe : maybe
        if (typeof res === "string") return triggerDownload(res, buildFilename("pdf"))
        if (res instanceof Blob) return triggerDownload(res, buildFilename("pdf"))
        if (res === undefined) return
      }

      const dataURL =
        capturePNGExact() ||
        getCurrentSceneCanvas()?.toDataURL("image/png") ||
        null
      if (!dataURL) throw new Error("Could not capture canvas for PDF")

      const html = `
        <!doctype html>
        <meta charset="utf-8"/>
        <title>${fileSafe(project.name || "Canvas Export")}</title>
        <style>
          @page { margin: 0; size: ${project.canvas.widthPx}px ${project.canvas.heightPx}px; }
          html, body { margin: 0; padding: 0; }
          img { width: ${project.canvas.widthPx}px; height: ${project.canvas.heightPx}px; display: block; }
        </style>
        <img src="${dataURL}" />
      `
      const pdfLike = new Blob([html], { type: "text/html" })
      triggerDownload(pdfLike, buildFilename("pdf"))
    } catch (err: any) {
      console.error(err)
      alert(`Failed to export PDF.\n\n${err?.message || err}`)
    }
  }

  const onDownloadJSON = async () => {
    try {
      if (typeof exportJSON === "function") {
        const maybe = exportJSON() as ExportResult
        const res = maybe instanceof Promise ? await maybe : maybe
        if (typeof res === "string") {
          return triggerDownload(new Blob([res], { type: "application/json" }), buildFilename("json"))
        }
        if (res instanceof Blob) return triggerDownload(res, buildFilename("json"))
        if (res === undefined) return
      }
      const dump = JSON.stringify(project, null, 2)
      triggerDownload(new Blob([dump], { type: "application/json" }), buildFilename("json"))
    } catch (err: any) {
      console.error(err)
      alert(`Failed to export JSON.\n\n${err?.message || err}`)
    }
  }

  return (
    <div
      className="panel"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        padding: "8px",
        borderRadius: "6px",
        marginBottom: "8px",
      }}
    >
      <h3
        className="panel-header"
        style={{ cursor: "pointer", margin: 0, fontSize: "14px", color: "var(--text-strong)" }}
        onClick={() => setOpen(!open)}
      >
        Export / Import {open ? "▾" : "▸"}
      </h3>

      {open && (
        <div className="panel-body" style={{ marginTop: "8px", fontSize: "13px" }}>
          {/* Project name edit */}
          <label>Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur()
              if (e.key === "Escape") {
                setName(project.name || "Untitled Project")
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            style={{
              background: "var(--input-bg, var(--button))",
              border: "1px solid var(--input-border, var(--button-border))",
              color: "var(--text)",
              width: "100%",
              marginBottom: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={onExportPNG} style={btnStyle}>Export PNG</button>
            <button onClick={onExportPDF} style={btnStyle}>Export PDF</button>
            <button onClick={onDownloadJSON} style={btnStyle}>Download JSON</button>
            <button onClick={onPick} style={btnStyle}>Import JSON</button>
          </div>

          <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onFile} />

          <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 12 }}>
            Canvas {project.canvas.widthPx}×{project.canvas.heightPx}px · Modules {project.modules.length}
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: "var(--button)",
  border: "1px solid var(--button-border)",
  color: "var(--text)",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
}
