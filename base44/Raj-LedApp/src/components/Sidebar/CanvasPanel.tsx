import React, { useState, useEffect } from "react"
import { useProject } from "@store/projectStore"

export default function CanvasPanel() {
  const { project, updateCanvas } = useProject()
  const [open, setOpen] = useState(false)

  // local mirrors for controlled inputs
  const [width, setWidth] = useState(project.canvas.widthPx.toString())
  const [height, setHeight] = useState(project.canvas.heightPx.toString())
  const [gridSize, setGridSize] = useState(project.canvas.gridSize.toString())

  useEffect(() => {
    setWidth(project.canvas.widthPx.toString())
    setHeight(project.canvas.heightPx.toString())
    setGridSize(project.canvas.gridSize.toString())
  }, [project.canvas.widthPx, project.canvas.heightPx, project.canvas.gridSize])

  const applyIfNumber = (field: "widthPx" | "heightPx" | "gridSize", raw: string) => {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) {
      updateCanvas({ [field]: Math.floor(n) })
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
        Canvas Settings {open ? "▾" : "▸"}
      </h3>

      {open && (
        <div className="panel-body" style={{ marginTop: "8px", fontSize: "13px" }}>
          <div style={{ marginBottom: "8px" }}>
            <button
              onClick={() => updateCanvas({ widthPx: 1920, heightPx: 1080 })}
              style={{
                background: "var(--button)",
                border: "1px solid var(--button-border)",
                color: "var(--text)",
                marginRight: "6px",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              1080p
            </button>
            <button
              onClick={() => updateCanvas({ widthPx: 3840, heightPx: 2160 })}
              style={{
                background: "var(--button)",
                border: "1px solid var(--button-border)",
                color: "var(--text)",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              4K
            </button>
          </div>

          <label>Width</label>
          <input
            type="number"
            inputMode="numeric"
            value={width}
            onChange={(e) => {
              setWidth(e.target.value)
              applyIfNumber("widthPx", e.target.value)
            }}
            onBlur={() => applyIfNumber("widthPx", width)}
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text)",
              width: "100%",
              marginBottom: "6px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
            min={1}
          />

          <label>Height</label>
          <input
            type="number"
            inputMode="numeric"
            value={height}
            onChange={(e) => {
              setHeight(e.target.value)
              applyIfNumber("heightPx", e.target.value)
            }}
            onBlur={() => applyIfNumber("heightPx", height)}
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text -strong)",
              width: "100%",
              marginBottom: "6px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
            min={1}
          />

          <label>Grid Size</label>
          <input
            type="number"
            inputMode="numeric"
            value={gridSize}
            onChange={(e) => {
              setGridSize(e.target.value)
              applyIfNumber("gridSize", e.target.value)
            }}
            onBlur={() => applyIfNumber("gridSize", gridSize)}
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text)",
              width: "100%",
              marginBottom: "6px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
            min={1}
          />

          <label>Grid Color</label>
          <input
            type="color"
            value={project.canvas.gridColor}
            onChange={(e) => updateCanvas({ gridColor: e.target.value })}
            style={{ marginBottom: "6px" }}
          />

          <label>Viewport BG</label>
          <input
            type="color"
            value={project.canvas.viewportBg}
            onChange={(e) => updateCanvas({ viewportBg: e.target.value })}
            style={{ marginBottom: "6px" }}
          />

          <label>Canvas BG</label>
          <input
            type="color"
            value={project.canvas.canvasBg}
            onChange={(e) => updateCanvas({ canvasBg: e.target.value })}
            style={{ marginBottom: "6px" }}
          />
        </div>
      )}
    </div>
  )
}