// src/components/Sidebar/ModulesPanel.tsx
import React, { useState } from "react"
import { useProject } from "@store/projectStore"
import { PANELS_LIBRARY } from "@lib/ledPanels"

export default function ModulesPanel() {
  const {
    project,
    setActiveType,
    addModuleType,
    activeType,
    updateCanvas, // assumes this exists in your store
  } = useProject()

  const [open, setOpen] = useState(false) // closed by default
  const [name, setName] = useState("")
  const [width, setWidth] = useState("500")
  const [height, setHeight] = useState("500")

  const addType = () => {
    const w = parseInt(width, 10)
    const h = parseInt(height, 10)
    if (!name.trim() || isNaN(w) || isNaN(h)) return
    const id = addModuleType(name.trim(), w, h)
    // make it the active placement type right away
    setActiveType(id)
    setName("")
    setWidth("500")
    setHeight("500")
  }

  // Add a module type directly from the library
  const addFromLibrary = (key: string) => {
    if (!key) return
    const item = PANELS_LIBRARY.find(
      (i) => `${i.brand}::${i.model}` === key
    )
    if (!item) return
    const label = `${item.brand} ${item.model}`
    const id = addModuleType(label, item.widthPx, item.heightPx)
    setActiveType(id)
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
        style={{
          cursor: "pointer",
          margin: 0,
          fontSize: "14px",
          color: "var(--text-strong)",
        }}
        onClick={() => setOpen(!open)}
      >
        Modules {open ? "▾" : "▸"}
      </h3>

      {open && (
        <div
          className="panel-body"
          style={{ marginTop: "8px", fontSize: "13px" }}
        >
          {/* Select existing module type */}
          <label style={{ color: "var(--text-strong)" }}>Select Module Type</label>
          <select
            value={activeType ?? ""}
            onChange={(e) => setActiveType(e.target.value || null)}
            style={{
              background: "var(--input-bg, var(--button))",
              border: "1px solid var(--input-border, var(--button-border))",
              color: "var(--text)",
              width: "100%",
              marginBottom: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
          >
            <option value="">— Select a module —</option>
            {project.moduleTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.widthPx}×{t.heightPx})
              </option>
            ))}
          </select>

          {/* Quick add from LED panel library */}
          <label style={{ color: "var(--text-strong)" }}>Add From LED Panel Library</label>
          <select
            defaultValue=""
            onChange={(e) => {
              addFromLibrary(e.target.value)
              // reset the dropdown visual back to placeholder
              e.currentTarget.value = ""
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
          >
            <option value="" disabled>— Add a panel from library —</option>
            {/* Group items by brand */}
            {Array.from(new Set(PANELS_LIBRARY.map((i) => i.brand))).map((brand) => (
              <optgroup key={brand} label={brand}>
                {PANELS_LIBRARY.filter((i) => i.brand === brand).map((i) => (
                  <option key={`${i.brand}::${i.model}`} value={`${i.brand}::${i.model}`}>
                    {i.model} ({i.widthPx}×{i.heightPx})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--border)",
              margin: "10px 0",
            }}
          />

          {/* Add new custom module type */}
          <label style={{ color: "var(--text-strong)" }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Module name"
            style={{
              background: "var(--input-bg, var(--button))",
              border: "1px solid var(--input-border, var(--button-border))",
              color: "var(--text)",
              width: "100%",
              marginBottom: "6px",
              padding: "6px 8px",
              borderRadius: "6px",
            }}
          />
          <hr
  style={{
    border: 0,
    borderTop: "1px solid var(--border)",
    margin: "12px 0",
  }}
/>

{/* Label Settings */}
<label>Label Font Size</label>
<input
  type="number"
  value={project.canvas.labelFontSize || 14}
  onChange={(e) =>
    updateCanvas({ labelFontSize: parseInt(e.target.value, 10) || 14 })
  }
  style={{
    background: "var(--input-bg, var(--button))",
    border: "1px solid var(--input-border, var(--button-border))",
    color: "var(--text)",
    width: "100%",
    marginBottom: "6px",
    padding: "6px 8px",
    borderRadius: "6px",
  }}
/>

<label>Label Background</label>
<input
  type="color"
  value={project.canvas.labelBg}
  onChange={(e) => updateCanvas({ labelBg: e.target.value })}
  style={{ marginBottom: "6px" }}
/>

<label>Label Text Color</label>
<input
  type="color"
  value={project.canvas.labelTextColor}
  onChange={(e) => updateCanvas({ labelTextColor: e.target.value })}
  style={{ marginBottom: "6px" }}
/>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <div>
              <label style={{ color: "var(--text-strong)" }}>Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                style={{
                  background: "var(--input-bg, var(--button))",
                  border: "1px solid var(--input-border, var(--button-border))",
                  color: "var(--text)",
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "6px",
                }}
              />
            </div>
            <div>
              <label style={{ color: "var(--text-strong)" }}>Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{
                  background: "var(--input-bg, var(--button))",
                  border: "1px solid var(--input-border, var(--button-border))",
                  color: "var(--text)",
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>

          <button
            onClick={addType}
            style={{
              marginTop: "10px",
              width: "100%",
              background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))",
              border: "1px solid rgba(124,77,255,0.6)",
              color: "#fff",
              padding: "8px 10px",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(124,77,255,0.35)",
            }}
          >
            Save Module Type
          </button>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--border)",
              margin: "12px 0",
            }}
          />
 

          <label style={{ color: "var(--text-strong)" }}>Label Background</label>
          <input
            type="color"
            value={(project.canvas as any).labelBg ?? "#000000"}
            onChange={(e) => updateCanvas?.({ labelBg: e.target.value })}
            style={{ marginBottom: "6px" }}
          />

          <label style={{ color: "var(--text-strong)" }}>Label Text Color</label>
          <input
            type="color"
            value={(project.canvas as any).labelTextColor ?? "#ffffff"}
            onChange={(e) => updateCanvas?.({ labelTextColor: e.target.value })}
            style={{ marginBottom: "6px" }}
          />

          {/* Library list (what you already have in project after adding) */}
        
        </div>
      )}
    </div>
  )
}

