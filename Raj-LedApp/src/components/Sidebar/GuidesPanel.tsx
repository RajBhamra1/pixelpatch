import React, { useState } from "react"
import { useProject, type Guide } from "@store/projectStore"

export default function GuidesPanel() {
  const { project, updateCanvas } = useProject()
  const guides: Guide[] = project.canvas.guides || []
  const [pos, setPos] = useState("100")
  const [orient, setOrient] = useState<"h" | "v">("h")

  const addGuide = () => {
    const p = parseInt(pos, 10)
    if (Number.isNaN(p)) return
    updateCanvas({ guides: [...guides, { orientation: orient, positionPx: p }] })
    setPos("100")
  }

  const removeGuide = (idx: number) => {
    const next = guides.slice()
    next.splice(idx, 1)
    updateCanvas({ guides: next })
  }

  return (
    <div style={{ padding: 10 }}>
      <h3>Guides</h3>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <select value={orient} onChange={(e) => setOrient(e.target.value as "h" | "v")}>
          <option value="h">Horizontal</option>
          <option value="v">Vertical</option>
        </select>
        <input
          type="number"
          value={pos}
          onChange={(e) => setPos(e.target.value)}
          placeholder="Position (px)"
          style={{ width: "100%" }}
        />
        <button onClick={addGuide}>Add</button>
      </div>

      {guides.length === 0 ? (
        <div style={{ fontSize: 12, color: "#888" }}>No guides yet.</div>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
          {guides.map((g, i) => (
            <li key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>{g.orientation.toUpperCase()} @ {g.positionPx}px</span>
              <button onClick={() => removeGuide(i)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
