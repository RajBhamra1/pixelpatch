import { create } from "zustand"

type ThemeName = "neon" | "dark" | "light"

type UIState = {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
}

export const useUI = create<UIState>((set) => {
  const persisted = (localStorage.getItem("lpm_theme") as ThemeName) || "neon"
  return {
    theme: persisted,
    setTheme: (t) => {
      localStorage.setItem("lpm_theme", t)
      set({ theme: t })
      document.documentElement.setAttribute("data-theme", t)
    },
  }
})

// initialize attribute on first load
document.documentElement.setAttribute(
  "data-theme",
  (localStorage.getItem("lpm_theme") as ThemeName) || "neon"
)