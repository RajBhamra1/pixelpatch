import React, { useState, useMemo, useEffect } from "react"
import { useProject } from "@store/projectStore"

type ID = string

// Build a safe gradient object for UI display (does not mutate state)
function ensureGradient(g: any) {
  const mode: "1" | "2" | "4" =
    g?.gradient?.mode === "2" || g?.gradient?.mode === 2 ? "2" :
    g?.gradient?.mode === "4" || g?.gradient?.mode === 4 ? "4" : "1"

  if (mode === "1") {
    return { mode, color: g?.gradient?.color || g?.color || "#4a90e2" }
  }
  if (mode === "2") {
    const colors = Array.isArray(g?.gradient?.colors) ? g.gradient.colors : [g?.color || "#4a90e2", "#ffffff"]
    const direction: "horizontal" | "vertical" | "diag" = g?.gradient?.direction || "horizontal"
    return { mode, colors: [colors[0] || "#4a90e2", colors[1] || "#ffffff"], direction }
  }
  // mode === "4"
  const colors4 = Array.isArray(g?.gradient?.colors) && g.gradient.colors.length === 4
    ? g.gradient.colors
    : [g?.color || "#2b2b2b", "#4b4b4b", "#6b6b6b", "#8b8b8b"]
  return { mode, colors: colors4 }
}

// simple random hex colour
const randomHex = () =>
  "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")

