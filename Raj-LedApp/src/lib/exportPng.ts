import { Stage } from 'konva/lib/Stage'

export function exportPNG(stage: Stage, fileName: string = 'pixel-map.png') {
  const dataURL = stage.toDataURL({ pixelRatio: 2 })
  const a = document.createElement('a')
  a.href = dataURL
  a.download = fileName
  a.click()
}
