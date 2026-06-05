import React from "react";
import { useProject } from "@store/projectStore";

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--button)",
  color: "var(--text)",
  fontSize: 16,
  cursor: "pointer",
};

export default function Toolbar({
  animOn,
  setAnimOn,
}: {
  animOn: boolean;
  setAnimOn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
  project,
  setProjectCanvasZoom,
  setProjectCanvasShowGrid,
  toggleSnapEnabled,
  updateCanvas,          // 🔹 Greyscale 
} = useProject();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
        right: 10,
        zIndex: 1000,
        display: "flex",
        gap: 4,
        background: "rgba(15,15,20,0.72)",
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        color: "var(--text)",
        backdropFilter: "blur(6px)",
        pointerEvents: "auto",
      }}
    >
      {/* Logo */}
      <img src="/public/logo.svg" alt="Logo" style={{ height: 40, marginRight: 4 }} />

      {/* Reset Zoom */}
      <button onClick={() => setProjectCanvasZoom(1)} style={btnStyle} title="Reset Zoom">
        🔄
      </button>

      {/* Zoom In */}
      <button
        onClick={() => setProjectCanvasZoom((project.canvas.zoom ?? 1) * 1.2)}
        style={btnStyle}
        title="Zoom In"
      >
        ➕
      </button>

      {/* Zoom Out */}
      <button
        onClick={() => setProjectCanvasZoom((project.canvas.zoom ?? 1) / 1.2)}
        style={btnStyle}
        title="Zoom Out"
      >
        ➖
      </button>

      {/* Toggle Grid */}
      <button
        onClick={() => setProjectCanvasShowGrid(!project.canvas.showGrid)}
        style={{
          ...btnStyle,
          background: project.canvas.showGrid ? "var(--accent-2)" : "var(--button)",
          border: "1px solid var(--border)",
          color: "#fff",
        }}
        title="Toggle Grid"
      >
        {project.canvas.showGrid ? "GRID ON" : "GRID OFF"}
      </button>

      {/* Snap to Grid */}
      <button
        onClick={() => toggleSnapEnabled()}
        style={{
          ...btnStyle,
          background: project.canvas.snapEnabled ? "var(--accent-3)" : "var(--button)",
          border: "1px solid var(--border)",
          color: "#fff",
        }}
        title="Snap to Grid"
      >
        {project.canvas.snapEnabled ? "SNAP ON" : "SNAP OFF"}
      </button>

    </div>
  );
}