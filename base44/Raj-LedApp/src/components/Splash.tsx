import React, { useEffect, useMemo, useState } from "react"

type SplashProps = {
  onNewProject?: () => void
  onOpenProject?: () => void
  onContinue?: () => void
  projectName?: string
  canvasSize?: { w: number; h: number }
  // Optional tuning
  cellSize?: number   // px size of each grid cell
  dotSize?: number    // px diameter of the dot
}

export default function Splash({
  onNewProject,
  onOpenProject,
  onContinue,
  projectName = "Untitled Project",
  canvasSize = { w: 3840, h: 2160 },
  cellSize = 28,     // tighter grid (was 36)
  dotSize = 6,       // slightly smaller dot
}: SplashProps) {
  // Compute rows/cols so the grid covers the entire viewport exactly
  const [grid, setGrid] = useState(() => calcGrid(cellSize))

  useEffect(() => {
    const onResize = () => setGrid(calcGrid(cellSize))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [cellSize])

  // Build just enough animated dots to fill the grid
  const dots = useMemo(() => {
    const total = grid.cols * grid.rows
    const items: { key: string; delay: number }[] = []
    for (let i = 0; i < total; i++) {
      // make wavey delay based on position
      const x = i % grid.cols
      const y = Math.floor(i / grid.cols)
      items.push({ key: `d${i}`, delay: (x + y) * 22 })
    }
    return items
  }, [grid.cols, grid.rows])

  return (
    <div style={styles.wrap}>
      {/* Animated dots that truly fill the viewport */}
      <div
        style={{
          ...styles.dotsGrid,
          gridTemplateColumns: `repeat(${grid.cols}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
        }}
        aria-hidden
      >
        {dots.map((d, i) => (
          <span
            key={d.key}
            style={{
              ...styles.dot,
              width: dotSize,
              height: dotSize,
              animationDelay: `${d.delay}ms`,
              opacity: 0.22 + ((i % 7) / 10) * 0.5,
            }}
          />
        ))}
      </div>

      {/* Center hero card */}
      <div style={styles.heroCard}>
        <img
          src="/logo.svg"
          alt="LED Pixel Map"
          style={{
            width: 84,
            height: 84,
            marginBottom: 12,
            filter: "drop-shadow(0 0 12px rgba(124,77,255,0.55))",
          }}
        />
        <h1 style={styles.h1}>LED Pixel Map</h1>
        <p style={styles.sub}>Design pixel-accurate LED walls. Snap, group, export — fast.</p>

        <div style={styles.ctaRow}>
          <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={onNewProject}>New Project</button>
          <button style={styles.btn} onClick={onOpenProject}>Open Project</button>
          <button style={styles.btnGhost} onClick={onContinue}>Continue</button>
        </div>

        <div style={styles.meta}>
          <div>{projectName}</div>
          <div style={{ opacity: 0.7 }}>Canvas: {canvasSize.w}×{canvasSize.h}px</div>
        </div>

        <div style={styles.credit}>Made by Raj Bhamra</div>
      </div>

      {/* Self-contained animation */}
      <style>
        {`
          @keyframes pulse {
            0%   { transform: scale(0.8); opacity: 0.25; }
            50%  { transform: scale(1.0); opacity: 0.9; }
            100% { transform: scale(0.8); opacity: 0.25; }
          }
        `}
      </style>
    </div>
  )
}

function calcGrid(cellSize: number) {
  const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  // Columns/rows that fully cover viewport (ceil) – no padding, no gaps
  const cols = Math.ceil(vw / cellSize)
  const rows = Math.ceil(vh / cellSize)
  return { cols, rows }
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "#0f0f12",
    overflow: "hidden",
    zIndex: 9999,
  },

  dotsGrid: {
    position: "absolute",
    inset: 0,
    display: "grid",
    gap: 0,            // no gaps so it reaches edges
    pointerEvents: "none",
    zIndex: 1,
  },

  dot: {
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00E5FF, #7C4DFF, #FF4081)",
    boxShadow: "0 0 8px rgba(124,77,255,0.5)",
    animation: "pulse 2000ms ease-in-out infinite",
    willChange: "transform, opacity",
  },

  heroCard: {
    position: "relative",
    zIndex: 2,
    width: 560,
    maxWidth: "92vw",
    padding: "32px 28px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(22,22,28,0.85) 0%, rgba(12,12,16,0.85) 100%)",
    boxShadow: "0 14px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
    color: "#E8EAFF",
    textAlign: "center",
    backdropFilter: "blur(8px)",
  },

  h1: {
    margin: "6px 0 8px",
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: 0.2,
    backgroundImage: "linear-gradient(90deg, #00E5FF, #7C4DFF, #FF4081)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  sub: {
    margin: "0 0 16px",
    fontSize: 16,
    color: "rgba(230,235,255,0.85)",
  },

  ctaRow: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },

  btn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#23262f",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 14,
    minWidth: 130,
  },

  btnPrimary: {
    background: "linear-gradient(90deg, #00E5FF, #7C4DFF)",
    border: "1px solid rgba(124,77,255,0.6)",
    boxShadow: "0 4px 18px rgba(124,77,255,0.45)",
    fontWeight: 700,
  },

  btnGhost: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(230,235,255,0.85)",
    cursor: "pointer",
    minWidth: 130,
  },

  meta: {
    display: "flex",
    gap: 16,
    justifyContent: "center",
    marginTop: 14,
    fontSize: 12,
    color: "rgba(230,235,255,0.7)",
    flexWrap: "wrap",
  },

  credit: {
    marginTop: 18,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontStyle: "italic",
  },
}