import  './index.css'
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./theme/themes.css"   // ← theme tokens
import "./index.css"          // ← global overrides (added below)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)