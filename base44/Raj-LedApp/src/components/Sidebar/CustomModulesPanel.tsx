import React, { useState } from "react"
import { useProject } from "@store/projectStore"

export default function CustomModulesPanel() {
  const { project, addModuleType } = useProject()
  const [name, setName] = useState("")
  const [width, setWidth] = useState(500)
  const [height, setHeight] = useState(500)

  const onAdd = () => {
    if (!name.trim()) return
    addModuleType(name, width, height)
    setName("")
    setWidth(500)
    setHeight(500)
  }

  return (
    <div className="panel">
      <h3>Custom Modules</h3>
      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>Width (px)</label>
      <input
        type="number"
        value={width}
        onChange={(e) => setWidth(parseInt(e.target.value || "0"))}
      />

      <label>Height (px)</label>
      <input
        type="number"
        value={height}
        onChange={(e) => setHeight(parseInt(e.target.value || "0"))}
      />

      <button className="btn" onClick={onAdd}>
        Add Module Type
      </button>

      {project.moduleTypes.length > 0 && (
        <ul style={{ marginTop: 8 }}>
          {project.moduleTypes.map((mt) => (
            <li key={mt.id}>
              {mt.name} — {mt.widthPx}×{mt.heightPx}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
