import React from "react"
import { useUI } from "@store/uiStore"

const themes: { key: "neon"|"dark"|"light"|"sunbelt"; label: string }[] = [
  { key: "neon", label: "Neon" },
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "sunbelt", label: "Sunbelt" },
]

export default function ThemeSwitcher() {
  const theme = useUI((s) => s.theme)
  const setTheme = useUI((s) => s.setTheme)

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px" }}>
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Theme</span>
      <div style={{ display: "flex", gap: 6 }}>
        {themes.map((t) => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: theme === t.key ? "linear-gradient(90deg, var(--accent-1), var(--accent-2))" : "var(--button)",
              color: theme === t.key ? "#fff" : "var(--text)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}