import React from 'react'
import { useProject } from '@store/projectStore'

export default function StatusBar({ mousePos }:{ mousePos: {x:number,y:number} }) {
  const { project } = useProject()
  return (
    <div className="statusbar">
      <div>Canvas: {project.canvas.widthPx}×{project.canvas.heightPx}px • Zoom: {(project.canvas.zoom*100).toFixed(0)}%</div>
      <div>Mouse: {mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)}</div>
    </div>
  )
}
