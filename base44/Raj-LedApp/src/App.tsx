import React, { useState } from "react"
import Toolbar from "@components/Toolbar"
import ModulesPanel from "@components/Sidebar/ModulesPanel"
import CanvasPanel from "@components/Sidebar/CanvasPanel"
import AssetsPanel from "@components/Sidebar/AssetsPanel"
import ExportPanel from "@components/Sidebar/ExportPanel"
import StageViewport from "@components/StageViewport"
import StatusBar from "@components/StatusBar"
import GroupsPanel from "@components/Sidebar/GroupsPanel"
import Splash from "@components/Splash"
import ThemeSwitcher from "@components/ThemeSwitcher"

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return (
      <Splash
        onNewProject={() => setShowSplash(false)}
        onOpenProject={() => setShowSplash(false)}
        onContinue={() => setShowSplash(false)}
      />
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-app)", color: "var(--text)" }}>
      {/* Sidebar */}
      <div style={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
        <Toolbar onLogoClick={() => setShowSplash(true)} />
        <ThemeSwitcher />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <CanvasPanel />
          <ModulesPanel />
          <GroupsPanel />
          <AssetsPanel />
          <ExportPanel />
        </div>
      </div>

      {/* Main Stage */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <StageViewport setStageRef={() => {}} onMousePos={setMousePos} />
        <StatusBar mousePos={mousePos} />
      </div>
    </div>
  )
}