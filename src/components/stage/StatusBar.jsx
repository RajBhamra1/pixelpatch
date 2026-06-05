import { useProject } from '@/store/projectStore';

export default function StatusBar({ mousePos }) {
  const { project, selection } = useProject();
  const { canvas } = project;

  return (
    <div className="h-6 shrink-0 bg-card border-t border-border flex items-center px-3 gap-4 text-xs font-mono text-muted-foreground">
      <span>Canvas: {canvas.widthPx}×{canvas.heightPx}px</span>
      <span>Zoom: {((canvas.zoom ?? 1) * 100).toFixed(0)}%</span>
      <span>Mouse: {mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)}</span>
      <span className="ml-auto">{selection.ids.length > 0 ? `${selection.ids.length} selected` : `${project.modules.length} modules`}</span>
    </div>
  );
}