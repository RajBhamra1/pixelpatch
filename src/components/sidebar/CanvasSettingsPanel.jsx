import { useState, useEffect } from 'react';
import { useProject } from '@/store/projectStore';
import SidebarPanel from './SidebarPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const inputCls = 'h-7 text-xs bg-secondary border-border text-foreground';
const labelCls = 'text-xs text-muted-foreground mb-1';

export default function CanvasSettingsPanel() {
  const { project, updateCanvas } = useProject();
  const [width, setWidth] = useState(project.canvas.widthPx.toString());
  const [height, setHeight] = useState(project.canvas.heightPx.toString());
  const [gridSize, setGridSize] = useState(project.canvas.gridSize.toString());

  useEffect(() => {
    setWidth(project.canvas.widthPx.toString());
    setHeight(project.canvas.heightPx.toString());
    setGridSize(project.canvas.gridSize.toString());
  }, [project.canvas.widthPx, project.canvas.heightPx, project.canvas.gridSize]);

  const applyNum = (field, raw) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) updateCanvas({ [field]: Math.floor(n) });
  };

  return (
    <SidebarPanel title="Canvas">
      <div className="flex gap-1 mb-2">
        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs"
          onClick={() => updateCanvas({ widthPx: 1920, heightPx: 1080 })}>1080p</Button>
        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs"
          onClick={() => updateCanvas({ widthPx: 3840, heightPx: 2160 })}>4K</Button>
      </div>

      <div className="space-y-1.5">
        <div>
          <p className={labelCls}>Width (px)</p>
          <Input className={inputCls} type="number" value={width}
            onChange={(e) => { setWidth(e.target.value); applyNum('widthPx', e.target.value); }}
            onBlur={() => applyNum('widthPx', width)} />
        </div>
        <div>
          <p className={labelCls}>Height (px)</p>
          <Input className={inputCls} type="number" value={height}
            onChange={(e) => { setHeight(e.target.value); applyNum('heightPx', e.target.value); }}
            onBlur={() => applyNum('heightPx', height)} />
        </div>
        <div>
          <p className={labelCls}>Grid Size (px)</p>
          <Input className={inputCls} type="number" value={gridSize}
            onChange={(e) => { setGridSize(e.target.value); applyNum('gridSize', e.target.value); }}
            onBlur={() => applyNum('gridSize', gridSize)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Grid Color</span>
          <input type="color" value={project.canvas.gridColor || '#333333'}
            onChange={(e) => updateCanvas({ gridColor: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Canvas BG</span>
          <input type="color" value={project.canvas.canvasBg || '#000000'}
            onChange={(e) => updateCanvas({ canvasBg: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">Viewport BG</span>
          <input type="color" value={project.canvas.viewportBg || '#1a1a2e'}
            onChange={(e) => updateCanvas({ viewportBg: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent" />
        </div>
      </div>
    </SidebarPanel>
  );
}