export default function GroupsPanel() {
  const {
    project,
    selection,
    createGroupFromSelection,
    ungroupGroup,
    updateGroup,
    setSelection,
  } = useProject() as any

  const [open, setOpen] = useState(false)

  // Per-group collapsed state (default: collapsed to save space)
  const [collapsed, setCollapsed] = useState<Record<ID, boolean>>({})

  // Keep collapse map in sync with groups (add new, remove missing)
  useEffect(() => {
    setCollapsed((prev) => {
      const next: Record<ID, boolean> = { ...prev }
      const ids = new Set<string>()
      project.groups.forEach((g: any) => {
        ids.add(g.id)
        if (next[g.id] === undefined) next[g.id] = true // default collapsed
      })
      // prune removed groups
      Object.keys(next).forEach((id) => { if (!ids.has(id)) delete next[id] })
      return next
    })
  }, [project.groups])

  const toggleGroup = (id: ID) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  // Prevent Backspace/Delete from bubbling up when typing in inputs
  const stopKeyBubble: React.KeyboardEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    e.stopPropagation()
  }

  const groupsWithBounds = useMemo(() => {
    return project.groups.map((g: any) => {
      const rects: { x: number; y: number; w: number; h: number }[] = []
      g.memberIds.forEach((id: ID) => {
        const m = project.modules.find((mm: any) => mm.id === id)
        if (!m) return
        const t = project.moduleTypes.find((tt: any) => tt.id === m.typeId)
        if (!t) return
        rects.push({ x: m.x, y: m.y, w: t.widthPx, h: t.heightPx })
      })
      if (!rects.length) return { g, bbox: null as any }
      const minX = Math.min(...rects.map((r) => r.x))
      const minY = Math.min(...rects.map((r) => r.y))
      const maxX = Math.max(...rects.map((r) => r.x + r.w))
      const maxY = Math.max(...rects.map((r) => r.y + r.h))
      return { g, bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } }
    })
  }, [project.groups, project.modules, project.moduleTypes])

  const makeGroup = () => {
    if (selection.ids.length >= 2) createGroupFromSelection()
  }

  const fieldLabel: React.CSSProperties = {
    display: "block",
    marginTop: 6,
    marginBottom: 4,
    fontWeight: 600,
    color: "var(--text-strong)",
  }

  const row: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" }
  const btn: React.CSSProperties = {
    background: "var(--button)",
    border: "1px solid var(--button-border, var(--border))",
    color: "var(--text)",
    padding: "6px 8px",
    borderRadius: 6,
    cursor: "pointer",
  }
  const selectStyle: React.CSSProperties = {
    background: "var(--input-bg, var(--button))",
    border: "1px solid var(--input-border, var(--button-border))",
    color: "var(--text)",
    padding: "6px 8px",
    borderRadius: 6,
  }
  const inputStyle: React.CSSProperties = {
    background: "var(--input-bg, var(--button))",
    border: "1px solid var(--input-border, var(--button-border))",
    color: "var(--text)",
    padding: "6px 8px",
    borderRadius: 6,
  }

  return (
    <div
      className="panel"
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        padding: 8,
        borderRadius: 6,
        marginBottom: 8,
      }}
    >
      <h3
        className="panel-header"
        style={{
          cursor: "pointer",
          margin: 0,
          fontSize: 14,
          color: "var(--text-strong)",
        }}
        onClick={() => setOpen(!open)}
      >
        Groups {open ? "▾" : "▸"}
      </h3>

      {open && (
        <div className="panel-body" style={{ marginTop: 8, fontSize: 13 }}>
          <button onClick={makeGroup} style={{ ...btn, marginBottom: 8 }}>
            Group Selection
          </button>

          {groupsWithBounds.map(({ g, bbox }: any) => {
            const grad = ensureGradient(g)
            const isCollapsed = !!collapsed[g.id]

            return (
              <div
                key={g.id}
                style={{
                  borderTop: "1px solid var(--border)",
                  marginTop: 8,
                  paddingTop: 8,
                }}
              >
                {/* Collapsible header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => toggleGroup(g.id)}
                      title={isCollapsed ? "Expand" : "Collapse"}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-strong)",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                    >
                      {isCollapsed ? "▸" : "▾"}
                    </button>

                    <button
                      onClick={() => toggleGroup(g.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: g.color,
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 700,
                      }}
                      title={g.name}
                    >
                      {g.name}
                    </button>

                    <button onClick={() => setSelection([...g.memberIds])} title="Select group" style={btn}>
                      Select
                    </button>
                    <button onClick={() => ungroupGroup(g.id)} title="Ungroup" style={btn}>
                      Ungroup
                    </button>
                  </div>

                  {bbox && (
                    <div style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {bbox.w}×{bbox.h}px @ ({bbox.x}, {bbox.y})
                    </div>
                  )}
                </div>

                {/* Details (collapsible content) */}
                {!isCollapsed && (
                  <>
                    {/* Name */}
                    <label style={fieldLabel}>Name</label>
                    <input
                      type="text"
                      value={g.name}
                      onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                      onKeyDown={stopKeyBubble}
                      style={{ ...inputStyle, width: "100%" }}
                    />

                    {/* Border Colour */}
                    <label style={fieldLabel}>Border Colour</label>
                    <input
                      type="color"
                      value={g.color}
                      onChange={(e) => updateGroup(g.id, { color: e.target.value })}
                      onKeyDown={stopKeyBubble}
                      style={{ width: 44, height: 28 }}
                    />

                    {/* Border thickness */}
                    <label style={fieldLabel}>Border Thickness</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={g.borderWidth ?? 2}
                      onChange={(e) =>
                        updateGroup(g.id, { borderWidth: parseInt(e.target.value, 10) })
                      }
                      onKeyDown={stopKeyBubble}
                      style={inputStyle}
                    />

                    {/* Label font size */}
                    <label style={fieldLabel}>Label Font Size</label>
                    <input
                      type="number"
                      min={8}
                      max={1000}
                      value={g.fontSize ?? 16}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10)
                        if (!Number.isNaN(n)) updateGroup(g.id, { fontSize: n })
                      }}
                      onKeyDown={stopKeyBubble}
                      style={inputStyle}
                    />

                    {/* Label bg */}
                    <label style={fieldLabel}>Label Background</label>
                    <input
                      type="color"
                      value={g.labelBg ?? "#000000"}
                      onChange={(e) => updateGroup(g.id, { labelBg: e.target.value })}
                      onKeyDown={stopKeyBubble}
                      style={{ width: 44, height: 28 }}
                    />

                    {/* Label text color */}
                    <label style={fieldLabel}>Label Text Color</label>
                    <input
                      type="color"
                      value={g.labelTextColor ?? "#ffffff"}
                      onChange={(e) => updateGroup(g.id, { labelTextColor: e.target.value })}
                      onKeyDown={stopKeyBubble}
                      style={{ width: 44, height: 28 }}
                    />

                    {/* -------- Group Fill (Gradient) -------- */}
                    <div
                      style={{
                        marginTop: 10,
                        padding: 10,
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        background: "var(--bg-subtle, rgba(255,255,255,0.03))",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-strong)" }}>
                          Group Fill (Gradient)
                        </div>
                        {/* Restored Randomize button */}
                        <button
                          onClick={() => {
                            const eg = ensureGradient(g)
                            if (eg.mode === "1") {
                              updateGroup(g.id, { gradient: { mode: "1", color: randomHex() } })
                            } else if (eg.mode === "2") {
                              updateGroup(g.id, {
                                gradient: {
                                  mode: "2",
                                  colors: [randomHex(), randomHex()],
                                  direction: eg.direction || "horizontal",
                                }
                              })
                            } else {
                              updateGroup(g.id, {
                                gradient: {
                                  mode: "4",
                                  colors: [randomHex(), randomHex(), randomHex(), randomHex()]
                                }
                              })
                            }
                          }}
                          style={btn}
                          title="Randomize current fill"
                        >
                          Randomize
                        </button>
                      </div>

                      {/* Mode */}
                      <label style={fieldLabel}>Mode</label>
                      <select
                        value={grad.mode}
                        onChange={(e) => {
                          const mode = e.target.value as "1"|"2"|"4"
                          if (mode === "1") {
                            updateGroup(g.id, { gradient: { mode: "1", color: grad.color || g.color || "#4a90e2" } })
                          } else if (mode === "2") {
                            const c0 = Array.isArray(grad.colors) ? grad.colors[0] : g.color || "#4a90e2"
                            const c1 = Array.isArray(grad.colors) ? grad.colors[1] : "#ffffff"
                            updateGroup(g.id, { gradient: { mode: "2", colors: [c0, c1], direction: grad.direction || "horizontal" } })
                          } else {
                            const c4 = Array.isArray(grad.colors) && grad.colors.length === 4
                              ? grad.colors
                              : [g.color || "#2b2b2b", "#4b4b4b", "#6b6b6b", "#8b8b8b"]
                            updateGroup(g.id, { gradient: { mode: "4", colors: c4 } })
                          }
                        }}
                        onKeyDown={stopKeyBubble}
                        style={selectStyle}
                      >
                        <option value="1">One colour</option>
                        <option value="2">Two colours</option>
                        <option value="4">Four colours</option>
                      </select>

                      {/* One colour */}
                      {grad.mode === "1" && (
                        <>
                          <label style={fieldLabel}>Colour</label>
                          <input
                            type="color"
                            value={grad.color || g.color || "#4a90e2"}
                            onChange={(e) => updateGroup(g.id, { gradient: { mode: "1", color: e.target.value } })}
                            onKeyDown={stopKeyBubble}
                            style={{ width: 44, height: 28 }}
                          />
                        </>
                      )}

                      {/* Two colours */}
                      {grad.mode === "2" && (
                        <>
                          <label style={fieldLabel}>Colours</label>
                          <div style={row}>
                            <input
                              type="color"
                              value={(grad.colors?.[0]) || g.color || "#4a90e2"}
                              onChange={(e) => {
                                const c0 = e.target.value
                                const c1 = grad.colors?.[1] || "#ffffff"
                                updateGroup(g.id, { gradient: { mode: "2", colors: [c0, c1], direction: grad.direction || "horizontal" } })
                              }}
                              onKeyDown={stopKeyBubble}
                              style={{ width: 44, height: 28 }}
                            />
                            <input
                              type="color"
                              value={(grad.colors?.[1]) || "#ffffff"}
                              onChange={(e) => {
                                const c1 = e.target.value
                                const c0 = grad.colors?.[0] || g.color || "#4a90e2"
                                updateGroup(g.id, { gradient: { mode: "2", colors: [c0, c1], direction: grad.direction || "horizontal" } })
                              }}
                              onKeyDown={stopKeyBubble}
                              style={{ width: 44, height: 28 }}
                            />
                          </div>

                          <label style={fieldLabel}>Direction</label>
                          <select
                            value={grad.direction || "horizontal"}
                            onChange={(e) => updateGroup(g.id, { gradient: { mode: "2", colors: grad.colors || [g.color || "#4a90e2", "#ffffff"], direction: e.target.value as any } })}
                            onKeyDown={stopKeyBubble}
                            style={selectStyle}
                          >
                            <option value="horizontal">Horizontal</option>
                            <option value="vertical">Vertical</option>
                            <option value="diag">Diagonal</option>
                          </select>
                        </>
                      )}

                      {/* Four colours */}
                      {grad.mode === "4" && (
                        <>
                          <label style={fieldLabel}>Corner colours (TL, TR, BR, BL)</label>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 44px)", gap: 8 }}>
                            {(grad.colors || [g.color || "#2b2b2b", "#4b4b4b", "#6b6b6b", "#8b8b8b"]).map((cc: string, i: number) => (
                              <input
                                key={i}
                                type="color"
                                value={cc}
                                onChange={(e) => {
                                  const arr = [...(grad.colors || [])]
                                  arr[i] = e.target.value
                                  while (arr.length < 4) arr.push("#888888")
                                  updateGroup(g.id, { gradient: { mode: "4", colors: arr.slice(0,4) } })
                                }}
                                onKeyDown={stopKeyBubble}
                                style={{ width: 44, height: 28 }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* -------- end gradient -------- */}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}