import React, { useRef, useState } from "react"
import { useProject } from "@store/projectStore"

export default function AssetsPanel() {
  const { project, setBackgroundImage, clearBackgroundImage, setLogoBox, updateCanvas } = useProject()
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = () => fileRef.current?.click()
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    // Save uploaded image as logo source
    setLogoBox({ src: reader.result as string })
  }
  reader.readAsDataURL(f)
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
        Assets {open ? "▾" : "▸"}
      </h3>

      {open && (
        <div className="panel-body" style={{ marginTop: "8px", fontSize: "13px" }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              onClick={onPick}
              style={{
                background: "var(--button)",
                border: "1px solid var(--button-border)",
                color: "var(--text)",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Upload Background
            </button>
            <button
              onClick={() => clearBackgroundImage()}
              style={{
                background: "var(--button)",
                border: "1px solid var(--button-border)",
                color: "var(--text)",
                padding: "6px 8px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>

          <label>Background Fit</label>
          <select
            value={project.canvas.background?.fit ?? "contain"}
            onChange={(e) => updateCanvas({ background: { ...(project.canvas.background || { src: "" }), fit: e.target.value as any } })}
            style={{
              background: "var(--input-bg, var(--button))",
              border: "1px solid var(--input-border, var(--button-border))",
              color: "var(--text)",
              width: "100%",
              marginBottom: "6px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
          >
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="stretch">Stretch</option>
          </select>

          <label>Logo Box (px)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <input
              type="number"
              placeholder="x"
              value={project.canvas.logo?.x ?? 0}
              onChange={(e) => setLogoBox({ x: parseInt(e.target.value || "0", 10) })}
              style={{
                background: "var(--input-bg, var(--button))",
                border: "1px solid var(--input-border, var(--button-border))",
                color: "var(--text)",
                padding: "6px 8px",
                borderRadius: "6px",
              }}
            />
            <input
              type="number"
              placeholder="y"
              value={project.canvas.logo?.y ?? 0}
              onChange={(e) => setLogoBox({ y: parseInt(e.target.value || "0", 10) })}
              style={{
                background: "var(--input-bg, var(--button))",
                border: "1px solid var(--input-border, var(--button-border))",
                color: "var(--text)",
                padding: "6px 8px",
                borderRadius: "6px",
              }}
            />
            <input
              type="number"
              placeholder="size"
              value={project.canvas.logo?.size ?? 200}
              onChange={(e) => setLogoBox({ size: parseInt(e.target.value || "200", 10) })}
              style={{
                background: "var(--input-bg, var(--button))",
                border: "1px solid var(--input-border, var(--button-border))",
                color: "var(--text)",
                padding: "6px 8px",
                borderRadius: "6px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}