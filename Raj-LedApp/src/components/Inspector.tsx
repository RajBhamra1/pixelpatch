import React from "react"
import { useProject } from "@store/projectStore"

export default function Inspector() {
  const { project, selection, updateModule, bringForward, sendBackward } = useProject()

  if (selection.ids.length === 0) {
    return (
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 220,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: 10,
          fontSize: 12,
        }}
      >
        <strong>No selection</strong>
      </div>
    )
  }

  const first = project.modules.find((m) => m.id === selection.ids[0])
  if (!first) return null

  const t = project.moduleTypes.find((mt) => mt.id === first.typeId)
  if (!t) return null

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 240,
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 4,
        padding: 10,
        fontSize: 12,
      }}
    >
      <h3>Inspector</h3>
      <p>
        <strong>Type:</strong> {t.name}
      </p>
      <label>
        X:{" "}
        <input
          type="number"
          value={first.x}
          onChange={(e) =>
            updateModule(first.id, { x: parseInt(e.target.value || "0") })
          }
        />
      </label>
      <br />
      <label>
        Y:{" "}
        <input
          type="number"
          value={first.y}
          onChange={(e) =>
            updateModule(first.id, { y: parseInt(e.target.value || "0") })
          }
        />
      </label>
      <br />
      <label>
        Rotation:{" "}
        <input
          type="number"
          value={first.rotation}
          onChange={(e) =>
            updateModule(first.id, { rotation: parseInt(e.target.value || "0") })
          }
        />
      </label>
      <br />
      <label>
        Label:{" "}
        <input
          type="text"
          value={first.label || ""}
          onChange={(e) => updateModule(first.id, { label: e.target.value })}
        />
      </label>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => bringForward(first.id)}>Bring Forward</button>{" "}
        <button onClick={() => sendBackward(first.id)}>Send Backward</button>
      </div>
    </div>
  )
}
