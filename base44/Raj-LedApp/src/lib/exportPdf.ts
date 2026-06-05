import jsPDF from 'jspdf'
import { Stage } from 'konva/lib/Stage'

export function exportPDF(stage: Stage, options?: { page?: 'auto'|'A4'|'A3', fileName?: string }) {
  const { page = 'auto', fileName = 'pixel-map.pdf' } = options || {}
  const dataURL = stage.toDataURL({ pixelRatio: 2 })
  let pdf: jsPDF
  if (page === 'A4') pdf = new jsPDF({ orientation: 'landscape', format: 'a4', unit: 'pt' })
  else if (page === 'A3') pdf = new jsPDF({ orientation: 'landscape', format: 'a3', unit: 'pt' })
  else pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight()
  const margin = 36
  pdf.addImage(dataURL, 'PNG', margin, margin, pageW - margin*2, pageH - margin*2)
  pdf.save(fileName)
}
