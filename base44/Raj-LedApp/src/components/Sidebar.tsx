import React, { useState } from "react"
import CanvasPanel from "./Sidebar/CanvasPanel"
import ModulesPanel from "./Sidebar/ModulesPanel"
import GuidesPanel from "./Sidebar/GuidesPanel"
import AssetsPanel from "./Sidebar/AssetsPanel"
import ExportPanel from "./Sidebar/ExportPanel"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="sidebar-section">
      <div
        className="sidebar-header"
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          padding: "8px",
          background: "#ddd",
          borderBottom: "1px solid #bbb",
          fontWeight: "bold",
        }}
      >
        {title} {open ? "▲" : "▼"}
      </div>
      {open && <div style={{ padding: "8px" }}>{children}</div>}
    </div>
  )
}

export default function Sidebar() {
  return (
    <div className="sidebar">
      <Section title="Canvas">
        <CanvasPanel />
      </Section>
      <Section title="Modules">
        <ModulesPanel />
      </Section>
      <Section title="Guides">
        <GuidesPanel />
      </Section>
      <Section title="Assets">
        <AssetsPanel />
      </Section>
      <Section title="Export">
        <ExportPanel />
      </Section>
    </div>
  )
}
